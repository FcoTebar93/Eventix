import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { GetFavoritesQuery } from '../schemas/favorites.schema';
import { EventStatus } from '@prisma/client';

export const addFavorite = async (userId: string, eventId: string) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, status: true },
    });

    if (!event) {
        throw new AppError('Evento no encontrado', 404);
    }

    if (event.status !== EventStatus.PUBLISHED) {
        throw new AppError('Solo se pueden agregar eventos publicados a favoritos', 400);
    }

    const existingFavorite = await prisma.favorite.findUnique({
        where: {
            userId_eventId: {
                userId,
                eventId,
            },
        },
        include: {
            event: {
                include: {
                    organizer: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    tags: {
                        include: {
                            tag: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            tickets: true,
                            reviews: true,
                            favorites: true,
                        },
                    },
                },
            },
        },
    });

    if (existingFavorite) {
        return existingFavorite;
    }

    const favorite = await prisma.favorite.create({
        data: {
            userId,
            eventId,
        },
        include: {
            event: {
                include: {
                    organizer: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    tags: {
                        include: {
                            tag: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            tickets: true,
                            reviews: true,
                            favorites: true,
                        },
                    },
                },
            },
        },
    });

    return favorite;
};

export const removeFavorite = async (userId: string, eventId: string) => {
    const favorite = await prisma.favorite.findUnique({
        where: {
            userId_eventId: {
                userId,
                eventId,
            },
        },
    });

    if (!favorite) {
        return { message: 'Favorito eliminado correctamente' };
    }

    await prisma.favorite.delete({
        where: {
            userId_eventId: {
                userId,
                eventId,
            },
        },
    });

    return { message: 'Favorito eliminado correctamente' };
};

export const getFavorites = async (userId: string, query: GetFavoritesQuery) => {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const validLimit = Math.min(Math.max(limit, 1), 100);
    const validPage = Math.max(page, 1);

    const [favorites, total] = await Promise.all([
        prisma.favorite.findMany({
            where: {
                userId,
            },
            include: {
                event: {
                    include: {
                        organizer: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        tags: {
                            include: {
                                tag: {
                                    select: {
                                        id: true,
                                        name: true,
                                        slug: true,
                                    },
                                },
                            },
                        },
                        _count: {
                            select: {
                                tickets: true,
                                reviews: true,
                                favorites: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take: validLimit,
        }),
        prisma.favorite.count({
            where: {
                userId,
            },
        }),
    ]);

    return {
        favorites: favorites.map((f) => ({
            ...f.event,
            isFavorite: true,
        })),
        total,
        page: validPage,
        totalPages: Math.ceil(total / validLimit),
    };
};

export const isFavorite = async (userId: string, eventId: string): Promise<boolean> => {
    const favorite = await prisma.favorite.findUnique({
        where: {
            userId_eventId: {
                userId,
                eventId,
            },
        },
    });

    return !!favorite;
};

export const getFavoritesBatch = async (
    userId: string,
    eventIds: string[],
): Promise<Record<string, boolean>> => {
    if (eventIds.length === 0) return {};

    const favorites = await prisma.favorite.findMany({
        where: { userId, eventId: { in: eventIds } },
        select: { eventId: true },
    });

    const favoriteSet = new Set(favorites.map(f => f.eventId));
    return Object.fromEntries(eventIds.map(id => [id, favoriteSet.has(id)]));
};
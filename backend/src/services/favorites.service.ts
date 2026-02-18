import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { GetFavoritesQuery } from '../schemas/favorites.schema';
import { EventStatus } from '@prisma/client';

export const addFavorite = async (userId: string, eventId: string) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
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

    // Si no existe, retornar éxito de todas formas (idempotente)
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

export const getFavoritesBatch = async (userId: string, eventIds: string[]): Promise<Record<string, boolean>> => {
    if (eventIds.length === 0) return {};
    const favorites = await prisma.favorite.findMany({
      where: { userId, eventId: { in: eventIds } },
      select: { eventId: true },
    });
    const set = new Set(favorites.map(f => f.eventId));
    const result: Record<string, boolean> = {};
    eventIds.forEach(id => { result[id] = set.has(id); });
    return result;
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
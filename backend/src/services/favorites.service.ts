import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { GetFavoritesQuery } from '../schemas/favorites.schema';
import { EventStatus } from '@prisma/client';

export const addFavorite = async (userId: string, eventId: string) => {
    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });

    if (!event) {
        throw new AppError('Evento no encontrado', 404);
    }

    // Verificar que el evento está publicado
    if (event.status !== EventStatus.PUBLISHED) {
        throw new AppError('Solo se pueden agregar eventos publicados a favoritos', 400);
    }

    // Verificar si ya es favorito - hacer idempotente
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

    // Si ya existe, retornarlo en lugar de lanzar error (idempotente)
    if (existingFavorite) {
        return existingFavorite;
    }

    // Crear el favorito
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
            isFavorite: true, // Asegurar que todos los eventos de favoritos tengan isFavorite: true
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
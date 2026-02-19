import { EventStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { CreateEventInput, UpdateEventInput, GetEventsQuery } from '../schemas/events.schema';
import { getEventsListCacheKey, getEventCacheKey, getFromCache, setCache, deleteCache } from '../utils/cache';
import { associateTagsToEvent } from '../utils/tags';

type GetEventsResult = {
    events: Array<{
        id: string;
        title: string;
        description: string | null;
        venue: string;
        address: string | null;
        city: string;
        country: string;
        date: Date;
        status: EventStatus;
        imageUrl: string | null;
        category: string | null;
        organizerId: string;
        createdAt: Date;
        updatedAt: Date;
        organizer: {
            id: string;
            name: string;
        };
        tags: Array<{
            id: string;
            tag: {
                id: string;
                name: string;
                slug: string;
            };
        }>;
        _count: {
            tickets: number;
            reviews: number;
        };
    }>;
    total: number;
    page: number;
    totalPages: number;
};

export const createEvent = async (
    organizerId: string,
    data: CreateEventInput,
) => {
    const eventData: Prisma.EventUncheckedCreateInput = {
        title: data.title,
        venue: data.venue,
        city: data.city,
        country: data.country,
        date: new Date(data.date),
        status: data.status || EventStatus.DRAFT,
        organizerId,
    };

    if (data.description !== undefined) {
        eventData.description = data.description;
    }
    if (data.address !== undefined) {
        eventData.address = data.address;
    }
    if (data.imageUrl !== undefined) {
        eventData.imageUrl = data.imageUrl;
    }
    if (data.category !== undefined) {
        eventData.category = data.category;
    }

    const event = await prisma.event.create({
        data: eventData,
        include: {
            organizer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    if (data.tags && data.tags.length > 0) {
        await associateTagsToEvent(event.id, data.tags);
    }

    await deleteCache('events:list:*');

    return event;
};

export const getEvents = async (query: GetEventsQuery) => {
    const {
        page = 1,
        limit = 10,
        status,
        category,
        city,
        search,
        dateFrom,
        dateTo,
        tags,
    } = query;

    const skip = (page - 1) * limit;
    const validLimit = Math.min(Math.max(limit, 1), 100);
    const validPage = Math.max(page, 1);

    const where: Prisma.EventWhereInput = {};

    if (status) {
        where.status = status;
    } else {
        where.status = EventStatus.PUBLISHED;
    }

    if (category) {
        where.category = category;
    }

    if (city) {
        where.city = {
            contains: city,
        };
    }

    if (search) {
        where.OR = [
            { title: { contains: search } },
            { description: { contains: search } },
            { venue: { contains: search } },
        ];
    }

    if (tags) {
        const tagArray = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        if (tagArray.length > 0) {
            const matchingTags = await prisma.tag.findMany({
                where: {
                    slug: {
                        in: tagArray,
                    },
                },
                select: {
                    id: true,
                },
            });

            if (matchingTags.length > 0) {
                where.tags = {
                    some: {
                        tagId: {
                            in: matchingTags.map(t => t.id),
                        },
                    },
                };
            }
        }
    }

    if (dateFrom || dateTo) {
        const dateFilter: Prisma.DateTimeFilter = {};
        if (dateFrom) {
            dateFilter.gte = new Date(dateFrom);
        }
        if (dateTo) {
            dateFilter.lte = new Date(dateTo);
        }
        where.date = dateFilter;
    }

    const cacheKey = getEventsListCacheKey({
        page: validPage,
        limit: validLimit,
        status: where.status as EventStatus | undefined,
        category: category,
        city: city,
        search: query.search,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        tags: tags,
    });
      
    const cached = await getFromCache<GetEventsResult>(cacheKey);
    if (cached) {
        const hasTags = cached.events.every(event => 
            event.tags && Array.isArray(event.tags)
        );
        if (!hasTags) {
            await deleteCache(cacheKey);
        } else {
            return cached;
        }
    }

    const [events, total] = await Promise.all([
        prisma.event.findMany({
            where,
            skip,
            take: validLimit,
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
                    },
                },
            },
            orderBy: {
                date: 'asc',
            },
        }),
        prisma.event.count({ where }),
    ]);

    await setCache(cacheKey, {
        events,
        total,
        page: validPage,
        totalPages: Math.ceil(total / validLimit),
    });

    return {
        events,
        total,
        page: validPage,
        totalPages: Math.ceil(total / validLimit),
    };
};

export const getEventById = async (eventId: string, userId?: string) => {
    const cacheKey = getEventCacheKey(eventId);
    
    const cached = await getFromCache(cacheKey);
    if (cached) {
        const event = cached as any;
        if (!event.tags || !Array.isArray(event.tags)) {
            await deleteCache(cacheKey);
        } else {
            if (event.status === EventStatus.DRAFT && event.organizerId !== userId) {
                throw new AppError('Evento no encontrado', 404);
            }
            return event;
        }
    }

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            organizer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
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
    });

    if (!event) {
        throw new AppError('Evento no encontrado', 404);
    }

    if (event.status === EventStatus.DRAFT && event.organizerId !== userId) {
        throw new AppError('Evento no encontrado', 404);
    }

    await setCache(cacheKey, event);

    return event;
};

export const updateEvent = async (
    eventId: string,
    organizerId: string,
    data: UpdateEventInput,
) => {
    const existingEvent = await prisma.event.findUnique({
        where: { id: eventId },
    });

    if (!existingEvent) {
        throw new AppError('Evento no encontrado', 404);
    }

    if (existingEvent.organizerId !== organizerId) {
        throw new AppError('No tienes permisos para actualizar este evento', 403);
    }

    if (
        existingEvent.status === EventStatus.COMPLETED ||
        existingEvent.status === EventStatus.CANCELLED
    ) {
        throw new AppError(
            'No se puede actualizar un evento completado o cancelado',
            400,
        );
    }

    const updateData: Prisma.EventUpdateInput = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.venue !== undefined) updateData.venue = data.venue;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.date !== undefined) {
        updateData.date = new Date(data.date);
    }
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.status !== undefined) updateData.status = data.status;

    const event = await prisma.event.update({
        where: { id: eventId },
        data: updateData,
        include: {
            organizer: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    if (data.tags !== undefined) {
        await associateTagsToEvent(eventId, data.tags);
    }

    await Promise.all([
        deleteCache(getEventCacheKey(eventId)),
        deleteCache('events:list:*'),
    ]);

    return event;
};

export const deleteEvent = async (eventId: string, organizerId: string) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });

    if (!event) {
        throw new AppError('Evento no encontrado', 404);
    }

    if (event.organizerId !== organizerId) {
        throw new AppError('No tienes permisos para eliminar este evento', 403);
    }

    await prisma.event.update({
        where: { id: eventId },
        data: {
            status: EventStatus.CANCELLED,
        },
    });

    await Promise.all([
        deleteCache(getEventCacheKey(eventId)),
        deleteCache('events:list:*'),
    ]);
};

export const publishEvent = async (eventId: string, organizerId: string) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });

    if (!event) {
        throw new AppError('Evento no encontrado', 404);
    }

    if (event.organizerId !== organizerId) {
        throw new AppError('No tienes permisos para publicar este evento', 403);
    }

    if (event.status !== EventStatus.DRAFT) {
        throw new AppError(
            'Solo se pueden publicar eventos en estado DRAFT',
            400,
        );
    }

    const publishedEvent = await prisma.event.update({
        where: { id: eventId },
        data: {
            status: EventStatus.PUBLISHED,
        },
        include: {
            organizer: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    await Promise.all([
        deleteCache(getEventCacheKey(eventId)),
        deleteCache('events:list:*'),
    ]);

    return publishedEvent;
};

export const getEventsByOrganizer = async (
    organizerId: string,
    includeDrafts: boolean = false,
) => {
    const where: Prisma.EventWhereInput = { organizerId };

    if (!includeDrafts) {
        where.status = EventStatus.PUBLISHED;
    }

    const events = await prisma.event.findMany({
        where,
        include: {
            _count: {
                select: {
                    tickets: true,
                    reviews: true,
                },
            },
        },
        orderBy: {
            date: 'asc',
        },
    });

    return events;
};

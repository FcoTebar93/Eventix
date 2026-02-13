import { EventStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { CreateEventInput, UpdateEventInput, GetEventsQuery } from '../schemas/events.schema';


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
            mode: 'insensitive',
        };
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { venue: { contains: search, mode: 'insensitive' } },
        ];
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

    return {
        events,
        total,
        page: validPage,
        totalPages: Math.ceil(total / validLimit),
    };
};

export const getEventById = async (eventId: string, userId?: string) => {
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

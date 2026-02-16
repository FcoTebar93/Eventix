import { TicketStatus, EventStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import { CreateTicketInput, CreateTicketsBulkInput, UpdateTicketInput, GetTicketsQuery } from '../schemas/tickets.schema';
import { getEventCacheKey, deleteCache } from '../utils/cache';

async function assertEventDraftAndOwned(eventId: string, userId: string, userRole: string) {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });

    if (!event) {
        throw new AppError('Evento no encontrado', 404);
    }

    if (event.status !== EventStatus.DRAFT) {
        throw new AppError(
            'Solo se pueden añadir o modificar tickets en eventos en borrador (DRAFT). Publica el evento después de definir la entrada.',
            400,
        );
    }

    if (event.organizerId !== userId && userRole !== 'ADMIN') {
        throw new AppError('No tienes permisos para gestionar tickets de este evento', 403);
    }

    return event;
}

export const createTicket = async ( eventId: string, organizerId: string, userRole: string, data: CreateTicketInput) => {
    await assertEventDraftAndOwned(eventId, organizerId, userRole);

    const ticket = await prisma.ticket.create({
        data: {
            eventId,
            type: data.type,
            price: data.price,
            section: data.section ?? undefined,
            row: data.row ?? undefined,
            seat: data.seat ?? undefined,
            originalPrice: data.price ?? undefined,
            sellerId: null,
        },
    });

    await Promise.all([
        deleteCache(getEventCacheKey(eventId)),
        deleteCache('events:list:*'),
    ]);

    return ticket;
}

export const createTicketsBulk = async ( eventId: string, organizerId: string, userRole: string, data: CreateTicketsBulkInput) => {
    await assertEventDraftAndOwned(eventId, organizerId, userRole);

    const created = await prisma.$transaction(Array.from({ length: data.quantity }, () => 
        prisma.ticket.create({
            data: {
                eventId,
                type: data.type,
                price: data.price,
                section: data.section ?? undefined,
                row: data.row ?? undefined,
                seat: data.seat ?? undefined,
                },
            })
        ),
    );

    await Promise.all([
        deleteCache(getEventCacheKey(eventId)),
        deleteCache('events:list:*'),
    ]);

     return created;
};

export const getTicketsByEvent = async ( eventId: string, query: GetTicketsQuery, userId: string | undefined, userRole: string) => {
    const { page = 1, limit = 20, status } = query;

    const skip = (page - 1) * limit;
    const validLimit = Math.min(Math.max(limit, 1), 100);

    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });
    if (!event) {
        throw new AppError('Evento no encontrado', 404);
    }

    const isOrganizerOrAdmin =
        event.organizerId === userId || userRole === 'ADMIN';
    if (event.status === EventStatus.DRAFT && !isOrganizerOrAdmin) {
        throw new AppError('Evento no encontrado', 404);
    }

    const where: Prisma.TicketWhereInput = { eventId };
    if (status) {
        where.status = status;
    }

    const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
            where,
            skip,
            take: validLimit,
            orderBy: { createdAt: 'asc' },
        }),
        prisma.ticket.count({ where }),
    ]);

    return {
        tickets,
        total,
        page,
        totalPages: Math.ceil(total / validLimit),
    };
};

export const getTicketById = async ( eventId: string, ticketId: string, userId: string | undefined, userRole: string) => {
    const ticket = await prisma.ticket.findFirst({
        where: { id: ticketId, eventId },
        include: {
            event: {
                select: {
                    id: true,
                    title: true,
                    date: true,
                    status: true,
                    organizerId: true,
                },
            },
        },
    });

    if (!ticket) {
        throw new AppError('Ticket no encontrado', 404);
    }

    if (
        ticket.event.status === EventStatus.DRAFT &&
        ticket.event.organizerId !== userId &&
        userRole !== 'ADMIN'
    ) {
        throw new AppError('Ticket no encontrado', 404);
    }

    return ticket;
};

export const updateTicket = async ( eventId: string, ticketId: string, userId: string | undefined, userRole: string, data: UpdateTicketInput) => {
    if (userId === undefined) {
        throw new AppError('No autenticado', 401);
    }

    await assertEventDraftAndOwned(eventId, userId, userRole);

    const ticket = await prisma.ticket.findFirst({
        where: { id: ticketId, eventId }
    });

    if (!ticket) {
        throw new AppError('Ticket no encontrado', 404);
    }

    if (ticket.status !== TicketStatus.AVAILABLE) {
        throw new AppError(
            'Solo se pueden editar tickets disponibles. Para cancelar uno vendido o reservado, usa la gestión de órdenes.',
            400,
        );
    }

    const updateData: Prisma.TicketUpdateInput = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.section !== undefined) updateData.section = data.section;
    if (data.row !== undefined) updateData.row = data.row;
    if (data.seat !== undefined) updateData.seat = data.seat;
    if (data.status === 'CANCELLED') updateData.status = TicketStatus.CANCELLED;

    const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: updateData,
    });

    await Promise.all([
        deleteCache(getEventCacheKey(eventId)),
        deleteCache('events:list:*'),
    ]);

    return updated;
};

export const deleteTicket = async ( eventId: string, ticketId: string, userId: string, userRole: string,
) => {
    await assertEventDraftAndOwned(eventId, userId, userRole);

    const ticket = await prisma.ticket.findFirst({
        where: { id: ticketId, eventId },
    });
    if (!ticket) {
        throw new AppError('Ticket no encontrado', 404);
    }
    if (ticket.status !== TicketStatus.AVAILABLE) {
        throw new AppError(
            'Solo se pueden eliminar tickets disponibles. Usa actualizar con status CANCELLED para otros casos.',
            400,
        );
    }

    await prisma.ticket.delete({
        where: { id: ticketId },
    });

    await Promise.all([
        deleteCache(getEventCacheKey(eventId)),
        deleteCache('events:list:*'),
    ]);
};
import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { createTicketSchema, createTicketsBulkSchema, updateTicketSchema, eventIdParamsSchema, ticketIdParamsSchema, getTicketsQuerySchema } from '../schemas/tickets.schema';
import * as ticketsService from '../services/tickets.service';
import { logger } from '../utils/logger';

export const createTicket = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    if (!req.user) throw new Error('User not authenticated');
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const body = createTicketSchema.parse(req.body);
    const ticket = await ticketsService.createTicket(
        eventId,
        req.user.userId,
        req.user.role,
        body,
    );
    logger.info(`Ticket creado: ${ticket.id} para evento: ${eventId}`);
    res.status(201).json({
        success: true,
        message: 'Ticket creado exitosamente',
        data: { ticket },
    });
};

export const createTicketsBulk = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    if (!req.user) throw new Error('User not authenticated');
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const body = createTicketsBulkSchema.parse(req.body);
    const tickets = await ticketsService.createTicketsBulk(
        eventId,
        req.user.userId,
        req.user.role,
        body,
    );
    logger.info(
        `${tickets.length} tickets creados para evento: ${eventId} (tipo: ${body.type})`,
    );
    res.status(201).json({
        success: true,
        message: `${tickets.length} tickets creados exitosamente`,
        data: { tickets, count: tickets.length },
    });
};

export const getTicketsByEvent = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    const { eventId } = eventIdParamsSchema.parse(req.params);
    const query = getTicketsQuerySchema.parse(req.query);
    const result = await ticketsService.getTicketsByEvent(
        eventId,
        query,
        req.user?.userId,
        req.user?.role ?? 'BUYER',
    );
    res.status(200).json({
        success: true,
        data: result,
    });
};

export const getTicketById = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    const { eventId, ticketId } = {
        ...eventIdParamsSchema.parse(req.params),
        ...ticketIdParamsSchema.parse(req.params),
    };
    const ticket = await ticketsService.getTicketById(
        eventId,
        ticketId,
        req.user?.userId,
        req.user?.role ?? 'BUYER',
    );
    res.status(200).json({
        success: true,
        data: { ticket },
    });
};

export const updateTicket = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    if (!req.user) throw new Error('User not authenticated');
    const { eventId, ticketId } = {
        ...eventIdParamsSchema.parse(req.params),
        ...ticketIdParamsSchema.parse(req.params),
    };
    const body = updateTicketSchema.parse(req.body);
    const ticket = await ticketsService.updateTicket(
        eventId,
        ticketId,
        req.user.userId,
        req.user.role,
        body,
    );
    res.status(200).json({
        success: true,
        message: 'Ticket actualizado exitosamente',
        data: { ticket },
    });
};

export const deleteTicket = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    if (!req.user) throw new Error('User not authenticated');
    const { eventId, ticketId } = {
        ...eventIdParamsSchema.parse(req.params),
        ...ticketIdParamsSchema.parse(req.params),
    };
    await ticketsService.deleteTicket(
        eventId,
        ticketId,
        req.user.userId,
        req.user.role,
    );
    res.status(200).json({
        success: true,
        message: 'Ticket eliminado exitosamente',
    });
};
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import {
    createEventSchema,
    updateEventSchema,
    eventIdParamsSchema,
    getEventsQuerySchema,
} from '../schemas/events.schema';
import * as eventsService from '../services/events.service';
import * as favoritesService from '../services/favorites.service';
import { logger } from '../utils/logger';

export const createEvent = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const validatedData = createEventSchema.parse(req.body);
        const event = await eventsService.createEvent(
            req.user.userId,
            validatedData,
        );

        logger.info(`Evento creado: ${event.id} por usuario: ${req.user.userId}`);

        res.status(201).json({
            success: true,
            message: 'Evento creado exitosamente',
            data: {
                event,
            },
        });
    } catch (error) {
        throw error;
    }
};

export const getEvents = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const query = getEventsQuerySchema.parse(req.query);
        const result = await eventsService.getEvents(query);
        const userId = (req as AuthenticatedRequest).user?.userId;

        // Si hay un usuario autenticado, agregar información de favoritos
        if (userId) {
            const eventIds = result.events.map(e => e.id);
            const favorites = await Promise.all(
                eventIds.map(eventId => favoritesService.isFavorite(userId, eventId))
            );
            
            result.events = result.events.map((event, index) => ({
                ...event,
                isFavorite: favorites[index],
            }));
        }

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        throw error;
    }
};

export const getEventById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { id } = eventIdParamsSchema.parse(req.params);
        const userId = (req as AuthenticatedRequest).user?.userId;
        const event = await eventsService.getEventById(id, userId);

        // Si hay un usuario autenticado, agregar información de favorito
        let eventWithFavorite = event;
        if (userId) {
            const isFavorite = await favoritesService.isFavorite(userId, id);
            eventWithFavorite = {
                ...event,
                isFavorite,
            };
        }

        res.status(200).json({
            success: true,
            data: {
                event: eventWithFavorite,
            },
        });
    } catch (error) {
        throw error;
    }
};



export const updateEvent = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { id } = eventIdParamsSchema.parse(req.params);
        const validatedData = updateEventSchema.parse(req.body);
        const event = await eventsService.updateEvent(
            id,
            req.user.userId,
            validatedData,
        );

        logger.info(`Evento actualizado: ${id} por usuario: ${req.user.userId}`);

        res.status(200).json({
            success: true,
            message: 'Evento actualizado exitosamente',
            data: {
                event,
            },
        });
    } catch (error) {
        throw error;
    }
};

export const deleteEvent = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { id } = eventIdParamsSchema.parse(req.params);
        await eventsService.deleteEvent(id, req.user.userId);

        logger.info(`Evento eliminado: ${id} por usuario: ${req.user.userId}`);

        res.status(200).json({
            success: true,
            message: 'Evento eliminado exitosamente',
        });
    } catch (error) {
        throw error;
    }
};

export const publishEvent = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { id } = eventIdParamsSchema.parse(req.params);
        const event = await eventsService.publishEvent(id, req.user.userId);

        logger.info(`Evento publicado: ${id} por usuario: ${req.user.userId}`);

        res.status(200).json({
            success: true,
            message: 'Evento publicado exitosamente',
            data: {
                event,
            },
        });
    } catch (error) {
        throw error;
    }
};

export const getMyEvents = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const includeDrafts = req.query.includeDrafts === 'true';
        const events = await eventsService.getEventsByOrganizer(
            req.user.userId,
            includeDrafts,
        );

        res.status(200).json({
            success: true,
            data: {
                events,
            },
        });
    } catch (error) {
        throw error;
    }
};

import { Request, Response } from 'express';
import { EventStatus, UserRole } from '@prisma/client';
import { getEventsQuerySchema } from '../schemas/events.schema';
import * as adminService from '../services/admin.service';
import * as eventsService from '../services/events.service';
import { AppError } from '../middleware/errorHandler';

export const getDashboard = async (_req: Request, res: Response): Promise<void> => {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({
        success: true,
        data: stats,
    });
};

export const getEvents = async (req: Request, res: Response): Promise<void> => {
    const query = getEventsQuerySchema.parse(req.query);
    const result = await eventsService.getEventsForAdmin(query);
    res.status(200).json({
        success: true,
        data: result,
    });
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { role } = req.body as { role?: UserRole };

    if (!role || !Object.values(UserRole).includes(role)) {
        throw new AppError('Rol de usuario no válido', 400);
    }

    const user = await adminService.updateUserRole(id, role);

    res.status(200).json({
        success: true,
        message: 'Rol de usuario actualizado correctamente',
        data: {
            user,
        },
    });
};

export const updateEventStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body as { status?: EventStatus };

    if (!status || !Object.values(EventStatus).includes(status)) {
        throw new AppError('Estado de evento no válido', 400);
    }

    const event = await adminService.updateEventStatus(id, status);

    res.status(200).json({
        success: true,
        message: 'Estado del evento actualizado correctamente',
        data: {
            event,
        },
    });
};
import { Request, Response } from 'express';
import { getEventsQuerySchema } from '../schemas/events.schema';
import * as adminService from '../services/admin.service';
import * as eventsService from '../services/events.service';

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
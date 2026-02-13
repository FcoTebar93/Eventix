import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import {
    createOrderSchema,
    updateOrderSchema,
    orderIdParamsSchema,
    getOrdersQuerySchema,
    cancelOrderSchema,
} from '../schemas/orders.schema';
import * as ordersService from '../services/orders.service';
import { logger } from '../utils/logger';

export const createOrder = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const validatedData = createOrderSchema.parse(req.body);
        const order = await ordersService.createOrder(
            req.user.userId,
            validatedData,
        );

        logger.info(
            `Orden creada: ${order.id} por usuario: ${req.user.userId}`,
        );

        res.status(201).json({
            success: true,
            message: 'Orden creada exitosamente',
            data: {
                order,
            },
        });
    } catch (error) {
        throw error;
    }
};

export const getOrders = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const query = getOrdersQuerySchema.parse(req.query);
        const result = await ordersService.getOrders(
            query,
            req.user.userId,
            req.user.role,
        );

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        throw error;
    }
};

export const getOrderById = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { id } = orderIdParamsSchema.parse(req.params);
        const order = await ordersService.getOrderById(
            id,
            req.user.userId,
            req.user.role,
        );

        res.status(200).json({
            success: true,
            data: {
                order,
            },
        });
    } catch (error) {
        throw error;
    }
};

export const updateOrder = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { id } = orderIdParamsSchema.parse(req.params);
        const validatedData = updateOrderSchema.parse(req.body);
        const order = await ordersService.updateOrder(
            id,
            req.user.userId,
            req.user.role,
            validatedData,
        );

        logger.info(`Orden actualizada: ${id} por usuario: ${req.user.userId}`);

        res.status(200).json({
            success: true,
            message: 'Orden actualizada exitosamente',
            data: {
                order,
            },
        });
    } catch (error) {
        throw error;
    }
};

export const cancelOrder = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { id } = orderIdParamsSchema.parse(req.params);
        const validatedData = cancelOrderSchema.parse(req.body);
        const order = await ordersService.cancelOrder(
            id,
            req.user.userId,
            req.user.role,
            validatedData,
        );

        logger.info(`Orden cancelada: ${id} por usuario: ${req.user.userId}`);

        res.status(200).json({
            success: true,
            message: 'Orden cancelada exitosamente',
            data: {
                order,
            },
        });
    } catch (error) {
        throw error;
    }
};

export const getMyOrders = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const orders = await ordersService.getMyOrders(req.user.userId);

        res.status(200).json({
            success: true,
            data: {
                orders,
            },
        });
    } catch (error) {
        throw error;
    }
};
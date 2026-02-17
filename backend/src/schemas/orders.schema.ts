import { z } from 'zod';
import { OrderStatus, PaymentMethod } from '@prisma/client';

export const createOrderSchema = z.object({
    ticketIds: z
        .array(z.string().uuid('El ID del ticket no es válido'))
        .min(1, 'Debe seleccionar al menos un ticket')
        .max(5, 'No puede seleccionar más de 5 tickets'),
    deliveryEmail: z
        .string()
        .email('Email inválido')
        .toLowerCase()
        .trim()
        .optional(),
    deliveryAddress: z
        .string()
        .max(255, 'La dirección no puede exceder 255 caracteres')
        .trim()
        .optional(),
});

export const updateOrderSchema = z.object({
    status: z.nativeEnum(OrderStatus).optional(),
    deliveryEmail: z
    .string()
    .email('Email inválido')
    .toLowerCase()
    .trim()
    .optional(),
    deliveryAddress: z
        .string()
        .max(255, 'La dirección no puede exceder 255 caracteres')
        .trim()
        .optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: 'Al menos un campo debe ser proporcionado para actualizar',
});

export const orderIdParamsSchema = z.object({
    id: z.string().uuid('El ID del pedido no es válido'),
});

export const getOrdersQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    status: z.nativeEnum(OrderStatus).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    eventId: z.string().uuid('El ID del evento no es válido').optional(),
});

export const cancelOrderSchema = z.object({
    reason: z.string().min(1, 'El motivo es requerido').max(255, 'El motivo no puede exceder 255 caracteres').trim().optional(),
});

export const payOrderSchema = z.object({
    method: z.nativeEnum(PaymentMethod, {
        errorMap: () => ({ message: 'Método de pago no válido' }),
    }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;
export type GetOrdersQuery = z.infer<typeof getOrdersQuerySchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type PayOrderInput = z.infer<typeof payOrderSchema>;
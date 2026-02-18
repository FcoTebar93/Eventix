import { z } from 'zod';
import { EventStatus } from '@prisma/client';

export const createEventSchema = z.object({
    title: z
        .string()
        .min(1, 'El título es requerido')
        .max(100, 'El título no puede exceder 100 caracteres')
        .trim(),
    description: z
        .string()
        .max(1000, 'La descripción no puede exceder 1000 caracteres')
        .trim()
        .optional(),
    venue: z
        .string()
        .min(1, 'El lugar es requerido (puede ser "Online" para eventos virtuales)')
        .max(100, 'El lugar no puede exceder 100 caracteres')
        .trim(),
    address: z
        .string()
        .max(255, 'La dirección no puede exceder 255 caracteres')
        .trim()
        .optional(),
    city: z
        .string()
        .min(1, 'La ciudad es requerida (puede ser "Online" para eventos virtuales)')
        .max(100, 'La ciudad no puede exceder 100 caracteres')
        .trim(),
    country: z
        .string()
        .min(1, 'El país es requerido')
        .max(50, 'El país no puede exceder 50 caracteres')
        .trim(),
    date: z
        .string()
        .datetime('La fecha y hora no es válida')
        .refine((date) => new Date(date) > new Date(), {
            message: 'La fecha y hora deben ser mayores a la fecha y hora actual',
        }),
    imageUrl: z
        .string()
        .url('La URL de la imagen no es válida')
        .max(500, 'La URL no puede exceder 500 caracteres')
        .optional(),
    category: z
        .string()
        .max(100, 'La categoría no puede exceder 100 caracteres')
        .trim()
        .optional(),
    status: z
        .nativeEnum(EventStatus)
        .default(EventStatus.DRAFT)
        .optional(),
});

export const updateEventSchema = z.object({
    title: z
        .string()
        .min(1, 'El título es requerido')
        .max(100, 'El título no puede exceder 100 caracteres')
        .trim()
        .optional(),
    description: z
        .string()
        .max(1000, 'La descripción no puede exceder 1000 caracteres')
        .trim()
        .optional(),
    venue: z
        .string()
        .min(1, 'El lugar es requerido (puede ser "Online" para eventos virtuales)')
        .max(100, 'El lugar no puede exceder 100 caracteres')
        .trim()
        .optional(),
    address: z
        .string()
        .max(255, 'La dirección no puede exceder 255 caracteres')
        .trim()
        .optional(),
    city: z
        .string()
        .min(1, 'La ciudad es requerida (puede ser "Online" para eventos virtuales)')
        .max(100, 'La ciudad no puede exceder 100 caracteres')
        .trim()
        .optional(),
    country: z
        .string()
        .min(1, 'El país es requerido')
        .max(50, 'El país no puede exceder 50 caracteres')
        .trim()
        .optional(),
    date: z
        .string()
        .datetime('La fecha y hora no es válida')
        .refine((date) => new Date(date) > new Date(), {
            message: 'La fecha y hora deben ser mayores a la fecha y hora actual',
        })
        .optional(),
    imageUrl: z
        .string()
        .url('La URL de la imagen no es válida')
        .max(500, 'La URL no puede exceder 500 caracteres')
        .optional(),
    category: z
        .string()
        .max(100, 'La categoría no puede exceder 100 caracteres')
        .trim()
        .optional(),
    status: z
        .nativeEnum(EventStatus)
        .optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: 'Al menos un campo debe ser proporcionado para actualizar',
});

export const eventIdParamsSchema = z.object({
    id: z.string().uuid('El ID del evento no es válido'),
});

export const getEventsQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    status: z.nativeEnum(EventStatus).optional(),
    category: z.string().trim().optional(),
    city: z.string().trim().optional(),
    search: z.string().trim().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    tags: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventIdParams = z.infer<typeof eventIdParamsSchema>;
export type GetEventsQuery = z.infer<typeof getEventsQuerySchema>;
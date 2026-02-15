import { z } from "zod";
import { TicketStatus } from "@prisma/client";

export const createTicketSchema = z.object({
    type: z.string()
    .min(1, "El tipo de ticket es requerido")
    .max(50, "El tipo de ticket no puede exceder 100 caracteres")
    .trim(),
    price: z.number()
    .positive("El precio debe ser mayor a 0")
    .multipleOf(0.01, "Máximo 2 decimales"),
    section: z.string().max(50).trim().optional(),
    row: z.string().max(20).trim().optional(),
    seat: z.string().max(20).trim().optional()
});

export const createTicketsBulkSchema = z.object({
    type: z.string()
        .min(1, "El tipo de ticket es requerido")
        .max(50, "El tipo de ticket no puede exceder 50 caracteres")
        .trim(),
    price: z.number()
        .positive("El precio debe ser mayor a 0")
        .multipleOf(0.01, "Máximo 2 decimales"),
    quantity: z.number()
        .int("La cantidad debe ser un número entero")
        .min(1, "Mínimo 1 entrada")
        .max(500, "Máximo 500 entradas por lote"),
    section: z.string().max(50).trim().optional(),
    row: z.string().max(20).trim().optional(),
    seat: z.string().max(20).trim().optional(),
});

export const updateTicketSchema = z.object({
    type: z.string().min(1).max(50).trim().optional(),
    price: z.number().positive().multipleOf(0.01).optional(),
    section: z.string().max(50).trim().optional().nullable(),
    row: z.string().max(20).trim().optional().nullable(),
    seat: z.string().max(20).trim().optional().nullable(),
    status: z.enum(['CANCELLED']).optional()
}).refine((data) => Object.keys(data).length > 0, {
    message: 'Al menos un campo debe ser proporcionado para actualizar',
});

export const eventIdParamsSchema = z.object({
    eventId: z.string().uuid("El ID del evento no es válido")
});

export const ticketIdParamsSchema = z.object({
    ticketId: z.string().uuid("El ID del ticket no es válido")
});

export const getTicketsQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    status: z.nativeEnum(TicketStatus).optional()
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type CreateTicketsBulkInput = z.infer<typeof createTicketsBulkSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type GetTicketsQuery = z.infer<typeof getTicketsQuerySchema>;
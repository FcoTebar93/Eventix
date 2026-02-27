import { z } from 'zod';

export const createEventReviewSchema = z.object({
    rating: z
        .number()
        .int('La puntuación debe ser un número entero')
        .min(1, 'La puntuación mínima es 1')
        .max(5, 'La puntuación máxima es 5'),
    comment: z
        .string()
        .max(1000, 'El comentario no puede exceder 1000 caracteres')
        .trim()
        .optional(),
});

export const getEventReviewsQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
});

export const createUserReviewSchema = z.object({
    rating: z
        .number()
        .int('La puntuación debe ser un número entero')
        .min(1, 'La puntuación mínima es 1')
        .max(5, 'La puntuación máxima es 5'),
    comment: z
        .string()
        .max(1000, 'El comentario no puede exceder 1000 caracteres')
        .trim()
        .optional(),
});

export const getUserReviewsQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
});

export type CreateEventReviewInput = z.infer<typeof createEventReviewSchema>;
export type GetEventReviewsQuery = z.infer<typeof getEventReviewsQuerySchema>;
export type CreateUserReviewInput = z.infer<typeof createUserReviewSchema>;
export type GetUserReviewsQuery = z.infer<typeof getUserReviewsQuerySchema>;


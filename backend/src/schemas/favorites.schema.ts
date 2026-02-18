import { z } from 'zod';

export const eventIdParamsSchema = z.object({
    eventId: z.string().uuid('El ID del evento no es válido'),
});

export const getFavoritesQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
});

export type EventIdParams = z.infer<typeof eventIdParamsSchema>;
export type GetFavoritesQuery = z.infer<typeof getFavoritesQuerySchema>;

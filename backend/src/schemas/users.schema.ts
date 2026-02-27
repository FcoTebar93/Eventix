import { z } from 'zod';

export const updateProfileSchema = z.object({
    name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .trim()
        .optional(),
    email: z
        .string()
        .email('Email inválido')
        .toLowerCase()
        .trim()
        .optional(),
    displayName: z
        .string()
        .min(2, 'El nombre público debe tener al menos 2 caracteres')
        .max(100, 'El nombre público no puede exceder 100 caracteres')
        .trim()
        .optional(),
    bio: z
        .string()
        .max(500, 'La bio no puede exceder 500 caracteres')
        .trim()
        .optional(),
    avatarUrl: z
        .string()
        .url('La URL del avatar no es válida')
        .max(500, 'La URL del avatar no puede exceder 500 caracteres')
        .optional(),
    location: z
        .string()
        .max(100, 'La ubicación no puede exceder 100 caracteres')
        .trim()
        .optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: 'Al menos un campo debe ser proporcionado para actualizar',
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z
        .string()
        .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
        ),
}).refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
});

export const userIdParamsSchema = z.object({
    id: z.string().uuid('ID de usuario inválido'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
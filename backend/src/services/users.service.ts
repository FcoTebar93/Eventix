import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { AppError } from '../middleware/errorHandler';
import { UpdateProfileInput, ChangePasswordInput } from '../schemas/users.schema';

export const getProfile = async (userId: string): Promise<{
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    return user;
};

export const updateProfile = async (
    userId: string,
    data: UpdateProfileInput,
): Promise<{
    id: string;
    email: string;
    name: string;
    role: UserRole;
    updatedAt: Date;
}> => {
    if (data.email) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser && existingUser.id !== userId) {
            throw new AppError('El email ya está en uso', 409);
        }
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.email && { email: data.email }),
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            updatedAt: true,
        },
    });

    return user;
};

export const changePassword = async (
    userId: string,
    data: ChangePasswordInput,
): Promise<void> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            password: true,
        },
    });

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    const isCurrentPasswordValid = await comparePassword(
        data.currentPassword,
        user.password,
    );

    if (!isCurrentPasswordValid) {
        throw new AppError('Contraseña actual incorrecta', 401);
    }

    const hashedNewPassword = await hashPassword(data.newPassword);

    await prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedNewPassword,
        },
    });
};

export const getUserById = async (userId: string): Promise<{
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    return user;
};

export const getAllUsers = async (
    page: number = 1,
    limit: number = 10,
): Promise<{
    users: Array<{
        id: string;
        email: string;
        name: string;
        role: UserRole;
        createdAt: Date;
    }>;
    total: number;
    page: number;
    totalPages: number;
}> => {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            skip,
            take: limit,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        }),
        prisma.user.count(),
    ]);

    return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};
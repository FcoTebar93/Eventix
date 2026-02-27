import { EventStatus, Prisma, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { AppError } from '../middleware/errorHandler';
import { UpdateProfileInput, ChangePasswordInput } from '../schemas/users.schema';

export const getProfile = async (userId: string): Promise<{
    id: string;
    email: string;
    name: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    location: string | null;
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
            displayName: true,
            bio: true,
            avatarUrl: true,
            location: true,
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
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    location: string | null;
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
            ...(data.displayName !== undefined && { displayName: data.displayName }),
            ...(data.bio !== undefined && { bio: data.bio }),
            ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
            ...(data.location !== undefined && { location: data.location }),
        },
        select: {
            id: true,
            email: true,
            name: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            location: true,
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

export const getPublicProfile = async (userId: string): Promise<{
    id: string;
    name: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    location: string | null;
    role: UserRole;
    createdAt: Date;
    stats: {
        organizedEventsCount: number;
        averageEventRating: number | null;
        averageProfileRating: number | null;
        totalEventReviews: number;
        totalProfileReviews: number;
    };
}> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            location: true,
            role: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    const [organizedEventsCount, eventRatingAgg, profileRatingAgg, profileReviewsCount] =
        await Promise.all([
            prisma.event.count({
                where: {
                    organizerId: userId,
                    status: EventStatus.PUBLISHED,
                },
            }),
            prisma.review.aggregate({
                where: {
                    event: {
                        organizerId: userId,
                    },
                },
                _avg: { rating: true },
                _count: { rating: true },
            }),
            prisma.userReview.aggregate({
                where: { targetUserId: userId },
                _avg: { rating: true },
            }),
            prisma.userReview.count({
                where: { targetUserId: userId },
            }),
        ]);

    return {
        ...user,
        stats: {
            organizedEventsCount,
            averageEventRating: eventRatingAgg._avg.rating ?? null,
            averageProfileRating: profileRatingAgg._avg.rating ?? null,
            totalEventReviews: eventRatingAgg._count.rating,
            totalProfileReviews: profileReviewsCount,
        },
    };
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
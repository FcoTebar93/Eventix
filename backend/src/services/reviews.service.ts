import { EventStatus, OrderStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { CreateEventReviewInput, GetEventReviewsQuery, CreateUserReviewInput, GetUserReviewsQuery } from '../schemas/reviews.schema';

const userReviewDelegate: any = (prisma as any).userReview;

export const getEventReviews = async (
    eventId: string,
    query: GetEventReviewsQuery,
) => {
    const { page = 1, limit = 10 } = query;
    const validLimit = Math.min(Math.max(limit, 1), 100);
    const validPage = Math.max(page, 1);
    const skip = (validPage - 1) * validLimit;

    const [reviews, total, aggregate] = await Promise.all([
        prisma.review.findMany({
            where: { eventId },
            include: {
                user: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: validLimit,
        }),
        prisma.review.count({ where: { eventId } }),
        prisma.review.aggregate({
            where: {
                eventId,
                rating: {
                    gt: 0,
                },
            },
            _avg: { rating: true },
        }),
    ]);

    // Calcular qué usuarios han asistido (tienen una orden confirmada/completada para este evento)
    const reviewerIds = reviews.map((r) => r.userId);
    let attendedUserIds = new Set<string>();

    if (reviewerIds.length > 0) {
        const attendeeOrders = await prisma.order.findMany({
            where: {
                userId: { in: reviewerIds },
                eventId,
                status: {
                    in: [OrderStatus.CONFIRMED, OrderStatus.COMPLETED],
                },
            },
            select: { userId: true },
        });

        attendedUserIds = new Set(attendeeOrders.map((o) => o.userId));
    }

    const reviewsWithAttendance = reviews.map((r) => ({
        ...r,
        hasAttended: attendedUserIds.has(r.userId),
    }));

    return {
        reviews: reviewsWithAttendance,
        total,
        page: validPage,
        totalPages: Math.ceil(total / validLimit),
        averageRating: aggregate._avg.rating ?? null,
    };
};

export const upsertEventReview = async (
    eventId: string,
    userId: string,
    data: CreateEventReviewInput,
) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, status: true },
    });

    if (!event) {
        throw new AppError('Evento no encontrado', 404);
    }

    if (event.status !== EventStatus.PUBLISHED) {
        throw new AppError(
            'Solo se pueden reseñar eventos publicados',
            400,
        );
    }

    const review = await prisma.review.upsert({
        where: {
            eventId_userId: {
                eventId,
                userId,
            },
        },
        update: {
            rating: data.rating,
            comment: data.comment,
        },
        create: {
            eventId,
            userId,
            rating: data.rating,
            comment: data.comment,
        },
        include: {
            user: true,
        },
    });

    const aggregate = await prisma.review.aggregate({
        where: {
            eventId,
            rating: {
                gt: 0,
            },
        },
        _avg: { rating: true },
        _count: { rating: true },
    });

    const hasAttended = await prisma.order.findFirst({
        where: {
            userId,
            eventId,
            status: {
                in: [OrderStatus.CONFIRMED, OrderStatus.COMPLETED],
            },
        },
        select: { id: true },
    });

    return {
        review: {
            ...review,
            hasAttended: !!hasAttended,
        },
        averageRating: aggregate._avg.rating ?? null,
        totalReviews: aggregate._count.rating,
    };
};

export const getUserProfileReviews = async (
    targetUserId: string,
    query: GetUserReviewsQuery,
) => {
    const { page = 1, limit = 10 } = query;
    const validLimit = Math.min(Math.max(limit, 1), 100);
    const validPage = Math.max(page, 1);
    const skip = (validPage - 1) * validLimit;

    const [reviews, total, aggregate] = await Promise.all([
        userReviewDelegate.findMany({
            where: { targetUserId },
            include: {
                authorUser: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: validLimit,
        }),
        userReviewDelegate.count({ where: { targetUserId } }),
        userReviewDelegate.aggregate({
            where: {
                targetUserId,
                rating: {
                    gt: 0,
                },
            },
            _avg: { rating: true },
        }),
    ]);

    return {
        reviews,
        total,
        page: validPage,
        totalPages: Math.ceil(total / validLimit),
        averageRating: aggregate._avg.rating ?? null,
    };
};

export const upsertUserProfileReview = async (
    targetUserId: string,
    authorUserId: string,
    data: CreateUserReviewInput,
) => {
    if (targetUserId === authorUserId) {
        throw new AppError('No puedes reseñar tu propio perfil', 400);
    }

    const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true },
    });

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    const review = await userReviewDelegate.upsert({
        where: {
            targetUserId_authorUserId: {
                targetUserId,
                authorUserId,
            },
        },
        update: {
            rating: data.rating,
            comment: data.comment,
        },
        create: {
            targetUserId,
            authorUserId,
            rating: data.rating,
            comment: data.comment,
        },
        include: {
            authorUser: {
                select: {
                    id: true,
                    name: true,
                    displayName: true,
                    avatarUrl: true,
                },
            },
        },
    });

    const aggregate = await userReviewDelegate.aggregate({
        where: {
            targetUserId,
            rating: {
                gt: 0,
            },
        },
        _avg: { rating: true },
        _count: { rating: true },
    });

    return {
        review,
        averageRating: aggregate._avg.rating ?? null,
        totalReviews: aggregate._count.rating,
    };
}

export const deleteEventReview = async (
    eventId: string,
    userId: string,
) => {
    await prisma.review.deleteMany({
        where: {
            eventId,
            userId,
        },
    });
};

export const deleteUserProfileReview = async (
    targetUserId: string,
    authorUserId: string,
) => {
    await userReviewDelegate.deleteMany({
        where: {
            targetUserId,
            authorUserId,
        },
    });
};


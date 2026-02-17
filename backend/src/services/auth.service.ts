import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { RegisterInput, LoginInput, RefreshTokenInput } from '../schemas/auth.schema';
import { AuthTokens } from '../types';

export const register = async (data: RegisterInput): Promise<{
    tokens: AuthTokens;
    user: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
    };
}> => {
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existingUser) {
        throw new AppError('El email ya está registrado', 409);
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            name: data.name,
            role: data.role || UserRole.BUYER,
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
        },
    });

    const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    return {
        tokens,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    };
};

export const login = async (data: LoginInput): Promise<{
    tokens: AuthTokens;
    user: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
    };
}> => {
    const user = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (!user) {
        throw new AppError('Credenciales inválidas', 401);
    }

    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
        throw new AppError('Credenciales inválidas', 401);
    }

    const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    return {
        tokens,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    };
};


export const refreshToken = async (data: RefreshTokenInput): Promise<AuthTokens> => {
    const payload = verifyRefreshToken(data.refreshToken);

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true },
    });

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    return tokens;
};
import { UserRole } from '@prisma/client';

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
}

export interface AuthenticatedRequest extends Express.Request {
    user?: JWTPayload;
}
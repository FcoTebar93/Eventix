import { Request } from 'express';
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

export interface AuthenticatedRequest extends Request<Record<string, string>, unknown, unknown, Record<string, string>> {
    user?: JWTPayload;
}
import dotenv from 'dotenv';

dotenv.config();

export const env = {
    NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    PORT: parseInt(process.env.PORT || '3001', 10),
    API_PREFIX: process.env.API_PREFIX || '/api/v1',
    
    DATABASE_URL: process.env.DATABASE_URL || '',
    
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    
    RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    
    JWT_SECRET: process.env.JWT_SECRET || '',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
    JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || '15m') as string,
    JWT_REFRESH_EXPIRES_IN: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string,

    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

    RATE_LIMITING_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    RATE_LIMITING_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    STRIPE_PREMIUM_PRICE_ID: process.env.STRIPE_PREMIUM_PRICE_ID || '',
};

if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}

if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
}

if (!env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not set');
}
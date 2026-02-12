import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import { connectRabbitMQ, closeRabbitMQConnection } from './lib/rabbitmq';
import { getRedisClient, closeRedisConnection } from './lib/redis';
import { prisma } from './lib/prisma';
import apiRoutes from './routes';
import { logger } from './utils/logger';
import { generalLimiter } from './middleware/rateLimiter';

const app = express();

app.use(helmet());
app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

app.use(env.API_PREFIX, apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async (): Promise<void> => {
    try {
        await connectRabbitMQ();
        getRedisClient();

        app.listen(env.PORT, () => {
            logger.info(`🚀 Server running on port ${env.PORT}`);
            logger.info(`📡 Environment: ${env.NODE_ENV}`);
            logger.info(`🔗 API: http://localhost:${env.PORT}${env.API_PREFIX}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} signal received. Shutting down gracefully...`);
    try {
        await closeRabbitMQConnection();
        await closeRedisConnection();
        await prisma.$disconnect();
        logger.info('All connections closed');
    } catch (error) {
        logger.error('Error closing connections:', error);
    }
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
import { app } from './app';
import { env } from './config/env';
import { connectRabbitMQ, closeRabbitMQConnection } from './lib/rabbitmq';
import { getRedisClient, closeRedisConnection } from './lib/redis';
import { prisma } from './lib/prisma';
import { logger } from './utils/logger';
import { startReservationsWorker, stopReservationsWorker } from './workers/reservations.worker';

const startServer = async (): Promise<void> => {
    try {
        await connectRabbitMQ();
        getRedisClient();
        startReservationsWorker();

        app.listen(env.PORT, () => {
            logger.info(`🚀 Server running on port ${env.PORT}`);
            logger.info(`📡 Environment: ${env.NODE_ENV}`);
            logger.info(`🔗 API: http://localhost:${env.PORT}${env.API_PREFIX}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        stopReservationsWorker();
        process.exit(1);
    }
};

const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} signal received. Shutting down gracefully...`);
    try {
        await closeRabbitMQConnection();
        await closeRedisConnection();
        stopReservationsWorker();
        await prisma.$disconnect();
        logger.info('All connections closed');
    } catch (error) {
        logger.error('Error closing connections:', error);
        stopReservationsWorker();
        process.exit(1);
    }
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
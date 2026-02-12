import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import { connectRabbitMQ } from './lib/rabbitmq';
import { getRedisClient } from './lib/redis';

const app = express();

app.use(helmet());
app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

app.use(env.API_PREFIX, (_req, res) => {
    res.json({ message: 'API v1 - Routes coming soon...' });
});

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async (): Promise<void> => {
    try {
        await connectRabbitMQ();
        getRedisClient();
        app.listen(env.PORT, () => {
            console.log(`🚀 Server is running on port ${env.PORT}`);
            console.log(`🔗 API docs: http://localhost:${env.PORT}${env.API_PREFIX}/docs`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received. Shutting down gracefully...');
    process.exit(0);
});

startServer();
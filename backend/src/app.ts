import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import apiRoutes from './routes';
import { generalLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

const app = express();

app.use(helmet());
app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
}));

app.use('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

app.use((req, res, next) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1_000_000;

        logger.info(
            'HTTP %s %s %d %sms',
            req.method,
            req.originalUrl,
            res.statusCode,
            durationMs.toFixed(2),
        );
    });

    next();
});

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

export { app };
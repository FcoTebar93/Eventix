import { connectRabbitMQ } from '../lib/rabbitmq';
import { logger } from '../utils/logger';

export type OrderConfirmedEmailJob = {
    type: 'ORDER_CONFIRMED';
    payload: {
        orderId: string;
        userId: string;
        email: string;
        totalAmount: number;
    };
};

export type EmailJob = OrderConfirmedEmailJob;

const EMAIL_QUEUE = 'email.events';

export const publishEmailJob = async (job: EmailJob): Promise<void> => {
    try {
        const channel = await connectRabbitMQ();
        await channel.assertQueue(EMAIL_QUEUE, { durable: true });
        channel.sendToQueue(
            EMAIL_QUEUE,
            Buffer.from(JSON.stringify(job)),
            { persistent: true },
        );
        logger.info('📨 Email job publicado en cola', { type: job.type });
    } catch (error) {
        logger.error('Error al publicar email job en RabbitMQ', error);
    }
};


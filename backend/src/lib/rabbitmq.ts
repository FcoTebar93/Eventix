import amqp from 'amqplib';
import type { Channel } from 'amqplib';
import { env } from '../config/env';

// Usar el tipo de retorno real de amqp.connect() en lugar de Connection
type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;

let connection: AmqpConnection | null = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<Channel> => {
    if (channel) {
        return channel;
    }

    try {
        connection = await amqp.connect(env.RABBITMQ_URL);
        channel = await connection.createChannel();

        connection.on('error', (error: Error) => {
            console.error('RabbitMQ connection error:', error);
        });

        connection.on('close', () => {
            console.log('RabbitMQ connection closed');
            connection = null;
            channel = null;
        });

        console.log('✅ RabbitMQ connected');
        return channel;
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        throw error;
    }
};

export const getRabbitMQChannel = (): Channel => {
    if (!channel) {
        throw new Error('RabbitMQ channel not initialized. Call connectRabbitMQ() first.');
    }
    return channel;
};

export const closeRabbitMQConnection = async (): Promise<void> => {
    if (channel) {
        await channel.close();
        channel = null;
    }
    if (connection) {
        await connection.close();
        connection = null;
    }
};
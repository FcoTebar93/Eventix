import { prisma } from '../lib/prisma';
import { connectRabbitMQ } from '../lib/rabbitmq';
import { logger } from '../utils/logger';
import { sendEmail } from '../services/email.service';
import type { EmailJob } from '../services/emailQueue.service';

const EMAIL_QUEUE = 'email.events';

async function handleOrderConfirmed(job: EmailJob & { type: 'ORDER_CONFIRMED' }) {
    const { email, totalAmount, orderId, userId } = job.payload;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            event: {
                select: {
                    title: true,
                    date: true,
                },
            },
            items: {
                include: {
                    ticket: {
                        select: {
                            type: true,
                            price: true,
                        },
                    },
                },
            },
        },
    });

    if (!order) {
        logger.warn('No se encontró el pedido para email ORDER_CONFIRMED', { orderId, userId });
        return;
    }

    const ticketLines = order.items
        .map((item) => `- ${item.ticket.type}: ${Number(item.ticket.price).toFixed(2)} €`)
        .join('\n');

    const eventTitle = order.event?.title ?? 'tu evento';
    const eventDate = order.event?.date
        ? new Date(order.event.date).toLocaleString()
        : '';

    const text = [
        `¡Gracias por tu compra en TicketMonster!`,
        '',
        `Pedido: ${orderId}`,
        `Evento: ${eventTitle}${eventDate ? ` (${eventDate})` : ''}`,
        '',
        'Entradas:',
        ticketLines || '-',
        '',
        `Total: ${Number(totalAmount).toFixed(2)} €`,
    ].join('\n');

    await sendEmail({
        to: email,
        subject: `Confirmación de compra - TicketMonster`,
        text,
    });
}

async function start() {
    logger.info('📧 Email worker iniciando...');

    const channel = await connectRabbitMQ();
    await channel.assertQueue(EMAIL_QUEUE, { durable: true });

    channel.consume(
        EMAIL_QUEUE,
        async (msg) => {
            if (!msg) return;

            try {
                const content = msg.content.toString();
                const job = JSON.parse(content) as EmailJob;

                switch (job.type) {
                    case 'ORDER_CONFIRMED':
                        await handleOrderConfirmed(job as any);
                        break;
                    default:
                        logger.warn('Tipo de email job desconocido', { type: (job as any).type });
                        break;
                }

                channel.ack(msg);
            } catch (error) {
                logger.error('Error procesando mensaje de email', error);
                channel.nack(msg, false, false);
            }
        },
        { noAck: false },
    );

    logger.info('📧 Email worker escuchando cola', { queue: EMAIL_QUEUE });
}

start().catch((error) => {
    logger.error('Error al iniciar email worker', error);
    process.exit(1);
});


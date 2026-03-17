import { logger } from '../utils/logger';

export interface EmailMessage {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export const sendEmail = async (message: EmailMessage): Promise<void> => {
    logger.info('📧 Email (simulado) enviado', {
        to: message.to,
        subject: message.subject,
    });

    if (process.env.NODE_ENV !== 'production') {
        logger.debug('Contenido del email', {
            to: message.to,
            subject: message.subject,
            text: message.text,
            html: message.html,
        });
    }
};


import { releaseExpiredReservations } from '../services/reservations.services';
import { logger } from '../utils/logger';

const INTERVAL_MS = 1000 * 60 * 5; //  Se ejecuta cada 5 minutos

let intervalID: NodeJS.Timeout | null = null;

export const startReservationsWorker = () => {
    if (intervalID) {
        logger.warn('Reservations worker ya está encendido');
        return;
    }
    
    logger.info('🔄 Reservations worker iniciado (cada 5 minutos)');

    const run = async () => {
        try {
            const result = await releaseExpiredReservations();
            logger.info(`Reservas expiradas liberadas: ${result.released}`);
        } catch (error) {
            logger.error('Error al liberar reservas expiradas:', error);
        }
    };

    run();

    intervalID = setInterval(run, INTERVAL_MS);
}

export function stopReservationsWorker() {
    if (intervalID) {
        clearInterval(intervalID);
        intervalID = null;
        logger.info('Reservations worker detenido');
    }
}
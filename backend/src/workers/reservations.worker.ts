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
            if (result.released > 0 || result.ordersCancelled > 0) {
                logger.info(`Reservas expiradas liberadas: ${result.released} tickets, ${result.ordersCancelled} órdenes canceladas`);
            }
        } catch (error: any) {
            // No loguear errores de conexión como errores críticos
            if (error?.message?.includes('Authentication failed') || error?.message?.includes('connect')) {
                logger.debug('Worker: Base de datos aún no disponible, reintentará en el próximo ciclo');
            } else {
                logger.error('Error al liberar reservas expiradas:', error);
            }
        }
    };

    // Esperar 10 segundos antes de la primera ejecución para dar tiempo a que la BD se conecte
    setTimeout(() => {
        run();
        intervalID = setInterval(run, INTERVAL_MS);
    }, 10000);
}

export function stopReservationsWorker() {
    if (intervalID) {
        clearInterval(intervalID);
        intervalID = null;
        logger.info('Reservations worker detenido');
    }
}
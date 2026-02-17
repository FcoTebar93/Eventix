import { EventStatus } from "@prisma/client";
import { prisma } from "../../../src/lib/prisma";
import * as eventsService from "../../../src/services/events.service";
import { createMockEvent } from "../../helpers/test-helpers";
import { AppError } from "../../../src/middleware/errorHandler";
import * as cacheUtils from "../../../src/utils/cache";

jest.mock("../../../src/utils/cache");

describe('Events Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (cacheUtils.getFromCache as jest.Mock).mockResolvedValue(null);
        (cacheUtils.setCache as jest.Mock).mockResolvedValue(undefined);
        (cacheUtils.deleteCache as jest.Mock).mockResolvedValue(undefined);
    });

    describe('createEvent', () => {
        it('should create a new event and invalidate list cache', async () => {
            const mockEvent = createMockEvent({ organizerId: 'org-1' });
            (prisma.event.create as jest.Mock).mockResolvedValue(mockEvent);

            const result = await eventsService.createEvent('org-1', {
                title: 'Concierto',
                venue: 'Sala',
                city: 'Madrid',
                country: 'España',
                date: new Date().toISOString(),
            });

            expect(prisma.event.create).toHaveBeenCalled();
            expect(cacheUtils.deleteCache).toHaveBeenCalledWith('events:list:*');
            expect(result).toEqual(mockEvent);
        });
    });

    describe('getEventsById', () => {
        it('should return event when found and published', async () => {
            const mockEvent = createMockEvent({ status: EventStatus.PUBLISHED });
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);

            const result = await eventsService.getEventById(mockEvent.id);

            expect(result).toEqual(mockEvent);
            expect(prisma.event.findUnique).toHaveBeenCalledWith({
                where: { id: mockEvent.id },
                include: expect.any(Object),
            });
        });

        it('should throw AppError when event is not found', async () => {
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(eventsService.getEventById('non-existent')).rejects.toThrow(AppError);
        });

        it('should throw AppError when draft and userId is not organizer', async () => {
            const mockEvent = createMockEvent({ status: EventStatus.DRAFT, organizerId: 'org-1' });
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);

            await expect(eventsService.getEventById(mockEvent.id, 'user-1')).rejects.toThrow(AppError);
        });
    });

    describe('updateEvent', () => {
        it('should throw AppError when event not found', async () => {
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(eventsService.updateEvent('non-existent', 'org-1', { title: 'Updated' })).rejects.toThrow(AppError);
        });

        it('should throw AppError when does not match organizer', async () => {
            const mockEvent = createMockEvent({ status: EventStatus.DRAFT, organizerId: 'org-1' });
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);

            await expect(eventsService.updateEvent(mockEvent.id, 'user-1', { title: 'Updated' })).rejects.toThrow(AppError);
        });

        it('should update event and invalidate cache when authorized', async () => {
            const mockEvent = createMockEvent({ status: EventStatus.DRAFT, organizerId: 'org-1' });
            const updated = { ...mockEvent, title: 'Updated' };
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
            (prisma.event.update as jest.Mock).mockResolvedValue(updated);

            const result = await eventsService.updateEvent(mockEvent.id, 'org-1', { title: 'Updated' });

            expect(result.title).toBe('Updated');
            expect(cacheUtils.deleteCache).toHaveBeenCalled();
        });
    });

    describe('deleteEvent', () => {
        it('should throw AppError when event not found', async () => {
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(eventsService.deleteEvent('non-existent', 'org-1')).rejects.toThrow(AppError);
        });
        
        it('should set status to CANCELLED and invalidate cache when authorized', async () => {
            const mockEvent = createMockEvent({ organizerId: 'org-1' });
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
            (prisma.event.update as jest.Mock).mockResolvedValue({ ...mockEvent, status: EventStatus.CANCELLED });

            await eventsService.deleteEvent(mockEvent.id, 'org-1');

            expect(prisma.event.update).toHaveBeenCalledWith({
                where: { id: mockEvent.id },
                data: { status: EventStatus.CANCELLED },
            });
            expect(cacheUtils.deleteCache).toHaveBeenCalled();
        });
    });

    describe('publishEvent', () => {
        it('should throw AppError when event is not DRAFT', async () => {
            const mockEvent = createMockEvent({ status: EventStatus.DRAFT, organizerId: 'org-1' });
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);

            await expect(eventsService.publishEvent(mockEvent.id, 'org-1')).rejects.toThrow(AppError);

            it('should update status to PUBLISHED when authorized', async () => {
                const mockEvent = createMockEvent({ status: EventStatus.DRAFT, organizerId: 'org-1' });
                const published = { ...mockEvent, status: EventStatus.PUBLISHED };
                (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
                (prisma.event.update as jest.Mock).mockResolvedValue(published);
    
                const result = await eventsService.publishEvent(mockEvent.id, 'org-1');
    
                expect(result.status).toBe(EventStatus.PUBLISHED);
            });
        });
    });
});
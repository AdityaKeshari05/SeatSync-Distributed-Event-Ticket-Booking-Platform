import { z } from 'zod';

export const eventSchema = z.object({
    title: z.string().min(2,'Title must be at least 3 characters'),
    venue: z.string().min(3,'Venue must be at least 3 characters'),
    eventDate: z.coerce.date().refine((date) => date > new Date()),
    totalSeats: z.number().int().positive().max(1000, 'Max 1000 seats per event')
});

export const eventIdParamSchema = z.object({
    id: z.uuid('Invalid event id format !!'),
});

export type createEventInput = z.infer<typeof eventSchema>;
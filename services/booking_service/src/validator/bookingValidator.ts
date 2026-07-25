import { z } from 'zod';

export const seatIdParamSchema = z.object({
    seatId: z.uuid('Invalid seat Id Format !!'),
});

export type seatIdValidator = z.infer< typeof seatIdParamSchema>;
import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { z } from 'zod';

const seatIdParamSchema = z.object({
    seatId: z.uuid('Invalid seatId format !!'),
});

export const getSeatInternal = async (req: Request, res: Response) =>{
      const parsed = seatIdParamSchema.safeParse(req.params);
      if(!parsed.success){
        return res.status(400).json({ message: 'Invalid seat ID' });
      }
      
      const { seatId } = parsed.data;
      try{
        const seat = await prisma.seat.findUnique({ where: { id: seatId }});
        if(!seat){
            return res.status(404).json({ message: 'Seat not found' });
        }
        return res.status(200).json({ seat });
      }catch(err){
        console.error('Get seat internal error:', err);
        return res.status(500).json({ message: 'Something went wrong fetching the seat' });
      }
};

export const updatedSeatInternal = async (req: Request, res: Response) =>{
    const parsed = seatIdParamSchema.safeParse(req.params);
    if(!parsed.success){
        return res.status(400).json({ message: 'Invalid seat ID' });
    }

    const { seatId } = parsed.data;
    const { status } = req.body;

    if (!['available', 'locked', 'booked'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try{
        const seat = await prisma.seat.update({
            where: { id: seatId},
            data: { status },
        });
        
        return res.status(200).json({ seat });
    }catch (err) {
        console.error('Update seat internal error:', err);
        return res.status(500).json({ message: 'Something went wrong updating the seat' });
    }
};
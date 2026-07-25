import { Request, Response } from "express";
import { prisma } from '../config/db.js';
import { eventSchema, eventIdParamSchema } from "../validator/eventValidator.js";
import { z } from 'zod';
import { redis } from "../config/redis.js";


export const createEvent = async (req: Request, res: Response) =>{
    const parsed = eventSchema.safeParse(req.body);
    if(!parsed.success){
        return res.status(400).json({message: 'Validation failed' , error: z.flattenError(parsed.error).fieldErrors});
    }

    const { title, venue, eventDate, totalSeats } = parsed.data;
    try{
        const event = await prisma.$transaction(async (tx) => {
            const createdEvent = await tx.event.create({
                data:{
                    title,
                    venue,
                    eventDate,
                    totalSeats,
                    createdBy: req.user!.userId
                }
            });

            const seatData = Array.from({ length: totalSeats } , (_ , i) =>({
                eventId: createdEvent.id,
                seatNumber: `Seat ${i+1}`,
                seatIndex: i+1,
            }));

            await tx.seat.createMany({ data: seatData});
            return createdEvent;
        });
        return res.status(201).json({ event });
    }catch(err){
        console.log('Create Event Error: ',err);
        res.status(500).json({message: 'Something went wrong while creating the event !!'});
    }
};

export const getEvents = async (req: Request, res: Response) =>{
    try{
        const events = await prisma.event.findMany({
            orderBy: { eventDate: 'asc'},
        });
        return res.status(200).json({ events });
    }catch(err){
        console.error('Event fetching error: ', err);
        return res.status(500).json({message: 'Something went wrong while fetching the event !!'});
    }
};


export const getEventSeats = async (req: Request, res: Response) => {
  const parsedParams = eventIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ message: 'Invalid event ID' });
  }
  const { id } = parsedParams.data; 

  try {
    const seats = await prisma.seat.findMany({
      where: { eventId: id },
      orderBy: { seatIndex: 'asc'},
    });

    const updateSeats = await Promise.all(
        seats.map(async (seat) =>{
            if(seat.status === 'locked'){
                const lockKey = `lock:seat:${seat.id}`
                const stillLocked = await redis.exists(lockKey);

                if(!stillLocked){
                    const updated = await prisma.seat.update({
                        where: { id: seat.id},
                        data: { status: 'available'},
                    });

                    await redis.publish('seatUpdated' , JSON.stringify({
                        eventId: seat.eventId,
                        seatId: seat.id,
                        status: 'available',
                    }))
                    
                    return updated;
                }
            }
            return seat;
        })
    );
    return res.status(200).json({ seats: updateSeats });
  } catch (err) {
    console.error('Get event seats error:', err);
    return res.status(500).json({ message: 'Something went wrong while fetching seats' });
  } 
};
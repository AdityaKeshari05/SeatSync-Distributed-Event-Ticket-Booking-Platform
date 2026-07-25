import { Request, Response } from "express";
import { prisma } from '../config/db.js';
import { seatIdParamSchema } from '../validator/bookingValidator.js';
import { getSeat, updateSeat } from "../utils/eventServiceClient.js";
import { z } from 'zod';
import { redis } from '../config/redis.js';
import { io } from "../server.js";

export const createBooking = async (req: Request, res: Response) =>{
    const parsed = seatIdParamSchema.safeParse(req.params);
    if(!parsed.success){
        return res.status(400).json({message: 'Validation Failed' , error: z.flattenError(parsed.error).fieldErrors});
    }

    const { seatId } = parsed.data;
    const lockKey = `lock:seat:${seatId}`;
    const lockTTL = 300000; // 5 seconds
    try{

       const lockOwnerId = await redis.get(lockKey);
       if(!lockOwnerId) return res.status(409).json({ message: 'You must select this seat before booking !!'});

       if(lockOwnerId !== req.user!.userId){
        return res.status(403).json({ message: 'The seat is being hold by someone else.'});
       }
    

        const seat  = await getSeat(seatId);
        if(!seat){
            await redis.del(lockKey);
            return res.status(404).json({message: 'Seat do not exist with the provided id'});
        }
        if(seat.status !== 'locked'){
            await redis.del(lockKey);
            return res.status(409).json({message: 'Seat must be selected before it can be booked.'});
        }

        await updateSeat(seatId, 'booked');

        const booking = await prisma.booking.upsert({
            where: {seatId: seat.id},
            update: {
                userId: req.user!.userId,
                status: 'confirmed',
                bookedAt: new Date(),
            },
            create: {
                userId: req.user!.userId,
                seatId: seat.id,
                eventId: seat.eventId,
            },
        });
        
        await redis.del(lockKey);

        io.to(`event:${seat.eventId}`).emit('seatUpdated' , {
            seatId: seat.id,
            status: 'booked',
        }); 

        res.status(201).json({ booking });
    }catch(err){
        await redis.del(lockKey);
        console.error('Booking Error: ', err);
        return res.status(500).json({message: 'Something went wrong while booking the seat !!'});
    }
};

// Select seat for booking
export const selectSeat = async (req: Request, res: Response) =>{
    const parsed = seatIdParamSchema.safeParse(req.params);
    if(!parsed.success){
        return res.status(400).json({message: 'Validation Failed' , error: z.flattenError(parsed.error).fieldErrors});
    }

    const { seatId } = parsed.data;
    const lockKey = `lock:seat:${seatId}`
    const lockTTL = 300000; // 5 minutes

    try{
        const acquired = await redis.set(lockKey , req.user!.userId , 'PX' , lockTTL , 'NX');

        if(!acquired){
            return res.status(409).json({message: 'Seat is currently being booked by someone else , try again !!'});
        }

        const seat  = await getSeat(seatId);
        if(!seat){
            await redis.del(lockKey);
            return res.status(404).json({message: 'Seat do not exist with the provided id'});
        }
        if(seat.status !== 'available'){
            await redis.del(lockKey);
            return res.status(409).json({message: 'Seat already booked'});
        }

        await updateSeat(seatId, 'locked');

        io.to(`event:${seat.eventId}`).emit('seatUpdated' , {
            seatId: seat.id,
            status: 'locked',
        });

        return res.status(200).json({ message: 'Seat held for 5 minutes', seatId });
    }catch(err){
        await redis.del(lockKey);
        console.error('Select seat error : ', err);
        return res.status(500).json({ message: 'Something went wrong while selecting the seats'});
    }
};

// Release the hold on the seat 
export const releaseSeat = async (req: Request, res: Response) =>{
    const parsed = seatIdParamSchema.safeParse(req.params);
    if(!parsed.success){
        return res.status(400).json({message: 'Validation Failed' , error: z.flattenError(parsed.error).fieldErrors});
    }

    const { seatId } = parsed.data;
    const lockKey = `lock:seat:${seatId}`;

    try{
        const lockOwnerId = await redis.get(lockKey);
        
        if(!lockOwnerId){
            return res.status(409).json({ message: 'No active lock on this seat.'});
        }
        
        if(lockOwnerId !== req.user!.userId){
            return res.status(403).json({ message: 'You do not hold this seat !!'});
        }

        const seat = await getSeat(seatId);

        if(!seat){
            return res.status(404).json({ message: 'Seat does not exists !!'});
        }
        
        await updateSeat(seatId , 'available');

        await redis.del(lockKey);

        io.to(`event:${seat.eventId}`).emit('seatUpdated' , {
            seatId: seat.id,
            status: 'available',
        });
        
        return res.status(200).json({ message: 'Seat Released', seatId});
    }catch(err){
        console.error('Release seat error:', err);
        return res.status(500).json({ message: 'Something went wrong while releasing the seat' });
    }
};


// User a - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NDdkYjUyMC0zYzA2LTRkNzAtOWI4Zi1lMzA1NjM5NThlMWQiLCJyb2xlIjoidXNlciIsImlhdCI6MTc4NDI5ODkxMiwiZXhwIjoxNzg0OTAzNzEyfQ.0FElRFwp8W2Y_90vX6h9_UBF2FGgobl0Mk4pCHpq0Fc

// Admin - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NmUyMWE1Yy01OTk0LTQ1OTYtYTIwNy0wOGQyOWI1ZmE2OWQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODQ2NDkyOTEsImV4cCI6MTc4NTI1NDA5MX0.sBUCqomZV1Lq9kaXiJLKe80aSSJAS3qTNr4itE8B7cc
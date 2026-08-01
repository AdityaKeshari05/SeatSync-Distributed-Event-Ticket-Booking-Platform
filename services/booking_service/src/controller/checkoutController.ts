import 'dotenv/config';
import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import { seatIdParamSchema } from '../validator/bookingValidator.js';
import { z } from 'zod';
import { getSeat } from '../utils/eventServiceClient.js';
import { redis } from '../config/redis.js';


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY as string,
    key_secret: process.env.RAZORPAY_SECRET as string,
});

export const createCheckout = async (req: Request, res: Response) =>{
    const parsed = seatIdParamSchema.safeParse(req.params);
    if(!parsed.success){
        return res.status(400).json({
            message: 'Validation Failed',
            error: z.flattenError(parsed.error).fieldErrors,
        });
    }

    const { seatId } = parsed.data;
    const lockKey = `lock:seat:${seatId}`

    try{
        const lockOwnerId = await redis.get(lockKey);
        if(!lockOwnerId){
            return res.status(409).json({
                message: 'You must select this seat before checking out !!',
            });
        }

        if(lockOwnerId !== req.user!.userId){
            return res.status(403).json({
                message: 'This seat is being held by someone else',
            });
        }

        const seat = await getSeat(seatId);
        if(!seat){
            return res.status(404).json({ message: 'Seat does not exists !!'});
        }

        if(seat.status !== 'locked'){
            return res.status(409).json({ message: 'Seat must be selected before checkout !!'});
        }

        const order = await razorpay.orders.create({
            amount: seat.priceInPaise,
            currency: 'INR',
            receipt: seatId
        });

        await redis.set(
            `order:${order.id}`,
            JSON.stringify({ seatId: seat.id, userId: req.user!.userId,
                eventId: seat.eventId,
            }),
            'PX', 300000  
        );

        return res.status(200).json({
            orderId: order.id,
            orderAmount: order.amount,
            orderCurrency: order.currency,
            keyId: process.env.RAZORPAY_KEY,
        });
    }catch(err){
        console.error('Checkout creation error: ', err);
        return res.status(500).json({ message: 'Something went wrong while creating checkout'});
    }
};



import 'dotenv/config';
import { raw, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import crypto from 'crypto';
import { updateSeat } from '../utils/eventServiceClient.js';
import { io } from '../server.js';
import { redis } from '../config/redis.js';

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET as string;

export const handleRazorpayWebhook = async (req: Request, res: Response) =>{
    try{
        const rawBody = req.body as Buffer;

        const signature = req.headers['x-razorpay-signature'] as string;
        if(!signature){
            return res.status(400).json({ message: 'Missing signature header'});
        }

        const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

        if(expectedSignature !== signature){
            console.error('Webhook signature mismatched - possibly spoofed request');
            return res.status(400).json({ message: 'Invalid Signature'});
        }

        const event = JSON.parse(rawBody.toString());

        if(event.event !== 'payment.captured'){
            console.log('Event Ignored');
            return res.status(200).json({ message: 'Event ignored' });
        }

        const payment = event.payload.payment.entity;
        const paymentId = payment.id;
        const orderId = payment.order_id;

        const idempotencyKey = `webhook:processed:${paymentId}`;
        const firstTimeProcessing = await redis.set(idempotencyKey, '1', 'EX', 86400, 'NX');

        if(!firstTimeProcessing){
            console.log(`Webhook for payment ${paymentId} already processed , skipping`);
            return res.status(200).json({ message: 'Already Processed'});
        }

        const orderDataRaw = await redis.get(`order:${orderId}`);
        if(!orderDataRaw){
            console.error(`No order mapping found for ${orderId} — hold may have expired before payment completed`);
            return res.status(200).json({ message: 'Order mapping not found, cannot finalize' });
        }

        const { seatId, userId, eventId } = JSON.parse(orderDataRaw);

        await updateSeat(seatId, 'booked');

        await prisma.booking.upsert({
            where: { seatId },
            update: { userId, status: 'confirmed', bookedAt: new Date() },
            create: { userId, seatId, eventId },
        });

        await redis.del(`lock:seat:${seatId}`);
        await redis.del(`order:${orderId}`);

        io.to(`event:${eventId}`).emit('seatUpdated', {
            seatId,
            status: 'booked',
        });

        console.log(`✅ Booking confirmed via webhook for seat ${seatId}, payment ${paymentId}`);

        return res.status(200).json({ message: 'Webhook processed successfully' });
    }catch(err){
        console.error('Webhook processing error:', err);
        return res.status(500).json({ message: 'Webhook processing failed' });
    }
    
};
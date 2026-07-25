import { Server } from "socket.io";
import { Redis } from 'ioredis';

export const initSubsrciber = (io: Server) =>{
    const subscriber = new Redis(process.env.REDIS_URL as string);

    subscriber.subscribe('seatUpdated', (err) =>{
        if(err){
            console.error('❌ Failed to subscribe to seatUpdated channel:', err);
            return;
        }

        console.log('✨ Subscribed to seatUpdated channel');
    });

    subscriber.on('message' , (channel, message) =>{
        if(channel !== 'seatUpdated') return;

        try{
            const data = JSON.parse(message);

            io.to(`event:${data.eventId}`).emit('seatUpdated', data);
            console.log('📡 Forwarded seatUpdated:', data);    
        }catch(err){
            console.error('❌ Failed to parse seatUpdated message:', err);
        }
    });
 };
import 'dotenv/config';
import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

if(!REDIS_URL){
    throw new Error('DATABASE_URL not found in .env');
}

export const redis = new Redis(REDIS_URL);

export const connectRedis = async () =>{
    try{
        const pong = await redis.ping();
        console.log(`✨ Redis connected successfully. (${pong})`);
    }catch(err){
        console.error('Redis connection faliure : ', err);
        process.exit(1);
    }
};
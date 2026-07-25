import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export const dbConnect = async () =>{
    try{
        await prisma.$connect;
        console.log('✨ Supabase Database connected via Prisma 7 Driver Adapter successfully.');
    }catch(err){
        console.error('❌ Database connection failure:', err);
        process.exit(1);
    }
};
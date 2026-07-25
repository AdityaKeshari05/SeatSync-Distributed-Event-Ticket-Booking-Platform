import 'dotenv/config';
import app from './app.js';
import { connectRedis } from './config/redis.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5003;

const startServer = async () =>{
    await connectDB();
    await connectRedis();
    
    app.listen(PORT, ()=>{
        console.log(`🔐 Event service running on http://localhost:${PORT}`);
    });
};


startServer();
import 'dotenv/config';
import app from './app.js';
import { Server } from 'socket.io'
import { initSocket } from './socket/index.js';
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { createServer } from 'node:http';
const PORT = process.env.PORT || 5002;

const httpServer = createServer(app);

const io =  new Server(httpServer , {
    cors: { origin: '*'},
});

initSocket(io);


const startServer = async () =>{
    await connectDB();
    await connectRedis();

    httpServer.listen(PORT , () =>{
        console.log(`🔐 Booking service running on http://localhost:${PORT}`);
    });
};

startServer();
export { io };

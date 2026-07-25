import express from 'express';
import bookingRoutes from './routes/bookingRoutes.js'
import cors from 'cors';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/' , bookingRoutes);

app.get('/health', (req,res) =>{
    return res.status(200).json({ status: 'OK' , message: 'Booking Service running fine'});
});

export default app;
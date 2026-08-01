import express from 'express';
import bookingRoutes from './routes/bookingRoutes.js'
import cors from 'cors';
import webhookRoute from './routes/webhookRoutes.js';

const app = express();
app.use(cors({ origin: '*' }));

app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRoute);


app.use(express.json());

app.use('/' , bookingRoutes);

app.get('/health', (req,res) =>{
    return res.status(200).json({ status: 'OK' , message: 'Booking Service running fine'});
});

export default app;
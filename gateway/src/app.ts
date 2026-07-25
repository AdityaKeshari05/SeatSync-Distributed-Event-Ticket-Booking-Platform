import express from 'express';
import proxy from 'express-http-proxy';

const app = express();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL as string;
const EVENT_SERVICE_URL = process.env.EVENT_SERVICE_URL as string;
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL as string;

app.get('/health', (req, res) =>{
    return res.status(200).json({
        status: 'OK',
        message: 'Health Api working fine',
    });
});

app.use('/auth', proxy(AUTH_SERVICE_URL));
app.use('/events', proxy(EVENT_SERVICE_URL));
app.use('/seats', proxy(BOOKING_SERVICE_URL));

export default app;

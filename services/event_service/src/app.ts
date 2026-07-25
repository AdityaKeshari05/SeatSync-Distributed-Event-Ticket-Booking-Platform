import express from 'express';
import eventRoutes from './routes/eventRoutes.js';
const app = express();
app.use(express.json());

app.use('/' , eventRoutes);

app.get('/health', (req, res) =>{
    return res.status(200).json({
        status: 'OK',
        message: 'Event Service running fine.'
    });
});

export default app;
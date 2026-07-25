import express from 'express';
import authRoutes from './routes/authRoutes.js';

const app = express();
app.use(express.json())

app.use('/' , authRoutes);

app.get('/health' , (req,res)=>{
    return res.status(200).json({
        status: 'OK',
        message: 'Auth service running fine',
    });
});

export default app;
import 'dotenv/config';
import app from './app.js';
import { dbConnect } from './config/db.js';


const PORT = process.env.PORT || 5001;

const startSever = async ()=>{
    await dbConnect();

    app.listen(PORT , ()=>{
        console.log(`🔐 Auth service running on http://localhost:${PORT}`);
    });
};

startSever();
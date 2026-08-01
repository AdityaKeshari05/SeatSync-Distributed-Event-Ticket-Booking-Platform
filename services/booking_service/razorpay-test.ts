import 'dotenv/config';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY as string, 
    key_secret: process.env.RAZORPAY_SECRET as string,
});

const testOrder = async ()=>{
    try{
        const order = await razorpay.orders.create({
            amount: 50000,
            currency: 'INR',
            receipt: 'test_reciept_001',
        });
        console.log('✅ Order created successfully:', order);
    }catch(err){
        console.error('❌ Order creation failed:', err);
    }
};

testOrder();
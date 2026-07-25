import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload} from '../utils/jwt.js';

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload
        }
    }
}

export const protect = (req: Request , res: Response, next: NextFunction) =>{
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({message : 'Acess Denied!! No token Provided'});
    }
    
    const token = authHeader.split(' ')[1] as string;
    const decoded = verifyToken(token);

    try{
        const decoded = verifyToken(token);
        req.user = decoded;

        next();
    }catch(err){
        return res.status(401).json({message: 'Invalid or Expired token'});
    }

};

export const restrictTo = (role: 'user' | 'admin') =>{
    return (req: Request, res: Response, next: NextFunction) =>{
        if(req.user?.role !== role){
            return res.status(403).json({message: 'Insufficient Permission'});
        }

        next();
    };
};


import 'dotenv/config';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if(!JWT_SECRET){
    throw new Error('JWT_SECRET not defined in .env');
}

// Data that we will embebed in the token 
export interface JwtPayload{
    userId: string,
    role: 'user' | 'admin';
}
// generate the jwt token using the JwtPayload
export const signToken = (payload: JwtPayload): string =>{
    return jwt.sign(payload , JWT_SECRET , {
        expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
};
// Verify the token. 
export const verifyToken = (token: string): JwtPayload =>{
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
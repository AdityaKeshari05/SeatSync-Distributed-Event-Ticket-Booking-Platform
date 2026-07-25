import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/db.js';
import { signToken } from '../utils/jwt.js';
import { signupSchema, loginSchema } from '../validator/authValidator.js';
import { z } from 'zod';

const SALT_ROUNDS = 10;

export const signup = async (req: Request, res: Response) =>{
    // Validate the input
    const parsed = signupSchema.safeParse(req.body);
    if(!parsed.success){
        return res.status(400).json({message: 'Validation failed' , 
            errors: z.flattenError(parsed.error).fieldErrors,
        });
    }
    const { name, email, password } = parsed.data;
    try{

        const existingUser  = await prisma.user.findUnique({ where: { email } } );
        if(existingUser){
            return res.status(409).json({message: 'Email already in use'});
        }

        const passwordHash = await bcrypt.hash(password , SALT_ROUNDS);
        //create the user
        const user = await prisma.user.create({
            data: { name, email, passwordHash },
        });

        const token = signToken({userId: user.id , role: user.role});
        
        return res.status(201).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: token
            }
        });
    }catch(err){
        console.log('Signup Error: ', err);
        return res.status(500).json({message: 'Something went wrong during signup'});
    }
};


export const login = async (req: Request, res: Response) =>{

    const parsed = loginSchema.safeParse(req.body);
    if(!parsed.success){
         return res.status(400).json({message: 'Validation failed' , 
            errors: z.flattenError(parsed.error).fieldErrors,
        });
    }

    const { email , password } = parsed.data;
    
    try{
        const user = await prisma.user.findUnique({ where: { email } } );
        if(!user){
            return res.status(401).json({message: 'Invalid email or password'});
        }
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if(!isValidPassword){
            return res.status(401).json({message: 'Invalid email or Password'});
        }

        const token = signToken({userId: user.id, role: user.role});
        
        return res.status(201).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: token
            }
        });
        
    }catch(err){
        console.log('Login Error: ', err);
        return res.status(500).json({message: 'Something went wrong during login'});
    }
};
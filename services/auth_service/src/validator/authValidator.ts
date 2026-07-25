import { z } from 'zod';

export const signupSchema = z.object({
    name: z.string().min(2 , 'Name must be of atleast 2 characters'),
    email: z.email('Invalid email address'),
    password: z.string().min(8 , 'Password must be 8 characters long'),
});

export const loginSchema = z.object({
    email: z.email('Invalid Email Address'),
    password: z.string().min(8 , 'Password must be 8 characters long')
});

export type signupInput = z.infer<typeof signupSchema>;
export type loginInput = z.infer<typeof loginSchema>;
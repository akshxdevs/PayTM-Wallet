import { z } from "zod";

export const userSignupSchema = z.object({
    name: z.string().min(1).max(100),
    username: z.string().min(3).max(50),
    password: z.string().min(6).max(100),
});

export const merchantSignupSchema = z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(6).max(100),
});

export const signinSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

export const onrampSchema = z.object({
    amount: z.number().int().positive("Amount must be a positive integer"),
});

export const merchantTransferSchema = z.object({
    merchantId: z.string().uuid("Invalid merchant ID"),
    amount: z.number().int().positive("Amount must be a positive integer"),
});

export const userTransferSchema = z.object({
    toUserId: z.string().uuid("Invalid user ID"),
    amount: z.number().int().positive("Amount must be a positive integer"),
});

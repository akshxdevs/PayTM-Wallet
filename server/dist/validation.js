"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userTransferSchema = exports.merchantTransferSchema = exports.onrampSchema = exports.signinSchema = exports.merchantSignupSchema = exports.userSignupSchema = void 0;
const zod_1 = require("zod");
exports.userSignupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    username: zod_1.z.string().min(3).max(50),
    password: zod_1.z.string().min(6).max(100),
});
exports.merchantSignupSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(50),
    password: zod_1.z.string().min(6).max(100),
});
exports.signinSchema = zod_1.z.object({
    username: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1),
});
exports.onrampSchema = zod_1.z.object({
    amount: zod_1.z.number().int().positive("Amount must be a positive integer"),
});
exports.merchantTransferSchema = zod_1.z.object({
    merchantId: zod_1.z.string().uuid("Invalid merchant ID"),
    amount: zod_1.z.number().int().positive("Amount must be a positive integer"),
});
exports.userTransferSchema = zod_1.z.object({
    toUserId: zod_1.z.string().uuid("Invalid user ID"),
    amount: zod_1.z.number().int().positive("Amount must be a positive integer"),
});

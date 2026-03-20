"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_1 = require("express");
const config_1 = require("../config");
const db_1 = require("../db");
const middleware_1 = require("../middleware");
const validation_1 = require("../validation");
exports.userRouter = (0, express_1.Router)();
exports.userRouter.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsed = validation_1.userSignupSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: parsed.error.issues[0].message });
            return;
        }
        const { name, username, password } = parsed.data;
        const existing = yield db_1.prisma.user.findUnique({ where: { username } });
        if (existing) {
            res.status(409).json({ message: "Username already taken" });
            return;
        }
        yield db_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            const user = yield tx.user.create({
                data: { name, username, password: hashedPassword },
            });
            yield tx.userAccount.create({
                data: { userId: user.id },
            });
        }));
        res.json({ message: "User account created successfully!" });
    }
    catch (error) {
        res.status(500).json({ message: "Error while signing up" });
    }
}));
exports.userRouter.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsed = validation_1.signinSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: parsed.error.issues[0].message });
            return;
        }
        const { username, password } = parsed.data;
        const user = yield db_1.prisma.user.findUnique({ where: { username } });
        if (!user || !(yield bcrypt_1.default.compare(password, user.password))) {
            res.status(403).json({ message: "Invalid username or password!" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ ID: user.id }, config_1.USER_SECRET);
        res.json({ message: "User login successful!", token });
    }
    catch (error) {
        res.status(500).json({ message: "Error while signing in" });
    }
}));
//@ts-ignore
exports.userRouter.get("/balance", middleware_1.userAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const account = yield db_1.prisma.userAccount.findUnique({
            where: { userId: req.ID },
        });
        if (!account) {
            res.status(404).json({ message: "Account not found" });
            return;
        }
        res.json({ balance: account.balance, locked: account.locked });
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching balance" });
    }
}));
//@ts-ignore
exports.userRouter.get("/transactions", middleware_1.userAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactions = yield db_1.prisma.transaction.findMany({
            where: {
                OR: [
                    { fromUserId: req.ID },
                    { toUserId: req.ID },
                ],
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });
        res.json({ transactions });
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching transactions" });
    }
}));
//@ts-ignore
exports.userRouter.post("/onramp", middleware_1.userAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsed = validation_1.onrampSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: parsed.error.issues[0].message });
            return;
        }
        const { amount } = parsed.data;
        const userId = req.ID;
        yield db_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.userAccount.update({
                where: { userId },
                data: { balance: { increment: amount } },
            });
            yield tx.transaction.create({
                data: {
                    amount,
                    type: "ONRAMP",
                    toUserId: userId,
                },
            });
        }));
        res.json({ message: "On-ramp successful" });
    }
    catch (error) {
        res.status(500).json({ message: "Error during on-ramp" });
    }
}));
//@ts-ignore
exports.userRouter.post("/transfer/merchant", middleware_1.userAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsed = validation_1.merchantTransferSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: parsed.error.issues[0].message });
            return;
        }
        const { merchantId, amount } = parsed.data;
        const userId = req.ID;
        yield db_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.$queryRaw `SELECT * FROM "UserAccount" WHERE "userId" = ${userId} FOR UPDATE`;
            const userAccount = yield tx.userAccount.findUnique({
                where: { userId },
            });
            if (!userAccount || userAccount.balance < amount) {
                throw new Error("INSUFFICIENT_BALANCE");
            }
            const merchantAccount = yield tx.merchantAccount.findUnique({
                where: { merchantId },
            });
            if (!merchantAccount) {
                throw new Error("MERCHANT_NOT_FOUND");
            }
            yield tx.userAccount.update({
                where: { userId },
                data: { balance: { decrement: amount } },
            });
            yield tx.merchantAccount.update({
                where: { merchantId },
                data: { balance: { increment: amount } },
            });
            yield tx.transaction.create({
                data: {
                    amount,
                    type: "MERCHANT_PAYMENT",
                    fromUserId: userId,
                    toMerchantId: merchantId,
                },
            });
        }), {
            maxWait: 10000,
            timeout: 30000,
        });
        res.json({ message: "Payment successful" });
    }
    catch (error) {
        if (error.message === "INSUFFICIENT_BALANCE") {
            res.status(400).json({ message: "Insufficient balance" });
            return;
        }
        if (error.message === "MERCHANT_NOT_FOUND") {
            res.status(404).json({ message: "Merchant not found" });
            return;
        }
        res.status(500).json({ message: "Payment failed" });
    }
}));
//@ts-ignore
exports.userRouter.post("/send", middleware_1.userAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsed = validation_1.userTransferSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: parsed.error.issues[0].message });
            return;
        }
        const { toUserId, amount } = parsed.data;
        const fromUserId = req.ID;
        if (fromUserId === toUserId) {
            res.status(400).json({ message: "Cannot send to yourself" });
            return;
        }
        yield db_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.$queryRaw `SELECT * FROM "UserAccount" WHERE "userId" = ${fromUserId} FOR UPDATE`;
            const senderAccount = yield tx.userAccount.findUnique({
                where: { userId: fromUserId },
            });
            if (!senderAccount || senderAccount.balance < amount) {
                throw new Error("INSUFFICIENT_BALANCE");
            }
            const receiverAccount = yield tx.userAccount.findUnique({
                where: { userId: toUserId },
            });
            if (!receiverAccount) {
                throw new Error("RECIPIENT_NOT_FOUND");
            }
            yield tx.userAccount.update({
                where: { userId: fromUserId },
                data: { balance: { decrement: amount } },
            });
            yield tx.userAccount.update({
                where: { userId: toUserId },
                data: { balance: { increment: amount } },
            });
            yield tx.transaction.create({
                data: {
                    amount,
                    type: "TRANSFER",
                    fromUserId,
                    toUserId,
                },
            });
        }), {
            maxWait: 10000,
            timeout: 30000,
        });
        res.json({ message: "Transfer successful" });
    }
    catch (error) {
        if (error.message === "INSUFFICIENT_BALANCE") {
            res.status(400).json({ message: "Insufficient balance" });
            return;
        }
        if (error.message === "RECIPIENT_NOT_FOUND") {
            res.status(404).json({ message: "Recipient not found" });
            return;
        }
        res.status(500).json({ message: "Transfer failed" });
    }
}));

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Router } from "express";
import { USER_SECRET } from "../config";
import { prisma } from "../db";
import { AuthRequest, userAuthMiddleware } from "../middleware";
import {
    userSignupSchema,
    signinSchema,
    onrampSchema,
    merchantTransferSchema,
    userTransferSchema,
} from "../validation";

export const userRouter = Router();

userRouter.post("/signup", async (req, res) => {
    try {
        const parsed = userSignupSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: parsed.error.issues[0].message });
            return;
        }
        const { name, username, password } = parsed.data;

        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            res.status(409).json({ message: "Username already taken" });
            return;
        }

        await prisma.$transaction(async (tx) => {
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await tx.user.create({
                data: { name, username, password: hashedPassword },
            });
            await tx.userAccount.create({
                data: { userId: user.id },
            });
        });

        res.json({ message: "User account created successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error while signing up" });
    }
});

userRouter.post("/signin", async (req, res) => {
    try {
        const parsed = signinSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: parsed.error.issues[0].message });
            return;
        }
        const { username, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            res.status(403).json({ message: "Invalid username or password!" });
            return;
        }

        const token = jwt.sign({ ID: user.id }, USER_SECRET);
        res.json({ message: "User login successful!", token });
    } catch (error) {
        res.status(500).json({ message: "Error while signing in" });
    }
});

//@ts-ignore
userRouter.get("/balance", userAuthMiddleware, async (req: AuthRequest, res) => {
    try {
        const account = await prisma.userAccount.findUnique({
            where: { userId: req.ID },
        });
        if (!account) {
            res.status(404).json({ message: "Account not found" });
            return;
        }
        res.json({ balance: account.balance, locked: account.locked });
    } catch (error) {
        res.status(500).json({ message: "Error fetching balance" });
    }
});

//@ts-ignore
userRouter.get("/transactions", userAuthMiddleware, async (req: AuthRequest, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
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
    } catch (error) {
        res.status(500).json({ message: "Error fetching transactions" });
    }
});

//@ts-ignore
userRouter.post("/onramp", userAuthMiddleware, async (req: AuthRequest, res) => {
    try {
        const parsed = onrampSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: parsed.error.issues[0].message });
            return;
        }
        const { amount } = parsed.data;
        const userId = req.ID!;

        await prisma.$transaction(async (tx) => {
            await tx.userAccount.update({
                where: { userId },
                data: { balance: { increment: amount } },
            });
            await tx.transaction.create({
                data: {
                    amount,
                    type: "ONRAMP",
                    toUserId: userId,
                },
            });
        });

        res.json({ message: "On-ramp successful" });
    } catch (error) {
        res.status(500).json({ message: "Error during on-ramp" });
    }
});

//@ts-ignore
userRouter.post("/transfer/merchant", userAuthMiddleware, async (req: AuthRequest, res) => {
    try {
        const parsed = merchantTransferSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: parsed.error.issues[0].message });
            return;
        }
        const { merchantId, amount } = parsed.data;
        const userId = req.ID!;

        await prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT * FROM "UserAccount" WHERE "userId" = ${userId} FOR UPDATE`;

            const userAccount = await tx.userAccount.findUnique({
                where: { userId },
            });
            if (!userAccount || userAccount.balance < amount) {
                throw new Error("INSUFFICIENT_BALANCE");
            }

            const merchantAccount = await tx.merchantAccount.findUnique({
                where: { merchantId },
            });
            if (!merchantAccount) {
                throw new Error("MERCHANT_NOT_FOUND");
            }

            await tx.userAccount.update({
                where: { userId },
                data: { balance: { decrement: amount } },
            });
            await tx.merchantAccount.update({
                where: { merchantId },
                data: { balance: { increment: amount } },
            });
            await tx.transaction.create({
                data: {
                    amount,
                    type: "MERCHANT_PAYMENT",
                    fromUserId: userId,
                    toMerchantId: merchantId,
                },
            });
        }, {
            maxWait: 10000,
            timeout: 30000,
        });

        res.json({ message: "Payment successful" });
    } catch (error: any) {
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
});

//@ts-ignore
userRouter.post("/send", userAuthMiddleware, async (req: AuthRequest, res) => {
    try {
        const parsed = userTransferSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: parsed.error.issues[0].message });
            return;
        }
        const { toUserId, amount } = parsed.data;
        const fromUserId = req.ID!;

        if (fromUserId === toUserId) {
            res.status(400).json({ message: "Cannot send to yourself" });
            return;
        }

        await prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT * FROM "UserAccount" WHERE "userId" = ${fromUserId} FOR UPDATE`;

            const senderAccount = await tx.userAccount.findUnique({
                where: { userId: fromUserId },
            });
            if (!senderAccount || senderAccount.balance < amount) {
                throw new Error("INSUFFICIENT_BALANCE");
            }

            const receiverAccount = await tx.userAccount.findUnique({
                where: { userId: toUserId },
            });
            if (!receiverAccount) {
                throw new Error("RECIPIENT_NOT_FOUND");
            }

            await tx.userAccount.update({
                where: { userId: fromUserId },
                data: { balance: { decrement: amount } },
            });
            await tx.userAccount.update({
                where: { userId: toUserId },
                data: { balance: { increment: amount } },
            });
            await tx.transaction.create({
                data: {
                    amount,
                    type: "TRANSFER",
                    fromUserId,
                    toUserId,
                },
            });
        }, {
            maxWait: 10000,
            timeout: 30000,
        });

        res.json({ message: "Transfer successful" });
    } catch (error: any) {
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
});

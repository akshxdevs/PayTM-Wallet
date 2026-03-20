import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Router } from "express";
import { MERCHANT_SECRET } from "../config";
import { prisma } from "../db";
import { AuthRequest, merchantAuthMiddleware } from "../middleware";
import { merchantSignupSchema, signinSchema } from "../validation";

export const merchantRouter = Router();

merchantRouter.post("/signup", async (req, res) => {
    try {
        const parsed = merchantSignupSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: parsed.error.issues[0].message });
            return;
        }
        const { username, password } = parsed.data;

        const existing = await prisma.merchant.findUnique({ where: { username } });
        if (existing) {
            res.status(409).json({ message: "Username already taken" });
            return;
        }

        await prisma.$transaction(async (tx) => {
            const hashedPassword = await bcrypt.hash(password, 10);
            const merchant = await tx.merchant.create({
                data: { username, password: hashedPassword },
            });
            await tx.merchantAccount.create({
                data: { merchantId: merchant.id },
            });
        });

        res.json({ message: "Merchant account created successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error while signing up" });
    }
});

merchantRouter.post("/signin", async (req, res) => {
    try {
        const parsed = signinSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: parsed.error.issues[0].message });
            return;
        }
        const { username, password } = parsed.data;

        const merchant = await prisma.merchant.findUnique({ where: { username } });
        if (!merchant || !(await bcrypt.compare(password, merchant.password))) {
            res.status(403).json({ message: "Invalid username or password!" });
            return;
        }

        const token = jwt.sign({ ID: merchant.id }, MERCHANT_SECRET);
        res.json({ message: "Merchant login successful!", token });
    } catch (error) {
        res.status(500).json({ message: "Error while signing in" });
    }
});

//@ts-ignore
merchantRouter.get("/balance", merchantAuthMiddleware, async (req: AuthRequest, res) => {
    try {
        const account = await prisma.merchantAccount.findUnique({
            where: { merchantId: req.ID },
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
merchantRouter.get("/transactions", merchantAuthMiddleware, async (req: AuthRequest, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: { toMerchantId: req.ID },
            orderBy: { createdAt: "desc" },
            take: 20,
        });
        res.json({ transactions });
    } catch (error) {
        res.status(500).json({ message: "Error fetching transactions" });
    }
});

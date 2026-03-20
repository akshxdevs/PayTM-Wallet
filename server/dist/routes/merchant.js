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
exports.merchantRouter = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_1 = require("express");
const config_1 = require("../config");
const db_1 = require("../db");
const middleware_1 = require("../middleware");
const validation_1 = require("../validation");
exports.merchantRouter = (0, express_1.Router)();
exports.merchantRouter.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsed = validation_1.merchantSignupSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: parsed.error.issues[0].message });
            return;
        }
        const { username, password } = parsed.data;
        const existing = yield db_1.prisma.merchant.findUnique({ where: { username } });
        if (existing) {
            res.status(409).json({ message: "Username already taken" });
            return;
        }
        yield db_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            const merchant = yield tx.merchant.create({
                data: { username, password: hashedPassword },
            });
            yield tx.merchantAccount.create({
                data: { merchantId: merchant.id },
            });
        }));
        res.json({ message: "Merchant account created successfully!" });
    }
    catch (error) {
        res.status(500).json({ message: "Error while signing up" });
    }
}));
exports.merchantRouter.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsed = validation_1.signinSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: parsed.error.issues[0].message });
            return;
        }
        const { username, password } = parsed.data;
        const merchant = yield db_1.prisma.merchant.findUnique({ where: { username } });
        if (!merchant || !(yield bcrypt_1.default.compare(password, merchant.password))) {
            res.status(403).json({ message: "Invalid username or password!" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ ID: merchant.id }, config_1.MERCHANT_SECRET);
        res.json({ message: "Merchant login successful!", token });
    }
    catch (error) {
        res.status(500).json({ message: "Error while signing in" });
    }
}));
//@ts-ignore
exports.merchantRouter.get("/balance", middleware_1.merchantAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const account = yield db_1.prisma.merchantAccount.findUnique({
            where: { merchantId: req.ID },
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
exports.merchantRouter.get("/transactions", middleware_1.merchantAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactions = yield db_1.prisma.transaction.findMany({
            where: { toMerchantId: req.ID },
            orderBy: { createdAt: "desc" },
            take: 20,
        });
        res.json({ transactions });
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching transactions" });
    }
}));

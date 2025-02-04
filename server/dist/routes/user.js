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
const client_1 = require("@prisma/client");
const express_1 = require("express");
const config_1 = require("../config");
const middleware_1 = require("../middleware");
exports.userRouter = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
exports.userRouter.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, username, password } = req.body;
        if (!name || !username || !password) {
            res.status(403).send({
                message: "All feilds are required!"
            });
        }
        else {
            yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                const user = yield tx.user.create({
                    data: {
                        name: name,
                        username: username,
                        password: password
                    }
                });
                yield tx.userAccount.create({
                    data: {
                        userId: user.id
                    }
                });
                res.json({
                    message: "User Account created sucessfully!"
                });
            }));
        }
    }
    catch (error) {
        res.status(411).send({ message: "Error while sigining.." });
    }
}));
exports.userRouter.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(403).send({
                message: "All feilds are required!"
            });
        }
        const user = yield prismaClient.user.findFirst({
            where: {
                username: username
            }
        });
        if (user) {
            const token = jsonwebtoken_1.default.sign({
                ID: user.id,
            }, config_1.USER_SECERT);
            res.json({
                message: "User Login Sucessfull!!",
                token: token
            });
        }
        else {
            res.status(403).send({
                message: "No User Found!!"
            });
        }
    }
    catch (error) {
        res.status(411).send({ message: "Error while logging.." });
    }
}));
exports.userRouter.post("/onramp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, amount } = req.body;
        yield prismaClient.userAccount.update({
            where: {
                userId: userId
            },
            data: {
                balance: {
                    increment: amount
                }
            }
        });
        res.json({
            message: "On Ramp Done"
        });
    }
    catch (error) {
        res.status(411).send({ message: "Error while logging.." });
    }
}));
//@ts-ignore
exports.userRouter.post("/transfer", middleware_1.userAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { merchantId, amount } = req.body;
    const userId = req.ID;
    const paymentDone = yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.$queryRaw `SELECT * FROM "UserAccount" WHERE "userId" = ${userId} FOR UPDATE`;
        const userAccount = yield tx.userAccount.findFirst({
            where: {
                userId: userId
            }
        });
        if (((userAccount === null || userAccount === void 0 ? void 0 : userAccount.balance) || 0) < amount) {
            res.status(403).send({
                message: "Insufficient Balance!!"
            });
        }
        console.log("Balance Check Passed!!");
        yield new Promise((r) => setTimeout(r, 5000));
        yield tx.userAccount.update({
            where: {
                userId: userId
            },
            data: {
                balance: {
                    decrement: amount
                }
            }
        });
        yield tx.merchantAccount.update({
            where: {
                merchantId: merchantId
            },
            data: {
                balance: {
                    increment: amount
                }
            }
        });
        return true;
    }), {
        maxWait: 50000,
        timeout: 100000
    });
    if (paymentDone) {
        return res.json({
            message: "Payment Successfull"
        });
    }
    else {
        return res.status(411).json({
            message: "Payment Unsuccessfull"
        });
    }
}));

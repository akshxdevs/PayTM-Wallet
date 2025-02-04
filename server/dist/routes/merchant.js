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
const client_1 = require("@prisma/client");
const express_1 = require("express");
const config_1 = require("../config");
exports.merchantRouter = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
exports.merchantRouter.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(403).send({
                message: "All feilds are required!"
            });
        }
        else {
            yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                const merchant = yield tx.merchant.create({
                    data: {
                        username: username,
                        password: password
                    }
                });
                yield tx.merchantAccount.create({
                    data: {
                        merchantId: merchant.id
                    }
                });
                res.json({
                    message: "Merchant Account created sucessfully!"
                });
            }));
        }
    }
    catch (error) {
        res.status(411).send({ message: "Error while sigining.." });
    }
}));
exports.merchantRouter.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(403).send({
                message: "All feilds are required!"
            });
        }
        const merchant = yield prismaClient.merchant.findFirst({
            where: {
                username: username
            }
        });
        if (merchant) {
            const token = jsonwebtoken_1.default.sign({
                ID: merchant.id,
            }, config_1.MERCHANT_SECERT);
            res.json({
                message: "Merchant Login Sucessfull!!",
                token: token
            });
        }
        else {
            res.status(403).send({
                message: "No Merchant Found!!"
            });
        }
    }
    catch (error) {
        res.status(411).send({ message: "Error while logging.." });
    }
}));

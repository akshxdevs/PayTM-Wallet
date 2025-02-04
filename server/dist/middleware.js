"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantAuthMiddleware = exports.userAuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
const userAuthMiddleware = (req, res, next) => {
    const token = req.headers["authorization"];
    const verified = jsonwebtoken_1.default.verify(token, config_1.USER_SECERT);
    if (verified) {
        req.ID = verified.ID;
        next();
    }
    else {
        return res.status(403).json({
            message: "Not Authorzied!!"
        });
    }
};
exports.userAuthMiddleware = userAuthMiddleware;
const MerchantAuthMiddleware = (req, res, next) => {
    const token = req.headers["authorization"];
    const verified = jsonwebtoken_1.default.verify(token, config_1.MERCHANT_SECERT);
    if (verified) {
        req.ID = verified.ID;
        next();
    }
    else {
        return res.status(403).json({
            message: "Not Authorzied!!"
        });
    }
};
exports.MerchantAuthMiddleware = MerchantAuthMiddleware;

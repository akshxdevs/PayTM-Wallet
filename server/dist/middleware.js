"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.merchantAuthMiddleware = exports.userAuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
const userAuthMiddleware = (req, res, next) => {
    try {
        const header = req.headers["authorization"];
        if (!header) {
            return res.status(403).json({ message: "Token missing!" });
        }
        const token = header.startsWith("Bearer ") ? header.slice(7) : header;
        const verified = jsonwebtoken_1.default.verify(token, config_1.USER_SECRET);
        req.ID = verified.ID;
        next();
    }
    catch (error) {
        return res.status(403).json({ message: "Not Authorized!" });
    }
};
exports.userAuthMiddleware = userAuthMiddleware;
const merchantAuthMiddleware = (req, res, next) => {
    try {
        const header = req.headers["authorization"];
        if (!header) {
            return res.status(403).json({ message: "Token missing!" });
        }
        const token = header.startsWith("Bearer ") ? header.slice(7) : header;
        const verified = jsonwebtoken_1.default.verify(token, config_1.MERCHANT_SECRET);
        req.ID = verified.ID;
        next();
    }
    catch (error) {
        return res.status(403).json({ message: "Not Authorized!" });
    }
};
exports.merchantAuthMiddleware = merchantAuthMiddleware;

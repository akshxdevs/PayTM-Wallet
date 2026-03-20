"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MERCHANT_SECRET = exports.USER_SECRET = exports.JWT_SECRET = void 0;
function requireEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
exports.JWT_SECRET = requireEnv("JWT_SECRET");
exports.USER_SECRET = "user_" + exports.JWT_SECRET;
exports.MERCHANT_SECRET = "merchant_" + exports.JWT_SECRET;

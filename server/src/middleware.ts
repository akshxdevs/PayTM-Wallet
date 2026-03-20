import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { MERCHANT_SECRET, USER_SECRET } from "./config";

export interface AuthRequest extends Request {
    ID?: string;
}

export const userAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const header = req.headers["authorization"];
        if (!header) {
            return res.status(403).json({ message: "Token missing!" });
        }
        const token = header.startsWith("Bearer ") ? header.slice(7) : header;
        const verified: any = jwt.verify(token, USER_SECRET);
        req.ID = verified.ID;
        next();
    } catch (error) {
        return res.status(403).json({ message: "Not Authorized!" });
    }
};

export const merchantAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const header = req.headers["authorization"];
        if (!header) {
            return res.status(403).json({ message: "Token missing!" });
        }
        const token = header.startsWith("Bearer ") ? header.slice(7) : header;
        const verified: any = jwt.verify(token, MERCHANT_SECRET);
        req.ID = verified.ID;
        next();
    } catch (error) {
        return res.status(403).json({ message: "Not Authorized!" });
    }
};

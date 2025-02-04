import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { MERCHANT_SECERT, USER_SECERT } from "./config";

export interface AuthRequest extends Request {
    ID? : string;
}

export const userAuthMiddleware = (req:AuthRequest,res:Response,next:NextFunction) =>{
    const token = req.headers["authorization"] as unknown as string;
    const verified:any = jwt.verify(token,USER_SECERT) as {id:string};

    if (verified) {
        req.ID = verified.ID
        next()
    }else{
        return res.status(403).json({
            message:"Not Authorzied!!"
        })
    }
}

export const MerchantAuthMiddleware = (req:AuthRequest,res:Response,next:NextFunction) =>{
    const token = req.headers["authorization"] as unknown as string;
    const verified:any = jwt.verify(token,MERCHANT_SECERT) as {id:string};

    if (verified) {
        req.ID = verified.ID
        next()
    }else{
        return res.status(403).json({
            message:"Not Authorzied!!"
        })
    }
}
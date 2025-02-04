import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { MERCHANT_SECERT, USER_SECERT } from "../config";
export const merchantRouter = Router()

const prismaClient = new PrismaClient()

merchantRouter.post("/signup",async(req,res)=>{
    try {
        const {username,password} = req.body
        if (!username || !password){
            res.status(403).send({
                message:"All feilds are required!"
            })
        }else {
            await prismaClient.$transaction(async(tx)=>{
                const merchant = await tx.merchant.create({
                    data:{
                        username:username,
                        password:password
                    }
                })
                await tx.merchantAccount.create({
                    data:{
                        merchantId:merchant.id
                    }
                })
                res.json({
                    message:"Merchant Account created sucessfully!"
                })
                
            })
        }
    } catch (error) {
        res.status(411).send({message:"Error while sigining.."})
    }
})

merchantRouter.post("/signin",async(req,res)=>{
    try {
        const {username,password} = req.body
        if (!username || !password){
            res.status(403).send({
                message:"All feilds are required!"
            })
        }
        const merchant = await prismaClient.merchant.findFirst({
            where:{
                username:username
            }
        }) 
        if (merchant) {
            const token = jwt.sign({
                ID : merchant.id,
            },MERCHANT_SECERT)
            res.json({
                message:"Merchant Login Sucessfull!!",
                token: token
            })
        }else{
            res.status(403).send({
                message:"No Merchant Found!!"
            })
        }
        
    } catch (error) {
        res.status(411).send({message:"Error while logging.."})
    }
})


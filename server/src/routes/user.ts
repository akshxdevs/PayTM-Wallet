import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { USER_SECERT } from "../config";
import { AuthRequest, userAuthMiddleware } from "../middleware";
export const userRouter = Router()

const prismaClient = new PrismaClient()

userRouter.post("/signup",async(req,res)=>{
    try {
        const {name,username,password} = req.body
        if (!name || !username || !password){
            res.status(403).send({
                message:"All feilds are required!"
            })
        }else {
            await prismaClient.$transaction(async(tx)=>{
                const user = await tx.user.create({
                    data:{
                        name:name,
                        username:username,
                        password:password
                    }
                })
                await tx.userAccount.create({
                    data:{
                        userId: user.id
                    }
                })
                res.json({
                    message:"User Account created sucessfully!"
                })
            })    
        }
    } catch (error) {
        res.status(411).send({message:"Error while sigining.."})
    }
})

userRouter.post("/signin",async(req,res)=>{
    try {
        const {username,password} = req.body
        if (!username || !password){
            res.status(403).send({
                message:"All feilds are required!"
            })
        }
        const user = await prismaClient.user.findFirst({
            where:{
                username:username
            }
        }) 
        if (user) {
            const token = jwt.sign({
                ID : user.id,
            },USER_SECERT)
            res.json({
                message:"User Login Sucessfull!!",
                token: token
            })
        }else{
            res.status(403).send({
                message:"No User Found!!"
            })
        }
        
    } catch (error) {
        res.status(411).send({message:"Error while logging.."})
    }
})


userRouter.post("/onramp",async(req,res)=>{
    try {
        const {userId,amount} = req.body
        await prismaClient.userAccount.update({
            where:{
                userId:userId
            },
            data:{
                balance:{
                    increment:amount
                }
            }
        })
        res.json({
            message:"On Ramp Done"
        })
    } catch (error) {
        res.status(411).send({message:"Error while logging.."})
    }
});
//@ts-ignore
userRouter.post("/transfer",userAuthMiddleware,async(req:AuthRequest,res)=>{
    const {merchantId,amount} = req.body
    const userId = req.ID
    const paymentDone = await prismaClient.$transaction(async(tx)=>{
        await tx.$queryRaw`SELECT * FROM "UserAccount" WHERE "userId" = ${userId} FOR UPDATE`;
        const userAccount = await tx.userAccount.findFirst({
            where:{
                userId:userId
            }
        })
        if ((userAccount?.balance || 0) < amount ) {
            res.status(403).send({
                message:"Insufficient Balance!!"
            })
        }

        console.log("Balance Check Passed!!");
        
        await new Promise((r)=> setTimeout(r,5000))
        await tx.userAccount.update({
            where:{
                userId:userId
            },
            data:{
                balance:{
                    decrement:amount
                }
            }
        })
        await tx.merchantAccount.update({
            where:{
                merchantId:merchantId
            },
            data:{
                balance:{
                    increment:amount
                }
            }
        });
        return true;
    },{
        maxWait:50000,
        timeout:100000
    })
    if (paymentDone) {
        return res.json({
            message:"Payment Successfull"
        })
    }else{
        return res.status(411).json({
            message:"Payment Unsuccessfull"
        })
    }
})

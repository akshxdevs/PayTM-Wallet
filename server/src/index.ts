import express from "express";
import cors from "cors";
import { userRouter } from "./routes/user";
import { merchantRouter } from "./routes/merchant";

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/v1/user",userRouter);
app.use("/api/v1/merchant",merchantRouter);

app.listen(process.env.PORT || 3000,()=>{
    console.log(`Server running on port 3000`);
    
});
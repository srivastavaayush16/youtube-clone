import dotenv from "dotenv";
import connectDB from "./db/db.js";
import {app} from './app.js';

dotenv.config({
    path: './env'
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 6969, ()=>{
        console.log(`server is running at port: ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MongoDB connection failed !!", err);
    
})


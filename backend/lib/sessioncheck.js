import User from "../models/user.js";
import jwt from "jsonwebtoken";
export const sessioncheck=async(req,res,next)=>{
    try{
        const token=req.cookies.jwt;
        if(!token){
            return res.status(401).json({message:"Session expired, login again"});
        }
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        if(!decoded){
            return res.status(401).json({message:"Invalid token"});
        }
        const user=await User.findById(decoded.userId).select("-password");
        if(!user){
            return res.status(401).json({message:"User not found"});
        }
        req.user=user;
        next();
    }catch(error){
        return res.status(500).json({message:"Server error"});
    }
};

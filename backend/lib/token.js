import jwt from "jsonwebtoken";
export const generateTokenandSetCookie=(userId,res)=>{
    const token=jwt.sign({userId},process.env.JWT_SECRET,{expiresIn:'15d'});
    res.cookie("jwt",token,{
        maxAge:15*24*60*60*1000,
        httpOnly:true, //prevents XSS attacks
        sameSite:"strict", //prevents CSRF attacks
        secure: process.env.NODE_ENV!=="development", //only send the cookie over HTTPS
    });
};
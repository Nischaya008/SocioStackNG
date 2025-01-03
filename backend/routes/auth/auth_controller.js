import User from "../../models/user.js";
import bcrypt from "bcryptjs";
import {generateTokenandSetCookie} from "../../lib/token.js";

const emailRegex=/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

export const signup=async(req,res)=>{
    try{
        const {username,name,email,password}=req.body;

        if(!username||!name||!email||!password){
            return res.status(400).json({message:"Please provide all the fields"});
        }

        const existingUser=await User.findOne({username});
        if(existingUser){
            return res.status(400).json({message:"Username already exists"});
        }

        const existingEmail=await User.findOne({email});
        if(existingEmail){
            return res.status(400).json({message:"Email already exists"});
        }

        if(!emailRegex.test(email)){
            return res.status(400).json({message:"Invalid email"});
        }

        if(password.length<8){
            return res.status(400).json({message:"Password must be at least 8 characters long"});
        }

        const passwordRegex=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if(!passwordRegex.test(password)){
            return res.status(400).json({message:"Invalid password"});
        }

        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);

        const newUser=new User({username,name,email,password:hashedPassword});
        await newUser.save();

        generateTokenandSetCookie(newUser._id,res);

        res.status(201).json({
            _id:newUser._id,
            username:newUser.username,
            name:newUser.name,
            email:newUser.email,
            profileIMG:newUser.profileIMG,
            coverIMG:newUser.coverIMG,
            bio:newUser.bio,
            link:newUser.link
        });
    }catch(error){
        return res.status(500).json({message:"Server Error"});
    }
};

export const login = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const user = await User.findOne({ $or: [{ username }, { email }] });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!password) {
            return res.status(400).json({ message: "Please provide password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        generateTokenandSetCookie(user._id, res);

        res.status(200).json({
            _id: user._id,
            username: user.username,
            name: user.name,
            email: user.email,
            profileIMG: user.profileIMG,
            coverIMG: user.coverIMG,
            bio: user.bio,
            link: user.link
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

export const logout = (req, res) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(400).json({ message: "Already logged out" });
        }
        res.clearCookie("jwt");
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            _id: user._id,
            username: user.username,
            name: user.name,
            email: user.email,
            profileIMG: user.profileIMG,
            coverIMG: user.coverIMG,
            bio: user.bio,
            link: user.link,
            createdAt: user.createdAt
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};
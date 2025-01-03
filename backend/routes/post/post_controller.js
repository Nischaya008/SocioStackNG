import Post from "../../models/post.js";
import User from "../../models/user.js";
import Notification from "../../models/notification.js";
import {v2 as cloudinary} from "cloudinary";

export const createPost=async(req,res)=>{
    const {title,description}=req.body;
    let {image}=req.body;
    const userid=req.user._id;
    const user=await User.findById(userid);
    try{
        if(!user){
            return res.status(404).json({message:"Please Login to post"});
        }
        if(!title||!description){
            return res.status(400).json({message:"Please provide all the fields"});
        }
        if(image){
            const uploadedImage=await cloudinary.uploader.upload(image,{folder:"post"});
            image=uploadedImage.secure_url;
        }
        const newPost=new Post({
            user:user._id,
            title,
            description,
            image
        });
        await newPost.save();
        res.status(201).json({message:"Post created successfully"});
    }catch(error){
        return res.status(500).json({message:"Server error"});
    }
};

export const deletePost=async(req,res)=>{
    const {id}=req.params;
    const userid=req.user._id;
    try{
        const post=await Post.findById(id);
        if(!post){
            return res.status(404).json({message:"Post not found"});
        }
        if(post.user.toString()!==userid.toString()){
            return res.status(403).json({message:"You are not authorized to delete this post"});
        }
        if(post.image){
            await cloudinary.uploader.destroy(post.image.split("/").pop().split(".")[0]);
        }
        await Post.findByIdAndDelete(id);
        res.status(200).json({message:"Post deleted successfully"});
    }catch(error){
        return res.status(500).json({message:"Server error"});
    }
};

export const commentPost=async(req,res)=>{
    try{
        const {text}=req.body;
        const {id}=req.params;
        const userid=req.user._id;
        const post=await Post.findById(id);
        
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        
        if (!userid) {
            return res.status(401).json({ message: "Please login to comment" });
        }
        
        if (!text) {
            return res.status(400).json({ message: "Please provide comment" });
        }
        
        const comment = { user: userid, text };
        post.comments.push(comment);
        await post.save();
        
        res.status(200).json({ message: "Comment added successfully" });
    }catch(error){
        return res.status(500).json({message:"Server error"});
    }
};

export const like_unlike_post=async(req,res)=>{
    try{
        const{id}=req.params;
        const userid=req.user._id;
        const post=await Post.findById(id).populate('user');
        if(!post){
            return res.status(404).json({message:"Post not found"});
        }
        const isLiked=post.likes.includes(userid);
        if(isLiked){
            //Unlike
            await Post.findByIdAndUpdate(id,{$pull:{likes:userid}});
            await User.updateOne({_id:userid},{$pull:{likedPosts:id}});
            res.status(200).json({message:"Unliked successfully"});
        }else{
            //Like
            await Post.findByIdAndUpdate(id,{$push:{likes:userid}});
            await User.updateOne({_id:userid},{$push:{likedPosts:id}});
            const newNotification=new Notification({
                from:userid,
                to:post.user._id,
                type:"like"
            });
            await newNotification.save();
            res.status(200).json({message:"Liked successfully"});
        }
    }catch(error){
        return res.status(500).json({message:"Server error"});
    }
};

export const editPost=async(req,res)=>{
    const {title,description}=req.body;
    let {image}=req.body;
    const {id}=req.params;
    const userid=req.user._id;
    
    try {
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.user.toString() !== userid.toString()) {
            return res.status(403).json({ message: "You are not authorized to edit this post" });
        }

        // Handle image deletion or update
        if (image === null && post.image) {
            // Delete image from Cloudinary if it exists
            const oldImageId = post.image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(oldImageId);
            image = ''; // Set to empty string in database
        } else if (image && image !== post.image) {
            // Handle new image upload
            if (post.image) {
                const oldImageId = post.image.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(oldImageId);
            }
            const uploadedImage = await cloudinary.uploader.upload(image, {
                folder: "post",
                quality: "auto",
                fetch_format: "auto",
                flags: "lossy",
                transformation: [
                    { width: 1200, height: 1200, crop: "limit" },
                    { quality: "auto" }
                ]
            });
            image = uploadedImage.secure_url;
        } else {
            image = post.image; // Keep existing image if no change
        }

        post.title = title || post.title;
        post.description = description || post.description;
        post.image = image;
        await post.save();
        
        res.status(200).json({ message: "Post edited successfully" });
    } catch (error) {
        console.error('Edit post error:', error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getAllPosts=async(req,res)=>{
    try{
        const posts=await Post.find().sort({createdAt:-1}).populate({
            path:"user",
            select:"-password"
        }).populate({
            path:"comments.user",
            select:"-password"
        });
        if(posts.length===0){
            return res.status(404).json({message:"No posts found"});
        }
        res.status(200).json(posts);
    }catch(error){
        res.status(500).json({message:"Server error"});
    }
};

export const getAllLiked=async(req,res)=>{
    const userid=req.params.id;
    try{
        const user = await User.findById(userid);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        if(userid!==req.user._id.toString()){
            return res.status(403).json({message:"You are not authorized to view this page"});
        }
        const likedPosts=await Post.find({_id:{$in:user.likedPosts}}).sort({createdAt:-1})
        .populate({
            path:"user",
            select:"-password"
        }).populate({
            path:"comments.user",
            select:"-password"
        });
        if(likedPosts.length===0){
            return res.status(404).json({message:"No posts found"});
        }
        res.status(200).json(likedPosts);
    }catch(error){    
        res.status(500).json({message:"Server error"});
    }
};

export const getAllFollowed=async(req,res)=>{
    try{
        const userid=req.user._id;
        const user = await User.findById(userid);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        const following=user.following;
        if (following.length === 0) {
            return res.status(200).json([]); 
        }
        const followedPosts=await Post.find({user:{$in:following}}).sort({createdAt:-1})
        .populate({
            path:"user",
            select:"-password"
        }).populate({
            path:"comments.user",
            select:"-password"
        });
        if(followedPosts.length===0){
            return res.status(404).json({message:"No posts found"});
        }
        res.status(200).json(followedPosts);
    }catch(error){
        console.error(error); // Log the error for debugging
        res.status(500).json({message:"Server error"});
    }
};

export const getuserPosts=async(req,res)=>{
    try{
        const {username}=req.params;
        const user = await User.findOne({username}).select("-password");
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        const posts=await Post.find({user:user._id}).sort({createdAt:-1})
        .populate({
            path:"user",
            select:"-password"
        }).populate({
            path:"comments.user",
            select:"-password"
        });
        if(posts.length===0){
            return res.status(404).json({message:"No posts found"});
        }
        res.status(200).json(posts);
    }catch(error){
        res.status(500).json({message:"Server error"});
    }
};
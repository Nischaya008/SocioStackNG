import User from "../../models/user.js";
import Notification from "../../models/notification.js";
import bcrypt from "bcryptjs";
import {v2 as cloudinary} from "cloudinary";
import Post from "../../models/post.js";

export const getUser=async(req,res)=>{
    const{name}=req.params;
    
    try {
        if (name.length < 3) {
            return res.status(200).json([]); // Return empty array if less than 3 characters
        }

        // Use regex for case-insensitive partial matching
        const users = await User.find({
            username: { 
                $regex: name, 
                $options: 'i' // Case insensitive
            }
        })
        .select("-password")
        .limit(5); // Limit results to 5 users

        res.status(200).json(users);
    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const follow_unfollow=async(req,res)=>{
    try{
        const{id}=req.params;
        const user=await User.findById(id);
        const currentUser = await User.findById(req.user._id);
        if(id === req.user._id.toString()){
            return res.status(400).json({message:"You can't follow or unfollow yourself"});
        }
        if(!user || !currentUser){
            return res.status(404).json({message:"User not found"});
        }
        const isFollowing=currentUser.following.includes(user._id);
        if(isFollowing){
            //Unfollow
            await User.findByIdAndUpdate(id,{$pull:{followers:req.user._id}});
            await User.findByIdAndUpdate(req.user._id,{$pull:{following:id}});
            res.status(200).json({message:"Unfollowed successfully"});
        }else{
            //Follow
            await User.findByIdAndUpdate(id,{$push:{followers:req.user._id}});
            await User.findByIdAndUpdate(req.user._id,{$push:{following:id}}); 
            const newNotification=new Notification({
                from:req.user._id,
                to:id,
                type:"follow"
            });
            await newNotification.save();
            res.status(200).json({message:"Followed successfully"}); 
        }
    }catch(error){
        return res.status(500).json({message:"Server error"});
    }
};

export const getSuggested=async(req,res)=>{
    try{
        const userid=req.user._id;
        const usersfollowedbyme = await User.findById(userid).select("following");
        
        // Fetch users who are not followed by the current user and have mutual followers
        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: userid },
                    followers: { $in: usersfollowedbyme.following } // Users followed by current user's following
                }
            },
            { $sample: { size: 10 } }
        ]);
        
        const filteredUsers = users.filter(user => !usersfollowedbyme.following.includes(user._id));
        const suggestedUsers = filteredUsers.slice(0, 4);
        suggestedUsers.forEach(user => user.password = null);

        // Fetch at least 2 random users excluding the mutual ones already shown and already followed users
        const randomUsers = await User.aggregate([
            {
                $match: {
                    _id: { 
                        $ne: userid, 
                        $nin: [...suggestedUsers.map(user => user._id), ...usersfollowedbyme.following] // Exclude mutual users and already followed users
                    } 
                }
            },
            { $sample: { size: 2 } } // Get 2 random users
        ]);

        // Combine suggested users with random users
        const finalSuggestedUsers = [...suggestedUsers, ...randomUsers];
        res.status(200).json(finalSuggestedUsers);
    }catch(error){    
        return res.status(500).json({message:"Server error"});
    }
};

export const updateUser=async(req,res)=>{
    const {username,name,email,newPassword,currentPassword,bio,link}=req.body;
    let {profileIMG,coverIMG}=req.body;
    const userid=req.user._id;
    try{
        let user=await User.findById(userid);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        if((!newPassword && currentPassword) || (!currentPassword && newPassword)){
            return res.status(400).json({message:"Both current password and new password are required"});
        }
        if(currentPassword && newPassword){
            const isMatch=await bcrypt.compare(currentPassword,user.password);
            if(!isMatch){
                return res.status(400).json({message:"Current password entered is incorrect"});
            }
            if(newPassword.length<8){
                return res.status(400).json({message:"New password must be at least 8 characters long"});
            }
            const salt=await bcrypt.genSalt(10);
            user.password=await bcrypt.hash(newPassword,salt);
        }
        if(profileIMG === null) {
            if(user.profileIMG && !user.profileIMG.includes('pixabay')) {
                await cloudinary.uploader.destroy(user.profileIMG.split("/").pop().split(".")[0]);
            }
            profileIMG = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
        } else if(profileIMG && profileIMG !== user.profileIMG) {
            if(user.profileIMG && !user.profileIMG.includes('pixabay')) {
                await cloudinary.uploader.destroy(user.profileIMG.split("/").pop().split(".")[0]);
            }
            const uploadedProfileImage = await cloudinary.uploader.upload(profileIMG, {folder: "profile"});
            profileIMG = uploadedProfileImage.secure_url;
        }
        if(coverIMG === null) {
            if(user.coverIMG && !user.coverIMG.includes('pixabay')) {
                await cloudinary.uploader.destroy(user.coverIMG.split("/").pop().split(".")[0]);
            }
            coverIMG = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
        } else if(coverIMG && coverIMG !== user.coverIMG) {
            if(user.coverIMG && !user.coverIMG.includes('pixabay')) {
                await cloudinary.uploader.destroy(user.coverIMG.split("/").pop().split(".")[0]);
            }
            const uploadedCoverImage = await cloudinary.uploader.upload(coverIMG, {folder: "cover"});
            coverIMG = uploadedCoverImage.secure_url;
        }
        user.name = name||user.name;
        user.email = email||user.email;
        user.bio = bio||user.bio;
        user.link = link||user.link;
        user.profileIMG = profileIMG||user.profileIMG;
        user.coverIMG = coverIMG||user.coverIMG;
        user = await user.save();
        user.password=null;
        res.status(200).json({message:"User updated successfully"});
    }catch(error){
        console.error('Update error:', error);
        return res.status(500).json({message:"Server error"});
    }
};

export const deleteUser=async(req,res)=>{
    try{
        const userid=req.user._id;
        const user=await User.findById(userid);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }

        // Delete all posts by the user
        await Post.deleteMany({ user: userid });

        // Delete all notifications where user is sender or receiver
        await Notification.deleteMany({
            $or: [
                { from: userid },
                { to: userid }
            ]
        });

        // Remove user from followers' following lists
        await User.updateMany(
            { followers: userid },
            { $pull: { followers: userid } }
        );

        // Remove user from following users' followers lists
        await User.updateMany(
            { following: userid },
            { $pull: { following: userid } }
        );

        // Delete profile and cover images from Cloudinary if they exist
        if(user.profileIMG && !user.profileIMG.includes('pixabay')) {
            await cloudinary.uploader.destroy(user.profileIMG.split("/").pop().split(".")[0]);
        }
        if(user.coverIMG && !user.coverIMG.includes('pixabay')) {
            await cloudinary.uploader.destroy(user.coverIMG.split("/").pop().split(".")[0]);
        }

        // Finally delete the user
        await User.findByIdAndDelete(userid);
        
        res.status(200).json({message:"User and all associated data deleted successfully"});
    }catch(error){
        console.error('Delete user error:', error);
        return res.status(500).json({message:"Server error"});
    }
};
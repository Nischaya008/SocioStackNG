import Notification from "../../models/notification.js";

export const getNotifs=async(req,res)=>{
    try{
        const userid = req.user._id;
        const notifications = await Notification.find({to:userid}).sort({createdAt:-1})
        .populate({
            path:"from",
            select:"username profileIMG"
        });

        // Mark all notifications as read
        await Notification.updateMany(
            { to: userid, read: false },
            { $set: { read: true } }
        );

        if(notifications.length===0){
            return res.status(404).json({message:"No notifications found"});
        }
        return res.status(200).json(notifications);
    }catch(error){
        console.log(error);
        return res.status(500).json({message:"Server error"});
    }
};

export const delNotifs=async(req,res)=>{
    try{
        const userid = req.user._id;
        const notifications = await Notification.find({to:userid});
        if(notifications.length === 0) {
            return res.status(404).json({message:"No notifications to delete"});
        }
        await Notification.deleteMany({to:userid});
        return res.status(200).json({message:"Notifications deleted successfully"});
    }catch(error){
        console.log(error);
        return res.status(500).json({message:"Server error"});
    }
};

export const delNotif=async(req,res)=>{
    const notifid=req.params.id;
    const userid = req.user._id;
    try{
        const notification = await Notification.findById(notifid);
        if(!notification){
            return res.status(404).json({message:"Notification not found"});
        }
        if(notification.to.toString() !== userid.toString()){   
            return res.status(403).json({message:"You are not authorized to delete this notification"});
        }
        await Notification.findByIdAndDelete(notifid);
        return res.status(200).json({message:"Notification deleted successfully"});
    }catch(error){
        console.log(error);
        return res.status(500).json({message:"Server error"});
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const userid = req.user._id;
        const count = await Notification.countDocuments({ to: userid, read: false });
        return res.status(200).json({ count });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
};

import mongoose from "mongoose";
const PostSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:false
    },
    likes:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"User",
        default:[]
    },
    comments:[
        {
            text:{
                type:String,
                required:true
            },
            user:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
                required:true
            }
        }
    ]
},{timestamps:true});
const Post=mongoose.model("Post",PostSchema);
export default Post;
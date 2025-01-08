import express from "express";
import { sessioncheck } from "../../lib/sessioncheck.js";
import { createPost, deletePost, commentPost, like_unlike_post, editPost, getAllPosts, getAllLiked, getAllFollowed, getuserPosts } from "./post_controller.js";

const router=express.Router();

router.post("/create",sessioncheck,createPost);
router.post("/edit/:id",sessioncheck,editPost);
router.post("/like/:id",sessioncheck,like_unlike_post);
router.post("/comment/:id",sessioncheck,commentPost);
router.get("/all",getAllPosts);
router.get("/liked/:id",sessioncheck,getAllLiked);
router.get("/following",sessioncheck,getAllFollowed);
router.get("/user/:username",getuserPosts);
router.delete("/:id",sessioncheck,deletePost);

export default router;
import express from "express";
import {getUser,follow_unfollow,getSuggested,updateUser,deleteUser} from "./user_controller.js";
import { sessioncheck } from "../../lib/sessioncheck.js";

const router=express.Router();

router.get("/profile/:name",getUser);
router.get("/suggested",sessioncheck,getSuggested);
router.post("/follow/:id",sessioncheck,follow_unfollow);
router.post("/update",sessioncheck,updateUser);
router.delete("/delete",sessioncheck,deleteUser);

export default router;
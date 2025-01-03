import express from "express";
import {signup,login,logout,getMe} from "./auth_controller.js";
import {sessioncheck} from "../../lib/sessioncheck.js";

const router = express.Router();

router.get("/me", sessioncheck, getMe);
router.post("/signup",signup);
router.post("/login",login);
router.post("/logout",logout);

export default router;
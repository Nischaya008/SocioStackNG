import express from "express";
import {sessioncheck} from "../../lib/sessioncheck.js";
import { getNotifs, delNotifs, delNotif, getUnreadCount } from "./notif_controller.js";

const router=express.Router();

router.get("/",sessioncheck, getNotifs);
router.get("/unread",sessioncheck, getUnreadCount);
router.delete("/",sessioncheck, delNotifs);
router.delete("/:id",sessioncheck, delNotif);
export default router;

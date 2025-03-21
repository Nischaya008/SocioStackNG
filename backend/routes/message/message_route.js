import express from 'express';
import { getConversations, getMessages, deleteMessage, getPotentialChats, sendMessage, checkUnreadMessages } from './message_controller.js';
import { sessioncheck } from '../../lib/sessioncheck.js';

const router = express.Router();

router.use(sessioncheck);

router.get('/conversations', getConversations);
router.get('/chat/:userId', getMessages);
router.delete('/:messageId', deleteMessage);
router.get('/potential-chats', getPotentialChats);
router.post('/send', sendMessage);
router.get('/unread', checkUnreadMessages);

export default router;

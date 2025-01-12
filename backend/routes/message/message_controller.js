import Message from '../../models/message.js';
import User from '../../models/user.js';

export const getConversations = async (req, res) => {
    try {
        // Get all unique conversations
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: req.user._id },
                        { receiver: req.user._id }
                    ],
                    deleted: false
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', req.user._id] },
                            '$receiver',
                            '$sender'
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    _id: 1,
                    user: {
                        _id: 1,
                        username: 1,
                        name: 1,
                        profileIMG: 1
                    },
                    lastMessage: 1,
                    unreadCount: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$lastMessage.receiver', req.user._id] },
                                    { $eq: ['$lastMessage.read', false] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        ]);

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching conversations' });
    }
};

export const getMessages = async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user._id }
            ],
            deleted: false
        })
        .sort({ createdAt: 1 })
        .limit(50)
        .populate('sender', 'username profileIMG name')
        .populate('receiver', 'username profileIMG name');

        // Mark messages as read
        await Message.updateMany(
            {
                sender: req.params.userId,
                receiver: req.user._id,
                read: false
            },
            { read: true }
        );

        res.json(messages);
    } catch (error) {
        console.error('Error in getMessages:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const message = await Message.findOne({
            _id: req.params.messageId,
            sender: req.user._id
        });

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        message.deleted = true;
        await message.save();

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting message' });
    }
};

export const getPotentialChats = async (req, res) => {
    try {
        // Get all messages where the current user is either sender or receiver
        const messages = await Message.find({
            $or: [
                { sender: req.user._id },
                { receiver: req.user._id }
            ]
        });

        // Get unique user IDs from messages (excluding current user)
        const chatUserIds = [...new Set(messages.flatMap(msg => 
            [msg.sender.toString(), msg.receiver.toString()]
        ))].filter(id => id !== req.user._id.toString());

        // Get user details for these IDs
        const chatUsers = await User.find(
            { _id: { $in: chatUserIds } },
            'username profileIMG name'
        );
        
        res.json(chatUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching potential chat users' });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { content, receiverId } = req.body;
        
        if (!content?.trim() || !receiverId) {
            return res.status(400).json({ message: 'Invalid message data' });
        }

        const newMessage = new Message({
            sender: req.user._id,
            receiver: receiverId,
            content: content.trim()
        });
        
        await newMessage.save();
        
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'username profileIMG name')
            .populate('receiver', 'username profileIMG name');

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Error in sendMessage:', error);
        res.status(500).json({ message: 'Error sending message' });
    }
};

import Message from '../models/message.js';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

    // Join personal room
    socket.join(socket.userId);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
    });

    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        if (!data.content?.trim() || !data.receiverId) {
          throw new Error('Invalid message data');
        }

        // Validate receiver exists
        const receiver = await User.findById(data.receiverId);
        if (!receiver) {
          throw new Error('Receiver not found');
        }

        const newMessage = new Message({
          sender: socket.userId,
          receiver: data.receiverId,
          content: data.content.trim()
        });
        
        await newMessage.save();
        
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', 'username profileIMG name')
          .populate('receiver', 'username profileIMG name');
        
        // Emit to receiver
        io.to(data.receiverId).emit('receive_message', populatedMessage);
        
        // Emit back to sender
        socket.emit('message_sent', populatedMessage);

      } catch (error) {
        console.error('Error in send_message:', error);
        socket.emit('message_error', { 
          error: error.message || 'Failed to send message'
        });
      }
    });

    // Handle read receipts
    socket.on('mark_read', async (data) => {
      try {
        await Message.updateMany(
          {
            receiver: socket.userId,
            sender: data.senderId,
            read: false
          },
          { read: true }
        );
        
        io.to(data.senderId).emit('messages_read', { 
          reader: socket.userId 
        });
      } catch (error) {
        socket.emit('read_error', { error: 'Failed to mark messages as read' });
      }
    });
  });
};

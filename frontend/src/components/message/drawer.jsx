import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer,
  Box,
  IconButton,
  Typography,
  Avatar,
  Badge,
  Fab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Paper,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Collapse,
} from '@mui/material';
import {
  Message as MessageIcon,
  Send as SendIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/auth_context';
import { useTheme } from '../../contexts/theme_context';
import io from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const MessageDrawer = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [messages, setMessages] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [followedUsers, setFollowedUsers] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Connect to socket when component mounts
  useEffect(() => {
    if (user) {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
        ?.split('=')[1];

      if (!token) {
        console.error('No JWT token found');
        return;
      }

      const newSocket = io('http://localhost:5000', {
        withCredentials: true,
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setSocket(newSocket);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        toast.error('Chat connection lost. Reconnecting...');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        toast.error('Chat connection failed');
      });

      // Improved message handling
      const handleNewMessage = (message) => {
        setMessages(prev => {
          const chatId = message.sender._id === user._id ? 
            message.receiver._id : message.sender._id;
          
          const currentMessages = prev[chatId] || [];
          
          // Check if message already exists
          if (!currentMessages.some(m => m._id === message._id)) {
            return {
              ...prev,
              [chatId]: [...currentMessages, message]
            };
          }
          return prev;
        });
      };

      // Use the same handler for both receive_message and message_sent
      newSocket.on('receive_message', handleNewMessage);
      newSocket.on('message_sent', handleNewMessage);

      newSocket.on('message_error', (error) => {
        console.error('Message error:', error);
        toast.error(error.error || 'Failed to send message');
      });

      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [user]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [followingRes, chatsRes] = await Promise.all([
          axios.get('/api/user/following'),
          axios.get('/api/message/potential-chats')
        ]);

        // Filter followed users who don't have any chat history
        const chatUserIds = new Set(chatsRes.data.map(user => user._id));
        const followedUsersWithoutChats = followingRes.data.filter(
          user => !chatUserIds.has(user._id)
        );

        setFollowedUsers(followedUsersWithoutChats);
        setRecentChats(chatsRes.data);
      } catch (error) {
        console.error('Fetch data error:', error);
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    if (open && user) {
      fetchData();
    }
  }, [open, user]);

  // Fetch messages when active chat changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (activeChat) {
        try {
          const response = await axios.get(`/api/message/chat/${activeChat._id}`);
          setMessages(prev => ({
            ...prev,
            [activeChat._id]: response.data
          }));
          
          socket?.emit('mark_read', { senderId: activeChat._id });
        } catch (error) {
          toast.error('Failed to load conversation');
        }
      }
    };

    if (activeChat) {
      fetchMessages();
    }
  }, [activeChat, socket]);

  // Add periodic refresh
  useEffect(() => {
    if (activeChat && open) {
      // Initial fetch
      const refreshMessages = async () => {
        try {
          const response = await axios.get(`/api/message/chat/${activeChat._id}`);
          setMessages(prev => ({
            ...prev,
            [activeChat._id]: response.data
          }));
        } catch (error) {
          console.error('Error refreshing messages:', error);
        }
      };
      
      // Set up interval to refresh every 1 second
      const interval = setInterval(refreshMessages, 1000);
      
      return () => clearInterval(interval);
    }
  }, [activeChat, open]);

  // Auto scroll to bottom
  useEffect(() => {
    if (activeChat && messages[activeChat._id]) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChat]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeChat) {
      toast.error('Please enter a message and select a chat');
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    try {
      const response = await axios.post('/api/message/send', {
        content: messageContent,
        receiverId: activeChat._id
      });

      // Optimistically update UI
      const newMessageObj = response.data;
      setMessages(prev => ({
        ...prev,
        [activeChat._id]: [...(prev[activeChat._id] || []), newMessageObj]
      }));

      // Emit via socket if connected
      if (socket?.connected) {
        socket.emit('send_message', {
          content: messageContent,
          receiverId: activeChat._id,
          messageId: newMessageObj._id
        });
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message. Please try again.');
      setNewMessage(messageContent); // Revert input on error
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="messages"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: { xs: 145, sm: 24, md: 160 },
          right: { xs: 16, sm: 24, md: 32 },
          bgcolor: 'var(--accent-color)',
          '&:hover': {
            bgcolor: 'var(--secondary-color)',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.2s ease',
          zIndex: 1000,
        }}
      >
        <Badge 
          badgeContent={4} 
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              bgcolor: '#ef4444',
            }
          }}
        >
          <MessageIcon />
        </Badge>
      </Fab>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 450 },
            height: { xs: '85vh', sm: '600px' },
            bottom: { xs: 0, sm: 200 },
            top: { xs: 'auto', sm: '1px' },
            right: { xs: 0, sm: 32 },
            borderRadius: { xs: '16px 16px 0 0', sm: '16px' },
            bgcolor: 'var(--background-paper)',
            position: 'fixed',
            maxHeight: { xs: '85vh', sm: '95vh' },
            margin: { xs: 0, sm: -2},
            marginTop: { xs: 0, sm: 10},
          }
        }}
        ModalProps={{
            keepMounted: true,
            disableScrollLock: true, // This prevents the main page from being locked
            BackdropProps: {
              sx: {
                backgroundColor: 'transparent' // This removes the backdrop blur
              }
            }
          }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%'
        }}>
          {/* Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: '1px solid',
            borderColor: 'var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              color: 'var(--text-color)'
            }}>
              Messages
            </Typography>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon sx={{ color: 'var(--text-color)' }} />
            </IconButton>
          </Box>

          {/* Toggle Buttons */}
          <Box sx={{ p: 2 }}>
            <ToggleButtonGroup
              value={activeTab}
              exclusive
              onChange={(e, newValue) => {
                if (newValue) setActiveTab(newValue);
                setActiveChat(null);
              }}
              sx={{
                width: '100%',
                '& .MuiToggleButton-root': {
                  flex: 1,
                  color: 'var(--text-color)',
                  '&.Mui-selected': {
                    bgcolor: 'var(--accent-color)',
                    color: '#ffffff',
                    '&:hover': {
                      bgcolor: 'var(--secondary-color)',
                    },
                  },
                },
              }}
            >
              <ToggleButton value="chats" sx={{ textTransform: 'none' }}>
                <ChatIcon sx={{ mr: 1 }} /> Chats
              </ToggleButton>
              <ToggleButton value="new" sx={{ textTransform: 'none' }}>
                <PersonAddIcon sx={{ mr: 1 }} /> New Message
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Content */}
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
              <CircularProgress />
            </Box>
          ) : activeChat ? (
            // Chat View
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden'
            }}>
              {/* Chat Header */}
              <Box sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <IconButton 
                  onClick={() => setActiveChat(null)}
                  sx={{ color: 'var(--text-color)' }}
                >
                  <CloseIcon />
                </IconButton>
                <Avatar 
                  component={Link}
                  to={`/profile/${activeChat.username}`}
                  src={activeChat.profileIMG} 
                  alt={activeChat.username}
                  sx={{ 
                    width: 40, 
                    height: 40,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  {activeChat.username[0].toUpperCase()}
                </Avatar>
                <Typography 
                  component={Link}
                  to={`/profile/${activeChat.username}`}
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'var(--text-color)',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    '&:hover': {
                      color: 'var(--accent-color)',
                      textDecoration: 'underline',
                    },
                    transition: 'color 0.2s ease',
                  }}
                >
                  {activeChat.username}
                </Typography>
              </Box>

              {/* Messages */}
              <Box sx={{ 
                flex: 1, 
                overflow: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'var(--primary-color)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'var(--accent-color)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: 'var(--secondary-color)',
                  },
                },
              }}>
                {messages[activeChat._id]?.map((message, index) => (
                  <Box
                    key={message._id}
                    sx={{
                      alignSelf: message.sender._id === user._id ? 'flex-end' : 'flex-start',
                      maxWidth: '80%'
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: message.sender._id === user._id 
                          ? 'var(--accent-color)' 
                          : 'var(--primary-color)',
                        borderRadius: 2,
                      }}
                    >
                      <Typography sx={{ 
                        color: message.sender._id === user._id ? '#ffffff' : 'var(--text-color)'
                      }}>
                        {message.content}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: message.sender._id === user._id 
                          ? 'rgba(255,255,255,0.7)' 
                          : 'var(--muted-text-color)',
                        display: 'block',
                        mt: 0.5
                      }}>
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>

              {/* Message Input */}
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'var(--border-color)' }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  InputProps={{
                    endAdornment: (
                      <IconButton 
                        onClick={handleSend}
                        disabled={!newMessage.trim()}
                        sx={{ color: 'var(--accent-color)' }}
                      >
                        <SendIcon />
                      </IconButton>
                    ),
                    sx: {
                      bgcolor: 'var(--primary-color)',
                      '& fieldset': { border: 'none' },
                      '& input': { 
                        color: 'var(--text-color)',
                        '&::placeholder': {
                          color: 'var(--muted-text-color)',
                          opacity: 1
                        }
                      }
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: 'transparent'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'transparent'
                      }
                    }
                  }}
                />
              </Box>
            </Box>
          ) : (
            // List View
            <List sx={{ 
              overflow: 'auto',
              flex: 1,
              px: 2,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'var(--primary-color)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'var(--accent-color)',
                borderRadius: '4px',
                '&:hover': {
                  background: 'var(--secondary-color)',
                },
              },
            }}>
              {(activeTab === 'chats' ? recentChats : followedUsers).length === 0 ? (
                <Box 
                  display="flex" 
                  flexDirection="column" 
                  alignItems="center" 
                  justifyContent="center" 
                  minHeight="200px"
                  gap={2}
                >
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'var(--muted-text-color)',
                      textAlign: 'center',
                      px: 2
                    }}
                  >
                    {activeTab === 'chats' 
                      ? "Start chatting with someone" 
                      : "Follow someone to start chatting"}
                  </Typography>
                </Box>
              ) : (
                (activeTab === 'chats' ? recentChats : followedUsers).map((user) => (
                  <ListItem
                    key={user._id}
                    button
                    onClick={() => setActiveChat(user)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      '&:hover': {
                        bgcolor: 'var(--primary-color)',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={user.profileIMG} alt={user.username}>
                        {user.username[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.username}
                      secondary={user.name}
                      primaryTypographyProps={{
                        sx: { color: 'var(--text-color)' }
                      }}
                      secondaryTypographyProps={{
                        sx: { color: 'var(--muted-text-color)' }
                      }}
                    />
                  </ListItem>
                ))
              )}
            </List>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default MessageDrawer;
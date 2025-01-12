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
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/auth_context';
import { useTheme } from '../../contexts/theme_context';
import io from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { alpha } from '@mui/material/styles';

// Add these constants after the imports
const SENT_SOUND_URL = 'https://cdn.pixabay.com/download/audio/2024/11/27/audio_c91ef5ee90.mp3?filename=notification-2-269292.mp3';
const RECEIVED_SOUND_URL = 'https://cdn.pixabay.com/download/audio/2024/08/02/audio_3a4d7c617d.mp3?filename=notification-beep-229154.mp3';


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
  const [hasUnread, setHasUnread] = useState(false);
  const [isManuallyScrolled, setIsManuallyScrolled] = useState(false);
  const sentAudioRef = useRef(new Audio(SENT_SOUND_URL));
  const receivedAudioRef = useRef(new Audio(RECEIVED_SOUND_URL));

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
            // Play received sound if the chat is active and message is from other user
            if (activeChat?._id === message.sender._id && message.sender._id !== user._id) {
              receivedAudioRef.current?.play().catch(() => {});
            }

            return {
              ...prev,
              [chatId]: [...currentMessages, message]
            };
          }
          return prev;
        });

        // Update recent chats order
        setRecentChats(prev => {
          const chatId = message.sender._id === user._id ? 
            message.receiver._id : message.sender._id;
          
          // Find the chat user
          const chatUser = prev.find(u => u._id === chatId);
          if (!chatUser) return prev;

          // Remove the user from the current position
          const otherUsers = prev.filter(u => u._id !== chatId);
          
          // Add the user back at the beginning with updated unread status
          return [
            {
              ...chatUser,
              hasUnread: message.sender._id !== user._id,
              lastMessageAt: new Date().toISOString()
            },
            ...otherUsers
          ];
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
  }, [user, activeChat]);

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
    if (activeChat && messages[activeChat._id] && !isManuallyScrolled) {
      // Use setTimeout to ensure the DOM is updated before scrolling
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'  // This ensures scrolling to the very bottom
        });
      }, 0);
    }
  }, [messages[activeChat?._id], activeChat, isManuallyScrolled]);

  // Add this effect to reset manual scroll when changing chats
  useEffect(() => {
    setIsManuallyScrolled(false);
  }, [activeChat]);

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

      // Play sent sound
      if (activeChat && sentAudioRef.current) {
        sentAudioRef.current.play().catch(() => {});
      }

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

  useEffect(() => {
    const checkUnreadMessages = async () => {
      if (user) {  // Remove the !open condition to check always
        try {
          const response = await axios.get('/api/message/unread');
          setHasUnread(response.data.hasUnread);
        } catch (error) {
          console.error('Error checking unread messages:', error);
        }
      }
    };

    // Initial check
    checkUnreadMessages();

    // Set up interval to check every 5 seconds
    const interval = setInterval(checkUnreadMessages, 5000);

    // Handle new messages
    if (socket) {
      socket.on('receive_message', (message) => {
        if (activeChat?._id !== message.sender._id) {
          setHasUnread(true);
        }
      });
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('receive_message');
      }
    };
  }, [user, socket, activeChat]);

  // Add a separate useEffect for handling read status when opening a chat
  useEffect(() => {
    if (activeChat) {
      // Update recent chats to mark this chat as read
      setRecentChats(prev => 
        prev.map(chat => 
          chat._id === activeChat._id 
            ? { ...chat, hasUnread: false }
            : chat
        )
      );

      // Emit socket event to mark messages as read
      socket?.emit('mark_read', { senderId: activeChat._id });

      // Check if there are any other unread chats
      const hasOtherUnread = recentChats.some(
        chat => chat._id !== activeChat._id && chat.hasUnread
      );
      setHasUnread(hasOtherUnread);
    }
  }, [activeChat, socket]);

  useEffect(() => {
    if (socket) {
      socket.on('messages_read', () => {
        setHasUnread(false);
      });

      return () => {
        socket.off('messages_read');
      };
    }
  }, [socket]);

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await axios.delete(`/api/message/${messageId}`);
      setMessages(prev => ({
        ...prev,
        [activeChat._id]: prev[activeChat._id].filter(msg => msg._id !== messageId)
      }));
      toast.success('Message deleted');
    } catch (error) {
      console.error('Delete message error:', error);
      toast.error('Failed to delete message');
    }
  };

  useEffect(() => {
    // Initialize audio elements
    sentAudioRef.current = new Audio(SENT_SOUND_URL);
    receivedAudioRef.current = new Audio(RECEIVED_SOUND_URL);
    
    // Set volume
    sentAudioRef.current.volume = 0.5;
    receivedAudioRef.current.volume = 0.5;
    
    // Preload audio
    sentAudioRef.current.load();
    receivedAudioRef.current.load();
    
    return () => {
      sentAudioRef.current = null;
      receivedAudioRef.current = null;
    };
  }, []);

  return (
    <>
      <Fab
        color="primary"
        aria-label="messages"
        onClick={() => {
          setOpen(true);
          setHasUnread(false);
        }}
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
          variant="dot"
          color="error"
          invisible={!hasUnread}
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: '#ef4444',
              boxShadow: '0 0 0 2px var(--background-paper)',
              '&::after': {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                animation: 'ripple 1.2s infinite ease-in-out',
                border: '1px solid currentColor',
                content: '""',
              },
            },
            '@keyframes ripple': {
              '0%': {
                transform: 'scale(.8)',
                opacity: 1,
              },
              '100%': {
                transform: 'scale(2.4)',
                opacity: 0,
              },
            },
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
            overflowY: { xs: 'hidden', sm: 'auto' },
          }
        }}
        ModalProps={{
            keepMounted: { xs: false, sm: true },
            disableScrollLock: { xs: false, sm: true },
            BackdropProps: {
              sx: {
                backgroundColor: 'transparent'
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
                p: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                WebkitOverflowScrolling: { xs: 'touch', sm: 'auto' },
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
              }}
              onScroll={(e) => {
                const element = e.target;
                const isScrolledToBottom = 
                  Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 50;
                setIsManuallyScrolled(!isScrolledToBottom);
              }}>
                {messages[activeChat._id]?.map((message, index) => (
                  <Box
                    key={message._id}
                    sx={{
                      alignSelf: message.sender._id === user._id ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      position: 'relative',
                      '&:hover .delete-icon': {
                        opacity: 1,
                      }
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        py: 1.25,
                        px: 1.75,
                        bgcolor: message.sender._id === user._id 
                          ? 'var(--accent-color)' 
                          : 'var(--primary-color)',
                        borderRadius: 1.5,
                        position: 'relative',
                      }}
                    >
                      {message.sender._id === user._id && (
                        <IconButton
                          size="small"
                          className="delete-icon"
                          onClick={() => handleDeleteMessage(message._id)}
                          sx={{
                            position: 'absolute',
                            top: -10,
                            right: -10,
                            opacity: 0,
                            transition: 'opacity 0.2s ease',
                            bgcolor: 'var(--background-paper)',
                            '&:hover': {
                              bgcolor: 'var(--primary-color)',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
                        </IconButton>
                      )}
                      <Typography sx={{ 
                        color: message.sender._id === user._id ? '#ffffff' : 'var(--text-color)',
                        fontSize: '0.95rem',
                        lineHeight: 1.4,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {message.content}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: message.sender._id === user._id 
                          ? 'rgba(255,255,255,0.7)' 
                          : 'var(--muted-text-color)',
                        display: 'block',
                        mt: 0.25,
                        fontSize: '0.75rem',
                      }}>
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
                <div ref={messagesEndRef} style={{ padding: '1px' }} />
              </Box>

              {/* Message Input */}
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'var(--border-color)' }}>
                <TextField
                  fullWidth
                  multiline
                  variant="outlined"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
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
                      '& textarea': { 
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
                      bgcolor: user.hasUnread ? alpha('#F97316', 0.1) : 'transparent',
                      '&:hover': {
                        bgcolor: user.hasUnread 
                          ? alpha('#F97316', 0.15)
                          : 'var(--primary-color)',
                      },
                      position: 'relative',
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
                        sx: { 
                          color: 'var(--text-color)',
                          fontWeight: user.hasUnread ? 600 : 400,
                        }
                      }}
                      secondaryTypographyProps={{
                        sx: { color: 'var(--muted-text-color)' }
                      }}
                    />
                    {user.hasUnread && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          backgroundColor: '#ef4444',
                          borderRadius: '50%',
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          animation: 'pulse 1.5s infinite',
                          '@keyframes pulse': {
                            '0%': {
                              transform: 'translateY(-50%) scale(0.95)',
                              boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)',
                            },
                            '70%': {
                              transform: 'translateY(-50%) scale(1)',
                              boxShadow: '0 0 0 6px rgba(239, 68, 68, 0)',
                            },
                            '100%': {
                              transform: 'translateY(-50%) scale(0.95)',
                              boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)',
                            },
                          },
                        }}
                      />
                    )}
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

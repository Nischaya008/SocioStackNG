import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Avatar,
  Button,
  Divider,
  CircularProgress,
  Fade,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Favorite as LikeIcon,
  PersonAdd as FollowIcon,
  Article as PostIcon,
  DeleteSweep as DeleteAllIcon
} from '@mui/icons-material';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { alpha } from '@mui/material/styles';

const NotificationDialog = ({ open, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notif/');
      setNotifications(response.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch notifications');
      }
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      try {
        await axios.delete('/api/notif/');
        setNotifications([]);
        toast.success('All notifications cleared! 🧹');
      } catch (error) {
        toast.error('Failed to clear notifications');
      }
    }
  };

  const handleDeleteOne = async (id) => {
    try {
      await axios.delete(`/api/notif/${id}`);
      setNotifications(prev => prev.filter(notif => notif._id !== id));
      toast.success('Notification removed! 🗑️');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <LikeIcon sx={{ color: '#F97316' }} />;
      case 'follow':
        return <FollowIcon sx={{ color: '#2D6A4F' }} />;
      case 'post':
        return <PostIcon sx={{ color: '#2D6A4F' }} />;
      default:
        return null;
    }
  };

  const getNotificationMessage = (notification) => {
    switch (notification.type) {
      case 'like':
        return 'liked your post ❤️';
      case 'follow':
        return 'started following you 👋';
      case 'post':
        return 'mentioned you in a post 📝';
      default:
        return 'interacted with you';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'var(--primary-color)',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Notifications 🔔
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {notifications.length > 0 && (
            <Button
              startIcon={<DeleteAllIcon />}
              onClick={handleDeleteAll}
              sx={{ 
                color: '#F97316',
                textTransform: 'none',
                '&:hover': {
                  color: '#2D6A4F'
                }
              }}
            >
              Clear All
            </Button>
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography color="text.secondary">
              No notifications yet! 📭
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            {notifications.map((notification) => (
              <Fade in key={notification._id}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    mb: 1,
                    borderRadius: 2,
                    bgcolor: notification.read ? 'transparent' : alpha('#F97316', 0.1),
                    position: 'relative',
                    '&:hover': {
                      bgcolor: alpha('#2D6A4F', 0.1),
                    },
                  }}
                >
                  <Avatar
                    src={notification.from.profileIMG}
                    alt={notification.from.username}
                    sx={{ width: 40, height: 40 }}
                  >
                    {notification.from.username[0].toUpperCase()}
                  </Avatar>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {notification.from.username}{' '}
                      <Typography component="span" color="text.secondary">
                        {getNotificationMessage(notification)}
                      </Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getNotificationIcon(notification.type)}
                    <IconButton 
                      size="small"
                      onClick={() => handleDeleteOne(notification._id)}
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': { color: 'error.main' }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Fade>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NotificationDialog;

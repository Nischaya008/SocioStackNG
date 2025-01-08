import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/auth_context';
import toast from 'react-hot-toast';
import Loading from '../../contexts/loading.jsx';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  Divider,
  CircularProgress,
  Slide,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { debounce } from 'lodash';

const SuggestedCard = () => {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const { user } = useAuth();

  const debouncedToast = debounce((message) => {
    toast.success(message);
  }, 100);

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        const response = await axios.get('/api/user/suggested');
        setSuggestedUsers(response.data);
      } catch (error) {
        console.error('Error fetching suggested users:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSuggestedUsers();
    }
  }, [user]);

  const handleFollowToggle = async (userId, username) => {
    try {
      await axios.post(`/api/user/follow/${userId}`);
      
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        const isCurrentlyFollowing = newSet.has(userId);
        
        if (isCurrentlyFollowing) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);
        }
        
        debouncedToast(isCurrentlyFollowing ? `Unfollowed ${username}` : `Following ${username}`);
        
        return newSet;
      });
    } catch (error) {
      toast.error('Error updating follow status');
    }
  };

  if (!user) return null;

  return (
    <Slide direction="left" in={true} mountOnEnter unmountOnExit>
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          right: { xs: 16, md: 32 },
          top: 80,
          width: { xs: '300px', md: '320px' },
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'var(--primary-color)',
          display: { xs: 'none', md: 'block' },
        }}
      >
        <Box sx={{ p: 2, bgcolor: 'var(--secondary-color)', color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Suggested For You
          </Typography>
        </Box>

        <Divider />

        {loading ? (
          <Loading />
        ) : !Array.isArray(suggestedUsers) || suggestedUsers.length === 0 ? (
          <Box p={3}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No suggestions available
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
            {suggestedUsers.map((suggestedUser) => (
              <Box
                key={suggestedUser._id}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  transition: 'background-color 0.2s ease',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Avatar
                  src={suggestedUser.profileIMG}
                  alt={suggestedUser.username}
                  component={Link}
                  to={`/profile/${suggestedUser.username}`}
                  sx={{
                    width: 40,
                    height: 40,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                />
                
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography
                    component={Link}
                    to={`/profile/${suggestedUser.username}`}
                    variant="subtitle2"
                    sx={{
                      textDecoration: 'none',
                      color: 'text.primary',
                      fontWeight: 600,
                      display: 'block',
                      '&:hover': {
                        color: 'var(--accent-color)',
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {suggestedUser.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ 
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    @{suggestedUser.username}
                  </Typography>
                </Box>

                <Button
                  variant={followingUsers.has(suggestedUser._id) ? "outlined" : "contained"}
                  size="small"
                  onClick={() => handleFollowToggle(suggestedUser._id, suggestedUser.username)}
                  startIcon={followingUsers.has(suggestedUser._id) ? null : <PersonAdd />}
                  sx={{
                    minWidth: 90,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: followingUsers.has(suggestedUser._id) ? 'transparent' : 'var(--accent-color)',
                    borderColor: followingUsers.has(suggestedUser._id) ? 'var(--accent-color)' : 'transparent',
                    color: followingUsers.has(suggestedUser._id) ? 'var(--accent-color)' : 'white',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      bgcolor: 'var(--secondary-color)',
                      borderColor: 'var(--secondary-color)',
                      color: 'white',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  {followingUsers.has(suggestedUser._id) ? 'Unfollow' : 'Follow'}
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Slide>
  );
};

export default SuggestedCard;


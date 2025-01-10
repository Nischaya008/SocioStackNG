import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Favorite, Comment, Edit, Delete, PersonAdd } from '@mui/icons-material';
import { useAuth } from '../../contexts/auth_context';
import toast from 'react-hot-toast';
import Loading from '../../contexts/loading.jsx';
import {
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Typography,
  Box,
  TextField,
  Button,
  Container,
  CircularProgress,
  Collapse,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { Public, Group } from '@mui/icons-material';
import { debounce } from 'lodash';
import SuggestedCard from './suggested_card.jsx';
import AboutCard from './about_card.jsx';

const MainCards = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [viewMode, setViewMode] = useState('all'); // 'all', 'liked', or 'followed'
  const navigate = useNavigate();
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [followingUsers, setFollowingUsers] = useState(new Set());

  const debouncedToast = debounce((message) => {
    toast.success(message);
  }, 100);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let response;
      if (!user) {
        response = await axios.get('/api/post/all', {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        switch (viewMode) {
          case 'liked':
            response = await axios.get(`/api/post/liked/${user._id}`);
            break;
          case 'followed':
            response = await axios.get(`/api/post/following`);
            break;
          default:
            response = await axios.get(`/api/post/all`);
        }
      }
      setPosts(response.data);

      if (user) {
        const userLikedPosts = new Set(
          response.data
            .filter(post => post.likes?.includes(user._id))
            .map(post => post._id)
        );
        setLikedPosts(userLikedPosts);
      } else {
        setLikedPosts(new Set());
      }

      if (user) {
        const userFollowing = new Set(
          response.data
            .map(post => post.user)
            .filter(postUser => postUser?.followers?.includes(user._id))
            .map(postUser => postUser?._id)
        );
        setFollowingUsers(userFollowing);
      } else {
        setFollowingUsers(new Set());
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setPosts([]);
      } else {
        toast.error(error.response?.data?.message || 'Error fetching posts');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    
    fetchPosts();

    // Add event listener for post updates
    const handlePostUpdate = () => {
      fetchPosts();
    };
    window.addEventListener('postUpdated', handlePostUpdate);

    return () => {
      controller.abort();
      window.removeEventListener('postUpdated', handlePostUpdate);
    };
  }, [viewMode, user]);

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  const handleLike = async (postId) => {
    if (!user) {
      toast.error('Please log in to like posts');
      return;
    }
    try {
      const response = await axios.post(`/api/post/like/${postId}`);
      
      // Update the posts state without reloading
      setPosts(currentPosts => 
        currentPosts.map(post => {
          if (post._id === postId) {
            // If the post was liked, add the current user's ID to likes array
            // If it was unliked, remove the current user's ID from likes array
            const isLiked = likedPosts.has(postId);
            const updatedLikes = isLiked
              ? post.likes.filter(id => id !== user._id)
              : [...post.likes, user._id];
            
            // Toggle the liked status in our local state
            setLikedPosts(prev => {
              const newSet = new Set(prev);
              isLiked ? newSet.delete(postId) : newSet.add(postId);
              return newSet;
            });

            return {
              ...post,
              likes: updatedLikes
            };
          }
          return post;
        })
      );

      // Optional: Show success toast
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating like');
    }
  };

  const handleComment = async (postId) => {
    if (!user) {
      toast.error('Please log in to comment');
      return;
    }
    try {
      await axios.post(`/api/post/comment/${postId}`, { text: commentText });
      setCommentText('');
      fetchPosts();
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding comment');
    }
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await axios.delete(`/api/post/${postId}`);
        // Dispatch custom event
        window.dispatchEvent(new Event('postUpdated'));
        toast.success('Post deleted successfully');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error deleting post');
      }
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleFollowToggle = async (userId, username) => {
    if (!user) {
      toast.error('Please log in to follow users');
      return;
    }

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

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            position: 'fixed',
            top: 100,
            right: { xs: 'auto', lg: 24 },
            display: { xs: 'none', lg: 'block' },
            width: 300,
            zIndex: 1,
          }}
        >
          <SuggestedCard />
        </Box>

        <AboutCard />

        <Box
          sx={{
            width: { xs: '100%', lg: 'calc(100% - 324px)' }, // Adjust main content width on large screens
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              mb: 4,
              position: 'sticky',
              top: 72,
              zIndex: 1200,
              bgcolor: 'background.default',
              py: 1,
            }}
          >
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewChange}
              aria-label="post view mode"
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                '& .MuiToggleButton-root': {
                  border: 'none',
                  mx: 0.5,
                  px: { xs: 2, sm: 3 },
                  py: 1,
                  '&.Mui-selected': {
                    bgcolor: 'var(--accent-color)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'var(--secondary-color)',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(249, 115, 22, 0.04)', // Light version of accent color
                  },
                  transition: 'all 0.2s ease-in-out',
                },
              }}
            >
              <ToggleButton value="all" aria-label="all posts">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Public />
                  <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>All Posts</Typography>
                </Box>
              </ToggleButton>
              {user && (
                <>
                  <ToggleButton value="liked" aria-label="liked posts">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Favorite />
                      <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>Liked</Typography>
                    </Box>
                  </ToggleButton>
                  <ToggleButton value="followed" aria-label="followed posts">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Group />
                      <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>Following</Typography>
                    </Box>
                  </ToggleButton>
                </>
              )}
            </ToggleButtonGroup>
          </Box>

          {loading ? (
            <Loading />
          ) : posts.length === 0 ? (
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center" 
              minHeight="50vh"
              gap={2}
            >
              <Typography variant="h6" color="text.secondary">
                {viewMode === 'liked' ? 'No liked posts yet' :
                 viewMode === 'followed' ? 'No posts from followed users' :
                 'No posts available'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {posts.map((post) => (
                <Card 
                  key={post._id} 
                  sx={{ 
                    borderRadius: 2,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    },
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar
                        src={post.user?.profileIMG}
                        alt={post.user?.username || 'User'}
                        sx={{ 
                          width: 45,
                          height: 45,
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.1)',
                          },
                        }}
                        onClick={() => navigate(`/profile/${post.user?.username}`)}
                      />
                    }
                    action={
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {user?._id === post.user?._id && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              component={Link} 
                              to={`/edit-post/${post._id}`}
                              sx={{ 
                                '&:hover': { 
                                  color: 'primary.main',
                                  transform: 'scale(1.1)',
                                },
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton 
                              onClick={() => handleDelete(post._id)} 
                              sx={{ 
                                '&:hover': { 
                                  color: 'error.main',
                                  transform: 'scale(1.1)',
                                },
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    }
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                        <Typography
                          variant="subtitle1"
                          component={Link}
                          to={`/profile/${post.user?.username}`}
                          sx={{ 
                            color: 'text.primary', 
                            textDecoration: 'none',
                            fontWeight: 600,
                            '&:hover': { 
                              color: 'primary.main',
                              textDecoration: 'underline',
                            },
                            transition: 'color 0.2s ease',
                            display: 'inline-block',
                          }}
                        >
                          {post.user?.username || 'Unknown User'}
                        </Typography>
                        {user && user._id !== post.user?._id && (
                          <Button
                            variant={followingUsers.has(post.user?._id) ? "outlined" : "contained"}
                            color="primary"
                            onClick={() => handleFollowToggle(post.user?._id, post.user?.username)}
                            startIcon={followingUsers.has(post.user?._id) ? null : <PersonAdd />}
                            size="small"
                            sx={{
                              borderRadius: 2,
                              px: 2,
                              py: 0.5,
                              textTransform: 'none',
                              fontWeight: 600,
                              bgcolor: followingUsers.has(post.user?._id) ? 'transparent' : 'var(--accent-color)',
                              borderColor: followingUsers.has(post.user?._id) ? 'var(--accent-color)' : 'transparent',
                              color: followingUsers.has(post.user?._id) ? 'var(--accent-color)' : 'white',
                              '&:hover': { 
                                transform: 'scale(1.02)',
                                bgcolor: 'var(--secondary-color)',
                                borderColor: 'var(--secondary-color)',
                                color: 'white',
                              },
                              transition: 'all 0.2s ease-in-out',
                            }}
                          >
                            {followingUsers.has(post.user?._id) ? 'Unfollow' : 'Follow'}
                          </Button>
                        )}
                      </Box>
                    }
                    subheader={
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          fontStyle: 'italic',
                          mt: 0.5,
                          display: 'block'
                        }}
                      >
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </Typography>
                    }
                  />

                  <CardContent sx={{ pb: 1 }}>
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        color: 'text.primary',
                        mb: 2,
                      }}
                    >
                      {post.title}
                    </Typography>
                  </CardContent>

                  {post.image && (
                    <Box 
                      sx={{ 
                        position: 'relative',
                        width: '100%',
                        pt: '40%',
                        maxHeight: '400px',
                        overflow: 'hidden',
                        backgroundColor: 'grey.50',
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={post.image}
                        alt={post.title}
                        sx={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          backgroundColor: 'transparent',
                          transition: 'transform 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.02)',
                          },
                          maxHeight: '400px',
                          margin: 'auto',
                        }}
                      />
                    </Box>
                  )}

                  <CardContent>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ 
                        lineHeight: 1.6,
                        letterSpacing: '0.015em',
                        fontWeight: 500,
                      }}
                    >
                      {post.description}
                    </Typography>
                  </CardContent>

                  <Divider sx={{ mx: 2 }} />

                  <CardActions 
                    disableSpacing
                    sx={{ 
                      px: 2,
                      py: 1,
                    }}
                  >
                    <IconButton 
                      onClick={() => handleLike(post._id)}
                      sx={{
                        color: likedPosts.has(post._id) ? 'var(--accent-color)' : 'text.secondary',
                        '&:hover': {
                          color: likedPosts.has(post._id) ? 'var(--secondary-color)' : 'var(--accent-color)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Favorite />
                    </IconButton>
                    <Typography variant="body2" color="text.secondary">
                      {post.likes.length}
                    </Typography>

                    <IconButton 
                      onClick={() => toggleComments(post._id)}
                      sx={{ 
                        transition: 'transform 0.2s ease',
                        '&:hover': { transform: 'scale(1.1)' },
                        color: expandedComments.has(post._id) ? 'var(--accent-color)' : 'text.secondary',
                        '&:hover': {
                          color: expandedComments.has(post._id) ? 'var(--secondary-color)' : 'var(--accent-color)',
                        },
                      }}
                    >
                      <Comment color="inherit" />
                    </IconButton>
                    <Typography variant="body2">
                      {post.comments.length}
                    </Typography>
                  </CardActions>

                  <Collapse in={expandedComments.has(post._id)} timeout="auto" unmountOnExit>
                    <Box 
                      sx={{ 
                        p: 2,
                        bgcolor: 'grey.50',
                        borderTop: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      {user ? (
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add a comment..."
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: 'background.paper',
                              },
                            }}
                          />
                          <Button 
                            variant="contained"
                            onClick={() => handleComment(post._id)}
                            disabled={!commentText.trim()}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              px: 3,
                              transition: 'transform 0.2s ease',
                              '&:not(:disabled):hover': {
                                transform: 'scale(1.02)',
                              },
                            }}
                          >
                            Post
                          </Button>
                        </Box>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ textAlign: 'center', py: 2 }}
                        >
                          Please log in to comment on posts
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {post.comments.slice(0, 3).map((comment, index) => (
                          <Box 
                            key={index} 
                            sx={{ 
                              display: 'flex', 
                              gap: 1.5,
                              p: 1,
                              borderRadius: 1,
                              '&:hover': {
                                bgcolor: 'background.paper',
                              },
                              transition: 'background-color 0.2s ease',
                            }}
                          >
                            <Avatar
                              src={comment.user?.profileIMG}
                              alt={comment.user?.username || 'User'}
                              sx={{ 
                                width: 32, 
                                height: 32,
                                border: '2px solid',
                                borderColor: 'primary.light',
                              }}
                            />
                            <Box>
                              <Typography
                                component={Link}
                                to={`/profile/${comment.user?.username}`}
                                variant="subtitle2"
                                sx={{ 
                                  color: 'text.primary',
                                  textDecoration: 'none',
                                  fontWeight: 600,
                                  '&:hover': { 
                                    color: 'primary.main',
                                    textDecoration: 'underline',
                                  },
                                }}
                              >
                                {comment.user?.username || 'Unknown User'}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                              >
                                {comment.text}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Collapse>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default MainCards;


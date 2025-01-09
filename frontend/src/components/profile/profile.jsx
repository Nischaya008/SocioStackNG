import React, { useEffect, useState } from 'react';
import Loading from '../../contexts/loading.jsx';
import {
  Box,
  Container,
  Avatar,
  Typography,
  Paper,
  Divider,
  Link,
  IconButton,
  Button,
  CircularProgress,
  Grid,
  Collapse,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Edit as EditIcon,
  Language as LinkIcon,
  Email as EmailIcon,
  CalendarMonth as CalendarIcon,
  PersonAdd as PersonAddIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Favorite as FavoriteIcon,
  Comment,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/auth_context';
import { format, isValid, parseISO } from 'date-fns';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import EditProfile from './edit_profile';

const Profile = () => {
  const { username } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      try {
        // First fetch profile data
        const profileRes = await axios.get(`/api/user/profile/${username || user?.username}`);
        setProfileData(profileRes.data[0]);
        
        if (user && profileRes.data[0]?.followers) {
          setIsFollowing(profileRes.data[0].followers.includes(user._id));
        }

        // Then fetch posts separately
        try {
          const postsRes = await axios.get(`/api/post/user/${username || user?.username}`);
          setPosts(postsRes.data);
          
          if (user) {
            const userLikedPosts = new Set(
              postsRes.data
                .filter(post => post.likes.includes(user._id))
                .map(post => post._id)
            );
            setLikedPosts(userLikedPosts);
          }
        } catch (error) {
          // If no posts found, just set empty array
          if (error.response?.status === 404) {
            setPosts([]);
            setLikedPosts(new Set());
          } else {
            toast.error('Error fetching posts');
          }
        }
      } catch (error) {
        // Only show error toast if profile fetch fails
        toast.error(error.response?.data?.message || 'Error fetching profile data');
      } finally {
        setLoading(false);
        setPostsLoading(false);
      }
    };

    if (user || username) {
      fetchProfileAndPosts();
    }
  }, [username, user]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error('Please login to follow users');
      return;
    }

    try {
      await axios.post(`/api/user/follow/${profileData._id}`);
      setIsFollowing(!isFollowing);
      
      // Update follower count
      setProfileData(prev => ({
        ...prev,
        followers: isFollowing 
          ? prev.followers.filter(id => id !== user._id)
          : [...prev.followers, user._id]
      }));

      toast.success(isFollowing ? 'Unfollowed successfully' : 'Followed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating follow status');
    }
  };

  const handleLike = async (postId) => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }

    try {
      await axios.post(`/api/post/like/${postId}`);
      setPosts(currentPosts => 
        currentPosts.map(post => {
          if (post._id === postId) {
            const isCurrentlyLiked = post.likes.includes(user._id);
            return {
              ...post,
              likes: isCurrentlyLiked
                ? post.likes.filter(id => id !== user._id)
                : [...post.likes, user._id]
            };
          }
          return post;
        })
      );

      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (newSet.has(postId)) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });
    } catch (error) {
      toast.error('Error updating like');
    }
  };

  const handleComment = async (postId) => {
    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      const response = await axios.post(`/api/post/comment/${postId}`, {
        text: commentText
      });

      setPosts(posts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: [...post.comments, {
              text: commentText,
              user: {
                _id: user._id,
                username: user.username,
                profileIMG: user.profileIMG
              }
            }]
          };
        }
        return post;
      }));

      setCommentText('');
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Error adding comment');
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

  const refreshProfile = async () => {
    try {
      const profileRes = await axios.get(`/api/user/profile/${username || user?.username}`);
      setProfileData(profileRes.data[0]);
    } catch (error) {
      toast.error('Error refreshing profile data');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteUsername !== user?.username) {
      setDeleteError('Username does not match');
      return;
    }

    try {
      await axios.delete('/api/user/delete');
      toast.success('Account deleted successfully');
      // Logout user and redirect to home
      window.location.href = '/';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting account');
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  if (loading) return <Loading />;
  if (!profileData) return <div>Profile not found</div>;

  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Join date unavailable';
    
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Join date unavailable';
      return format(date, 'MMMM yyyy');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Join date unavailable';
    }
  };

  return (
    <Box sx={{ bgcolor: 'var(--primary-color)', minHeight: '100vh' }}>
      {/* Cover Image */}
      <Box
        sx={{
          height: { xs: '200px', sm: '300px', md: '400px' },
          width: '100%',
          position: 'relative',
          bgcolor: '#e0e0e0',
          overflow: 'hidden',
        }}
      >
        {profileData?.coverIMG ? (
          <Box
            component="img"
            src={profileData.coverIMG}
            alt="cover"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              margin: 'auto',
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'initial',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.01)',
              },
            }}
          />
        ) : (
          // Gradient background as fallback
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, var(--secondary-color) 0%, var(--accent-color) 100%)`,
            }}
          />
        )}
      </Box>

      <Container maxWidth="lg" sx={{ transform: 'translateY(-50px)' }}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, md: 4 },
            borderRadius: 2,
            position: 'relative',
            bgcolor: 'var(--primary-color)',
          }}
        >
          {/* Profile Image */}
          <Avatar
            src={profileData.profileIMG}
            alt={profileData.username}
            sx={{
              width: { xs: 120, md: 150 },
              height: { xs: 120, md: 150 },
              border: '4px solid var(--primary-color)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              position: 'absolute',
              top: { xs: -60, md: -75 },
              left: { xs: '50%', md: 50 },
              transform: { xs: 'translateX(-50%)', md: 'none' },
              bgcolor: 'var(--accent-color)',
              fontSize: { xs: '3rem', md: '4rem' },
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: { 
                  xs: 'translateX(-50%) scale(1.05)', 
                  md: 'scale(1.05)' 
                },
              },
            }}
          >
            {!profileData.profileIMG && profileData.username[0].toUpperCase()}
          </Avatar>

          {/* Follow/Edit Button */}
          {user && user._id !== profileData._id && (
            <Button
              variant={isFollowing ? "outlined" : "contained"}
              color={isFollowing ? "primary" : "primary"}
              onClick={handleFollowToggle}
              startIcon={isFollowing ? null : <PersonAddIcon />}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: isFollowing ? 'transparent' : 'var(--accent-color)',
                borderColor: isFollowing ? 'var(--accent-color)' : 'transparent',
                color: isFollowing ? 'var(--accent-color)' : 'white',
                '&:hover': { 
                  transform: 'scale(1.02)',
                  bgcolor: 'var(--secondary-color)',
                  borderColor: 'var(--secondary-color)',
                  color: 'white',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </Button>
          )}

          {/* Edit Button (only show for own profile) */}
          {user && user._id === profileData._id && (
            <IconButton
              onClick={() => setShowEditProfile(true)}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                bgcolor: 'rgba(255,255,255,0.9)',
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,1)',
                  transform: 'scale(1.1)',
                },
                transition: 'transform 0.2s ease-in-out',
              }}
            >
              <EditIcon />
            </IconButton>
          )}

          {/* User Info */}
          <Box
            sx={{
              mt: { xs: 8, md: 6 },
              ml: { xs: 0, md: 20 },
              textAlign: { xs: 'center', md: 'left' },
            }}
          >
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: 'var(--secondary-color)',
              mb: 0.5,
            }}>
              {profileData.name}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              @{profileData.username}
            </Typography>

            {/* Join Date */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              justifyContent: { xs: 'center', md: 'flex-start' },
              color: 'text.secondary',
              mb: 2,
            }}>
              <CalendarIcon fontSize="small" />
              <Typography variant="body2">
                Joined {formatJoinDate(profileData.createdAt)}
              </Typography>
            </Box>

            {profileData.bio && (
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 3, 
                  maxWidth: '600px',
                  mx: { xs: 'auto', md: 0 },
                  color: '#34495e',
                }}
              >
                {profileData.bio}
              </Typography>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Contact Information */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              gap: 3,
              alignItems: { xs: 'center', md: 'flex-start' },
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: '#34495e',
              }}>
                <EmailIcon color="action" />
                <Typography>{profileData.email}</Typography>
              </Box>

              {profileData.link && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinkIcon color="action" />
                  <Link 
                    href={profileData.link} 
                    target="_blank" 
                    rel="noopener"
                    sx={{ 
                      color: 'var(--accent-color)',
                      textDecoration: 'none',
                      '&:hover': {
                        color: 'var(--secondary-color)',
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {profileData.link}
                  </Link>
                </Box>
              )}
            </Box>

            {/* Add Followers/Following Count */}
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 3, 
                mt: 2,
                mb: 3,
                justifyContent: { xs: 'center', md: 'flex-start' },
              }}
            >
              <Typography variant="body2" color="text.secondary">
                <strong>{profileData.followers?.length || 0}</strong> Followers
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>{profileData.following?.length || 0}</strong> Following
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Posts Section - Moved up and reformatted */}
      <Box sx={{ mt: -4, pb: 6 }}>  {/* Negative margin to move up */}
        <Container maxWidth="lg">
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              mb: 3,
              pb: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: 'text.primary',
                textAlign: { xs: 'center', md: 'left' }
              }}
            >
              Posts
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
            >
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </Typography>
          </Box>

          {postsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : posts.length === 0 ? (
            <Paper 
              elevation={0}
              sx={{ 
                p: 4,
                textAlign: 'center',
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: 1,
                borderColor: 'divider'
              }}
            >
              <Typography variant="body1" color="text.secondary">
                No posts yet
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2.5}>  {/* Reduced spacing for better density */}
              {posts.map((post) => (
                <Grid item xs={12} key={post._id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, md: 3 },
                      borderRadius: 2,
                      bgcolor: 'var(--primary-color)',
                      border: 1,
                      borderColor: 'divider',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          color: 'text.primary',
                          fontSize: { xs: '1.1rem', md: '1.25rem' }
                        }}
                      >
                        {post.title}
                      </Typography>

                      {post.image && (
                        <Box 
                          sx={{ 
                            width: '100%',
                            height: { xs: 200, md: 300 },
                            borderRadius: 2,
                            overflow: 'hidden',
                            backgroundColor: 'action.hover',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleImageClick(post.image)}
                        >
                          <Box
                            component="img"
                            src={post.image}
                            alt={post.title}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease',
                              '&:hover': {
                                transform: 'scale(1.02)',
                              },
                            }}
                          />
                        </Box>
                      )}

                      <Typography 
                        variant="body1" 
                        color="text.secondary"
                        sx={{
                          fontSize: { xs: '0.9rem', md: '1rem' },
                          lineHeight: 1.6
                        }}
                      >
                        {post.description}
                      </Typography>

                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 3,
                          pt: 1,
                          borderTop: 1,
                          borderColor: 'divider',
                          px: 2,
                          py: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
                            <FavoriteIcon />
                          </IconButton>
                          <Typography variant="body2" color="text.secondary">
                            {post.likes.length}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
                        </Box>
                      </Box>

                      {/* Comments Section */}
                      <Collapse in={expandedComments.has(post._id)} timeout="auto" unmountOnExit>
                        <Box 
                          sx={{ 
                            p: 2,
                            bgcolor: 'var(--primary-color)',
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
                                  bgcolor: 'var(--accent-color)',
                                  '&:hover': {
                                    bgcolor: 'var(--secondary-color)',
                                    transform: 'scale(1.02)',
                                  },
                                  transition: 'transform 0.2s ease',
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
                            {post.comments && post.comments.length > 0 && post.comments
                              .slice(0, 3)
                              .filter(comment => comment && comment.user) // Only show comments with valid user data
                              .map((comment, index) => (
                                <Box 
                                  key={comment._id || index} 
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
                                  >
                                    {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                                  </Avatar>
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
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>

      {user && user._id === profileData._id && (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
          <Divider sx={{ 
            mb: 4,
            borderColor: 'error.light',
            opacity: 0.5,
            '&::before, &::after': {
              borderColor: 'error.light',
            }
          }}>
            <Typography 
              variant="overline" 
              sx={{ 
                color: 'error.main',
                px: 2,
                fontWeight: 500
              }}
            >
              Account Settings
            </Typography>
          </Divider>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid #ff4444',
              bgcolor: 'error.lighter',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'error.main',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
              }}
            >
              <DeleteIcon color="error" />
              Danger Zone
            </Typography>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Warning</AlertTitle>
              Deleting your account is permanent and cannot be undone. All your data
              will be permanently removed.
            </Alert>

            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setShowDeleteDialog(true)}
              sx={{
                mt: 1,
                '&:hover': {
                  bgcolor: 'error.dark',
                },
              }}
            >
              Delete Account
            </Button>
          </Paper>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={showDeleteDialog}
            onClose={() => {
              setShowDeleteDialog(false);
              setDeleteUsername('');
              setDeleteError('');
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ color: 'error.main' }}>
              Delete Account Confirmation
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Please type your username <strong>{user?.username}</strong> to
                confirm deletion:
              </Typography>
              <TextField
                fullWidth
                value={deleteUsername}
                onChange={(e) => {
                  setDeleteUsername(e.target.value);
                  setDeleteError('');
                }}
                error={!!deleteError}
                helperText={deleteError}
                placeholder="Enter your username"
                sx={{ mb: 2 }}
              />
              <Alert severity="error">
                This action cannot be undone. Your account and all associated data
                will be permanently deleted.
              </Alert>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteUsername('');
                  setDeleteError('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleDeleteAccount}
                disabled={!deleteUsername}
              >
                Delete My Account
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      )}

      {showEditProfile && (
        <EditProfile 
          user={profileData} 
          onClose={() => setShowEditProfile(false)}
          onSave={() => {
            setShowEditProfile(false);
            refreshProfile();
          }}
        />
      )}

      <Dialog
        open={!!selectedImage}
        onClose={handleCloseImage}
        maxWidth={false}
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: 'transparent',
            boxShadow: 'none',
            margin: 0,
            maxHeight: '90vh',
            maxWidth: '90vw',
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            '&:hover': {
              cursor: 'pointer',
            },
          }}
          onClick={handleCloseImage}
        >
          <img
            src={selectedImage}
            alt="Full size"
            style={{
              maxWidth: '85vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              width: 'auto',
              height: 'auto',
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Profile;

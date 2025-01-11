import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/theme_context';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Close } from '@mui/icons-material';

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Adjust quality here (0.7 = 70% quality)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedDataUrl);
      };
    };
  });
};

const EditCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: ''
  });

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`/api/post/all`);
      const post = response.data.find(post => post._id === id);
      if (post) {
        setFormData({
          title: post.title,
          description: post.description,
          image: post.image || ''
        });
        setImagePreview(post.image);
      }
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching post');
      navigate('/');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for initial check
        toast.error('Image size should be less than 10MB');
        return;
      }

      try {
        const compressedImage = await compressImage(file);
        setImagePreview(compressedImage);
        setFormData(prev => ({
          ...prev,
          image: compressedImage
        }));
      } catch (error) {
        toast.error('Error processing image');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        image: formData.image || null
      };
      
      await axios.post(`/api/post/edit/${id}`, dataToSend);
      toast.success('Post updated successfully');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating post');
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Dialog
        open={true}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
            m: 2,
          }
        }}
      >
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
        </Box>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={true}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'var(--background-paper)',
          color: 'var(--text-color)',
          m: 2,
          maxHeight: 'calc(100vh - 32px)',
          '& .MuiTextField-root': {
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'var(--border-color)',
              },
              '&:hover fieldset': {
                borderColor: 'var(--accent-color)',
              },
              '& input': {
                color: 'var(--text-color)',
              },
              '& textarea': {
                color: 'var(--text-color)',
              }
            },
            '& .MuiInputLabel-root': {
              color: 'var(--muted-text-color)',
            },
          },
        }
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(5px)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 3,
          color: 'var(--text-color)',
          bgcolor: 'var(--background-paper)',
        }}
      >
        <Typography variant="h6" component="div" sx={{ 
          fontWeight: 600,
          color: 'var(--text-color)', 
        }}>
          Edit Post
        </Typography>
        <IconButton
          onClick={handleClose}
          sx={{
            color: 'var(--text-color)',
            '&:hover': { 
              color: 'error.main',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent 
        sx={{ 
          p: 3,
          bgcolor: 'var(--background-paper)',
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
      >
        <form onSubmit={handleSubmit}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3,
            pt: 1,
          }}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                },
                '& .MuiInputLabel-root': {
                  transform: 'translate(14px, 16px) scale(1)',
                },
                '& .MuiInputLabel-shrink': {
                  transform: 'translate(14px, -6px) scale(0.75)',
                },
              }}
            />

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              multiline
              rows={4}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />

            <Box>
              <input
                accept="image/*"
                type="file"
                id="image-upload"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    textTransform: 'none',
                  }}
                >
                  Change Image
                </Button>
              </label>

              {imagePreview && (
                <Box
                  sx={{
                    mt: 2,
                    position: 'relative',
                    width: '100%',
                    height: 200,
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: darkMode ? '#333333' : '#F3F4F6',
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                  <IconButton
                    onClick={() => {
                      setImagePreview(null);
                      setFormData(prev => ({ ...prev, image: '' }));
                    }}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.8)',
                      },
                    }}
                  >
                    <Close />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'flex-end',
              position: 'sticky',
              bottom: 0,
              bgcolor: darkMode ? '#1E1E1E' : '#ffffff',
              pt: 1.5,
              pb: 2,
              mt: 2,
              borderTop: '1px solid',
              borderColor: 'var(--border-color)',
            }}>
              <Button
                onClick={handleClose}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 4,
                  py: 1,
                  borderColor: '#F97316',
                  color: '#F97316',
                  bgcolor: darkMode ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                  '&:hover': {
                    borderColor: '#2D6A4F',
                    color: '#2D6A4F',
                    backgroundColor: darkMode ? 'rgba(45, 106, 79, 0.1)' : 'rgba(45, 106, 79, 0.04)',
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 4,
                  py: 0,
                  bgcolor: '#F97316',
                  '&:hover': {
                    bgcolor: '#2D6A4F',
                    transform: 'scale(1.02)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCard;

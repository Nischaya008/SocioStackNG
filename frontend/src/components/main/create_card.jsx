import { useState } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Image as ImageIcon } from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const FloatingCreatePost = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFormData({ title: '', description: '', image: null });
    setImagePreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({
          ...prev,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/api/post/create', formData);
      toast.success('Post created successfully!');
      // Dispatch custom event
      window.dispatchEvent(new Event('postUpdated'));
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="create post"
        onClick={handleOpen}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24, md: 32 },
          left: { xs: 16, sm: 24, md: 32 },
          bgcolor: '#F97316',
          '&:hover': {
            bgcolor: '#2D6A4F',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.2s ease',
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'var(--primary-color)',
            boxShadow: 24,
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: 1,
          p: 3,
          pt: 4,
        }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Create New Post
          </Typography>
          <IconButton
            onClick={handleClose}
            sx={{
              '&:hover': { 
                color: 'error.main',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2 }}>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              variant="outlined"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              multiline
              rows={4}
              variant="outlined"
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
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
                  startIcon={<ImageIcon />}
                  sx={{ mb: 2 }}
                >
                  Add Image
                </Button>
              </label>

              {imagePreview && (
                <Box sx={{ 
                  position: 'relative',
                  mt: 2,
                  width: '100%',
                  height: 200,
                  borderRadius: 1,
                  overflow: 'hidden',
                }}>
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
                      setFormData(prev => ({ ...prev, image: null }));
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
                    <CloseIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                bgcolor: '#F97316',
                '&:hover': {
                  bgcolor: '#2D6A4F',
                },
                height: 48,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Post'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingCreatePost;

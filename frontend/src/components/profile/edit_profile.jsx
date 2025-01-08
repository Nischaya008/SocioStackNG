import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon, CameraAlt as CameraIcon } from '@mui/icons-material';

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
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedDataUrl);
      };
    };
  });
};

const EditProfile = ({ user, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    link: user?.link || '',
    currentPassword: '',
    newPassword: '',
    profileIMG: user?.profileIMG || '',
    coverIMG: user?.coverIMG || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = async (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB');
        return;
      }

      try {
        const compressedImage = await compressImage(file);
        setFormData(prev => ({
          ...prev,
          [type]: compressedImage
        }));
      } catch (error) {
        toast.error('Error processing image');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/user/update', formData);
      toast.success('Profile updated successfully');
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageDelete = (type) => {
    setFormData(prev => ({
      ...prev,
      [type]: null
    }));
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#F3F4F6',
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 3,
        borderBottom: '1px solid rgba(0,0,0,0.1)'
      }}>
        <Typography variant="h6" sx={{ color: '#2D6A4F' }}>Edit Profile</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: {
              xs: '1fr',              // Single column on mobile
              md: '1fr 1fr'          // Two columns on medium and larger screens
            },
            gap: { xs: 2, md: 4 },   // Smaller gap on mobile
            '& > *': { margin: '0 !important' }
          }}>
            {/* Left Column */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
              {/* Profile Image Section */}
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                alignItems: 'center',
                bgcolor: 'white',
                p: 2,
                borderRadius: 2,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                position: 'relative'
              }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={formData.profileIMG}
                    sx={{ 
                      width: { xs: 80, md: 100 }, 
                      height: { xs: 80, md: 100 }
                    }}
                  />
                  <input
                    accept="image/*"
                    type="file"
                    id="profile-image"
                    onChange={(e) => handleImageChange(e, 'profileIMG')}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="profile-image">
                    <IconButton
                      component="span"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                      }}
                    >
                      <CameraIcon />
                    </IconButton>
                  </label>
                </Box>
                {formData.profileIMG && (
                  <IconButton 
                    size="small"
                    onClick={() => handleImageDelete('profileIMG')}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.1)',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.2)' }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              {/* Cover Image Section */}
              <Box sx={{ 
                position: 'relative', 
                height: { xs: 150, md: 200 }, 
                bgcolor: 'white',
                borderRadius: 2,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                {formData.coverIMG && (
                  <img
                    src={formData.coverIMG}
                    alt="Cover"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 8
                    }}
                  />
                )}
                <input
                  accept="image/*"
                  type="file"
                  id="cover-image"
                  onChange={(e) => handleImageChange(e, 'coverIMG')}
                  style={{ display: 'none' }}
                />
                <label htmlFor="cover-image">
                  <IconButton
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    <CameraIcon />
                  </IconButton>
                </label>
                {formData.coverIMG && (
                  <IconButton 
                    size="small"
                    onClick={() => handleImageDelete('coverIMG')}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.1)',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.2)' }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <TextField 
                fullWidth
                label="Bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                multiline
                rows={4}
                variant="outlined"
                sx={{
                  bgcolor: 'white',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#F97316',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#F97316',
                    },
                  }
                }}
              />
            </Box>

            {/* Right Column */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: { xs: 2, md: 3 },
              mt: { xs: 0, md: 4 }
            }}>
              {['name', 'email', 'link', 'currentPassword', 'newPassword'].map((field) => (
                <TextField
                  key={field}
                  fullWidth
                  label={field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                  name={field}
                  type={field.includes('Password') ? 'password' : 'text'}
                  value={formData[field]}
                  onChange={handleChange}
                  variant="outlined"
                  helperText={field === 'newPassword' ? "Leave blank if you don't want to change password" : ''}
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#F97316',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#F97316',
                      },
                    }
                  }}
                />
              ))}

              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'flex-end', 
                mt: { xs: 2, md: 'auto' }
              }}>
                <Button 
                  onClick={onClose} 
                  variant="outlined"
                  sx={{
                    borderColor: '#2D6A4F',
                    color: '#2D6A4F',
                    '&:hover': {
                      borderColor: '#2D6A4F',
                      bgcolor: 'rgba(45, 106, 79, 0.04)',
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    bgcolor: '#F97316',
                    '&:hover': { bgcolor: '#2D6A4F' },
                    '&:disabled': { bgcolor: 'rgba(249, 115, 22, 0.5)' }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </Box>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfile;

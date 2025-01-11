import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../contexts/auth_context.jsx';
import { useTheme } from '../../contexts/theme_context.jsx';

const SignIn = ({ open, onClose }) => {
  const { login } = useAuth();
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const formRef = useRef(null);

  const textColor = darkMode ? '#ffffff' : 'inherit';
  const mutedTextColor = darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        username: formData.usernameOrEmail,
        email: formData.usernameOrEmail,
        password: formData.password,
      });

      if (response.status === 200) {
        await login(response.data);
        toast.success('Successfully logged in!');
        onClose();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'var(--primary-color)',
          width: { xs: '90%', sm: '80%', md: '60%' },
          maxWidth: '600px',
        }
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(5px)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        }
      }}
    >
      <DialogContent 
        ref={formRef}
        sx={{ 
          p: { xs: 3, md: 6 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <Box sx={{ 
          width: '100%',
          maxWidth: '400px'
        }}>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 4, 
              color: 'var(--secondary-color) !important',
              fontWeight: 600,
              textAlign: 'center' 
            }}
          >
            Welcome Back
          </Typography>

          <form onSubmit={handleSubmit}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2.5
            }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Username or Email"
                name="usernameOrEmail"
                value={formData.usernameOrEmail}
                onChange={handleChange}
                required
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: textColor,
                    '& fieldset': {
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--accent-color)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--accent-color)',
                    },
                    '& input:-webkit-autofill': {
                      '-webkit-box-shadow': darkMode ? '0 0 0 100px #333333 inset' : '0 0 0 100px #ffffff inset',
                      '-webkit-text-fill-color': darkMode ? '#ffffff' : '#000000',
                    },
                    '& input:-webkit-autofill:focus': {
                      '-webkit-box-shadow': darkMode ? '0 0 0 100px #333333 inset' : '0 0 0 100px #ffffff inset',
                      '-webkit-text-fill-color': darkMode ? '#ffffff' : '#000000',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: mutedTextColor,
                  },
                  '& .MuiIconButton-root': {
                    color: mutedTextColor,
                  },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: textColor,
                    '& fieldset': {
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--accent-color)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--accent-color)',
                    },
                    '& input:-webkit-autofill': {
                      '-webkit-box-shadow': darkMode ? '0 0 0 100px #333333 inset' : '0 0 0 100px #ffffff inset',
                      '-webkit-text-fill-color': darkMode ? '#ffffff' : '#000000',
                    },
                    '& input:-webkit-autofill:focus': {
                      '-webkit-box-shadow': darkMode ? '0 0 0 100px #333333 inset' : '0 0 0 100px #ffffff inset',
                      '-webkit-text-fill-color': darkMode ? '#ffffff' : '#000000',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: mutedTextColor,
                  },
                  '& .MuiIconButton-root': {
                    color: mutedTextColor,
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 2,
                  bgcolor: 'var(--accent-color)',
                  '&:hover': {
                    bgcolor: 'var(--secondary-color)',
                  },
                  height: 48,
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>
          </form>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SignIn;

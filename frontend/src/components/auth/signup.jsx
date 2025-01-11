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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useTheme } from '../../contexts/theme_context.jsx';

const SignUp = ({ open, onClose }) => {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const formRef = useRef(null);

  // Password validation criteria
  const passwordCriteria = {
    minLength: password => password.length >= 8,
    hasUpper: password => /[A-Z]/.test(password),
    hasLower: password => /[a-z]/.test(password),
    hasNumber: password => /\d/.test(password),
    hasSpecial: password => /[@$!%*?&]/.test(password),
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setLoading(false);
      return;
    }

    // Check if all password criteria are met
    const isPasswordValid = Object.values(passwordCriteria)
      .every(criterion => criterion(formData.password));
    
    if (!isPasswordValid) {
      setError('Password does not meet all requirements');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/signup', {
        username: formData.username,
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (response.status === 201) {
        // Show success toast
        toast.success('Account created successfully! Please login.');
        onClose();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred');
      // Scroll to top when error occurs
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const textColor = darkMode ? '#ffffff' : 'inherit';
  const mutedTextColor = darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary';

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
          width: { xs: '90%', sm: '80%', md: '70%' },
          maxWidth: '800px',
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
          maxWidth: '600px'
        }}>
          <Typography variant="h5" sx={{ 
            mb: 3, 
            color: 'var(--secondary-color)',
            fontWeight: 600 
          }}>
            Create Account
          </Typography>

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
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
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
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
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
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
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
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

              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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

              {/* Password requirements list */}
              <List dense sx={{ 
                bgcolor: 'var(--primary-color)',
                borderRadius: 1,
                mt: 1,
                '& .MuiTypography-root': {
                  color: textColor,
                },
              }}>
                {Object.entries(passwordCriteria).map(([key, checkFn]) => (
                  <ListItem key={key}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {checkFn(formData.password) ? (
                        <CheckIcon color="success" fontSize="small" />
                      ) : (
                        <CloseIcon color="error" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2">
                          {key === 'minLength' && 'At least 8 characters'}
                          {key === 'hasUpper' && 'One uppercase letter'}
                          {key === 'hasLower' && 'One lowercase letter'}
                          {key === 'hasNumber' && 'One number'}
                          {key === 'hasSpecial' && 'One special character (@$!%*?&)'}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>

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
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </Box>
          </form>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SignUp;

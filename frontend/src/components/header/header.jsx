import React, { useState, useRef, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  InputBase, 
  IconButton, 
  Button,
  Box,
  styled,
  alpha,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Switch,
  Stack,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  LocalLibrary as LogoIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  DarkMode as DarkModeIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Signup from '../auth/signup';
import SignIn from '../auth/signin';
import { useAuth } from '../../contexts/auth_context.jsx';
import NotificationDialog from '../notifications/notifs.jsx';

// Styled components
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '40ch',
    },
  },
}));

const Header = () => {
  const { user, logout } = useAuth();
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Successfully logged out!');
      handleClose();
      window.location.href = '/';
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
    }
  };

  const handleThemeChange = () => {
    setDarkMode(!darkMode);
    // You can implement theme switching logic here
  };

  const getInitial = (username) => {
    return username ? username[0].toUpperCase() : '?';
  };

  const handleProfileMenuClick = (path) => {
    handleClose(); // Close the menu
    navigate(path); // Navigate to the selected path
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (event) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (query.length >= 2) {
      try {
        const response = await axios.get(`/api/user/profile/${query}`);
        setSearchResults(response.data);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSearchProfileClick = (username) => {
    navigate(`/profile/${username}`);
    setShowResults(false);
    setSearchQuery('');
  };

  return (
    <AppBar 
      position="fixed"
      sx={{ 
        backgroundColor: 'var(--secondary-color)',
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ flexWrap: 'wrap', gap: 1, py: { xs: 1, md: 0 } }}>
        {/* Logo and Name */}
        <Box 
          component="a"
          href="/"
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexGrow: 0,
            mr: { xs: 0, md: 2 },
            textDecoration: 'none',
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.9
            }
          }}
        >
          <Box
            component="img"
            src="https://github.com/Nischaya008/Image_hosting/blob/main/SSN.gif?raw=true"
            alt="Logo"
            sx={{
              height: 40,  // Adjust size as needed
              width: 'auto',
              mr: 1
            }}
          />
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: { xs: '.1rem', md: '.2rem' },
              color: '#ecf0f1',
              fontSize: { xs: '1rem', md: '1.25rem' }
            }}
          >
            socioStackNG
          </Typography>
        </Box>

        {/* Search Bar */}
        <Box sx={{ 
          position: 'relative',
          flexGrow: 1, 
          width: { xs: '100%', md: 'auto' },
          order: { xs: 3, md: 2 }
        }} ref={searchRef}>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search users…"
              value={searchQuery}
              onChange={handleSearch}
              inputProps={{ 'aria-label': 'search' }}
              sx={{
                width: '100%',
                '& .MuiInputBase-input': {
                  width: { xs: '100%', md: '40ch' }
                }
              }}
            />
          </Search>

          {/* Add the Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <Paper
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                mt: 1,
                maxHeight: '300px',
                overflow: 'auto',
                zIndex: 1000,
                boxShadow: 3,
                borderRadius: 2,
              }}
            >
              {searchResults.map((user) => (
                <Box
                  key={user._id}
                  onClick={() => handleSearchProfileClick(user.username)}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Avatar
                    src={user.profileIMG}
                    alt={user.username}
                    sx={{ width: 40, height: 40 }}
                  >
                    {user.username[0].toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{user.username}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Paper>
          )}
        </Box>

        {/* Right Side Buttons */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          order: { xs: 2, md: 3 },
          ml: { xs: 'auto', md: 0 }
        }}>
          <IconButton
            size="medium"
            color="inherit"
            onClick={() => setNotificationDialogOpen(true)}
            sx={{
              '&:hover': { 
                transform: 'scale(1.1)',
              },
              transition: 'transform 0.2s ease',
            }}
          >
            <NotificationsIcon />
          </IconButton>

          {user ? (
            <>
              <IconButton
                onClick={handleProfileClick}
                sx={{ p: 0.5 }}
              >
                {user.profileIMG ? (
                  <Avatar 
                    src={user.profileIMG} 
                    alt={user.username}
                    sx={{ width: 35, height: 35 }}
                  />
                ) : (
                  <Avatar sx={{ 
                    width: 35, 
                    height: 35,
                    bgcolor: '#e74c3c'
                  }}>
                    {getInitial(user.username)}
                  </Avatar>
                )}
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 250,
                    boxShadow: '0px 4px 20px rgba(0,0,0,0.1)'
                  }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {/* User Info Section */}
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {user.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{user.username}
                  </Typography>
                </Box>
                <Divider />

                {/* Menu Items */}
                <MenuItem onClick={() => handleProfileMenuClick('/profile')}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                {/*<MenuItem onClick={handleClose}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>*/}

                {/* Theme Switch */}
                <MenuItem>
                  <ListItemIcon>
                    <DarkModeIcon fontSize="small" />
                  </ListItemIcon>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                    Theme
                    <Switch
                      size="small"
                      checked={darkMode}
                      onChange={handleThemeChange}
                      sx={{ ml: 'auto' }}
                    />
                  </Stack>
                </MenuItem>

                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => setIsSignUpOpen(true)}
                sx={{ 
                  color: 'var(--primary-color)',
                  borderColor: 'var(--primary-color)',
                  '&:hover': {
                    borderColor: 'var(--accent-color)',
                    backgroundColor: 'rgba(243, 244, 246, 0.1)'
                  },
                  px: { xs: 1, md: 2 },
                  minWidth: { xs: 'auto', md: '80px' }
                }}
              >
                Sign Up
              </Button>
              <Button 
                variant="contained"
                size="small"
                onClick={() => setIsSignInOpen(true)}
                sx={{ 
                  backgroundColor: 'var(--accent-color)',
                  '&:hover': {
                    backgroundColor: 'var(--secondary-color)'
                  },
                  px: { xs: 1, md: 2 },
                  minWidth: { xs: 'auto', md: '80px' }
                }}
              >
                Sign In
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
      
      {/* Only render auth modals if user is not logged in */}
      {!user && (
        <>
          <Signup open={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} />
          <SignIn open={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
        </>
      )}

      <NotificationDialog 
        open={notificationDialogOpen}
        onClose={() => setNotificationDialogOpen(false)}
      />
    </AppBar>
  );
};
export default Header;

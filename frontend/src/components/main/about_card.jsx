import { useState } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Paper,
  Divider,
  Link,
  Slide,
} from '@mui/material';
import {
  Info as InfoIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
  Language as WebsiteIcon,
} from '@mui/icons-material';

const AboutCard = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const contactLinks = [
    {
      icon: <EmailIcon />,
      label: 'Email',
      value: 'nischayagarg008@gmail.com',
      href: 'mailto:nischayagarg008@gmail.com'
    },
    {
      icon: <LinkedInIcon />,
      label: 'LinkedIn',
      value: 'Nischaya008',
      href: 'https://www.linkedin.com/in/nischaya008/'
    },
    {
      icon: <GitHubIcon />,
      label: 'GitHub',
      value: 'Nischaya008',
      href: 'https://github.com/Nischaya008'
    },
    {
      icon: <WebsiteIcon />,
      label: 'Website',
      value: 'Coming Soon...'
    }
  ];

  return (
    <>
      <Fab
        color="primary"
        aria-label="about"
        onClick={handleOpen}
        sx={{
          position: 'fixed',
          bottom: { xs: 80, sm: 88, md: 96 },
          right: { xs: 16, sm: 24, md: 32 },
          bgcolor: 'var(--accent-color)',
          '&:hover': {
            bgcolor: 'var(--secondary-color)',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.2s ease',
          zIndex: 1000,
        }}
      >
        <InfoIcon />
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
            backgroundImage: 'none',
          }
        }}
        sx={{
          backdropFilter: 'blur(5px)',
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 3,
          }}
        >
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            About Me
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

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Mission Statement */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                bgcolor: 'var(--secondary-color)', 
                color: 'white',
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                My Mission
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                To create a vibrant social platform that connects people through meaningful interactions
                and shared experiences, while fostering a supportive and engaging community.
              </Typography>
            </Paper>

            {/* About Section */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--secondary-color)' }}>
                Behind the Code
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
              I am a Computer Science Engineering student specializing in Artificial Intelligence and Machine Learning (Hons. IBM). My expertise lies in Full-stack Web Development, with proficiency in MongoDB, Express, React, Node.js, and C++ for Data Structures and Algorithms (DSA).
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              This is a scalable social media platform featuring real-time interactions, Material-UI design, image optimization via Cloudinary, JWT authentication, and responsive PWA capabilities. This project highlights my ability to develop modern, user-centric applications with a focus on performance and scalability.
              </Typography>
            </Box>

            <Divider />

            {/* Contact Links */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--secondary-color)' }}>
                Connect With Me
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {contactLinks.map((contact, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <Box sx={{ color: 'var(--accent-color)' }}>
                      {contact.icon}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {contact.label}
                      </Typography>
                      <Link
                        href={contact.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: 'text.primary',
                          textDecoration: 'none',
                          '&:hover': {
                            color: 'var(--accent-color)',
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {contact.value}
                      </Link>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AboutCard;

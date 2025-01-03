import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toolbar } from '@mui/material';
import Header from './components/header/header.jsx';
import Profile from './components/profile/profile.jsx';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/auth_context.jsx';
import MainCards from './components/main/main_cards.jsx';
import EditCard from './components/main/edit_card.jsx';
import ScrollToTop from './components/main/scrolltop.jsx';
import FloatingCreatePost from './components/main/create_card.jsx';

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          marginTop: '50px' 
        }}>
          <h2>Something went wrong</h2>
          <button 
            onClick={() => window.location.href = '/'}
            style={{
              padding: '10px 20px',
              marginTop: '20px',
              cursor: 'pointer'
            }}
          >
            Return to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#F3F4F6',
                color: '#2D6A4F',
              },
              success: {
                iconTheme: {
                  primary: '#F97316',
                  secondary: '#F3F4F6',
                },
              },
              error: {
                iconTheme: {
                  primary: '#F97316',
                  secondary: '#F3F4F6',
                },
              },
            }}
          />
          <Header />
          <Toolbar />
          <Routes>
            <Route path="/" element={<MainCards />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/edit-post/:id" element={<EditCard />} />
          </Routes>
          <ScrollToTop />
          <FloatingCreatePost />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

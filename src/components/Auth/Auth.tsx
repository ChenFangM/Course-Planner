import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Box, TextField, Button, Typography, Container, Paper, Alert } from '@mui/material';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Handle the email confirmation when the page loads
    const handleEmailConfirmation = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          setMessage({ type: 'success', text: 'Email confirmed successfully! You can now sign in.' });
        } catch (error: any) {
          setMessage({ type: 'error', text: error.message });
        }
      }
    };

    handleEmailConfirmation();
  }, []);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        setMessage({ 
          type: 'success', 
          text: 'Check your email for the confirmation link! You will need to confirm your email before signing in.' 
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      bgcolor: '#121212',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      overflowY: 'auto'
    }}>
    <Container maxWidth="sm" sx={{ 
      py: 4,
      position: 'relative'
    }}>
      <Paper 
        elevation={3} 
        sx={{ 
          width: '100%',
          maxWidth: 'sm',
          p: 4,
          borderRadius: 2,
          bgcolor: '#1e1e1e',
          color: 'white'
        }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography component="h1" variant="h4" gutterBottom>
            Course Planner
          </Typography>
          <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </Typography>
        </Box>

        {message && (
          <Alert 
            severity={message.type} 
            sx={{ mb: 3 }}
          >
            {message.text}
          </Alert>
        )}

        <Box 
          component="form" 
          onSubmit={handleAuth} 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <TextField
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& input': {
                  color: 'white',
                },
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: '#ba68c8',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#9c27b0',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#9c27b0',
                },
              },
            }}
          />
          <TextField
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& input': {
                  color: 'white',
                },
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: '#ba68c8',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#9c27b0',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#9c27b0',
                },
              },
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ 
              mt: 2,
              bgcolor: '#9c27b0',
              '&:hover': {
                bgcolor: '#7b1fa2'
              }
            }}
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage(null);
            }}
            sx={{ 
              mt: 1,
              color: '#ba68c8',
              '&:hover': {
                color: '#9c27b0'
              }
            }}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </Button>
        </Box>
      </Paper>
    </Container>
    </Box>
  );
}

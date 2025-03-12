import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { Box, CssBaseline, AppBar, Toolbar, Typography, Button, ThemeProvider, createTheme } from '@mui/material'
import { Auth } from './components/Auth/Auth'
import { CoursePlan } from './pages/CoursePlan'
import { CourseBrowser } from './pages/CourseBrowser'
import { supabase } from './lib/supabaseClient'

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingTop: '2rem',
          paddingBottom: '2rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: '2rem',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

// Navigation component to handle active state
function Navigation() {
  const location = useLocation();
  
  return (
    <Button 
      color="inherit" 
      component={Link} 
      to="/browse"
      sx={{ 
        fontSize: '1rem',
        px: 2,
        py: 1,
        backgroundColor: location.pathname === '/browse' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
        }
      }}
    >
      BROWSE COURSES
    </Button>
  );
}

function App() {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (!session) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default'
        }}>
          <Auth />
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <CssBaseline />
        <Box sx={{ 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default'
        }}>
          <AppBar position="static">
            <Toolbar sx={{ px: { xs: 2, sm: 4 } }}>
              <Typography 
                variant="h6" 
                component={Link} 
                to="/"
                sx={{ 
                  textDecoration: 'none',
                  color: 'inherit',
                  flexGrow: 0,
                  mr: 4,
                  fontWeight: 600,
                  letterSpacing: '0.5px'
                }}
              >
                Course Planner
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Navigation />
              </Box>
              <Box sx={{ flexGrow: 1 }} />
              <Button 
                color="inherit" 
                onClick={handleSignOut}
                sx={{ 
                  fontSize: '1rem',
                  px: 2,
                  py: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  }
                }}
              >
                SIGN OUT
              </Button>
            </Toolbar>
          </AppBar>

          <Box component="main" sx={{ flex: 1, width: '100%', p: { xs: 2, sm: 3 } }}>
            <Routes>
              <Route path="/" element={<CoursePlan />} />
              <Route path="/browse" element={<CourseBrowser />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  )
}

export default App
import type { FC } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface SemesterHeaderProps {
  semesterId: number;
  courseCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onAddCourse: () => void;
}

export function SemesterHeader({
  semesterId,
  courseCount,
  isCollapsed,
  onToggleCollapse,
  onAddCourse
}: SemesterHeaderProps) {
  return (
    <Box sx={{ 
      p: 1.5, 
      bgcolor: 'primary.main', 
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      '&:hover': { bgcolor: 'primary.dark' }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton 
          size="small" 
          sx={{ 
            color: 'white', 
            p: 0.5,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
        >
          {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          Semester {semesterId} {courseCount > 0 && `(${courseCount})`}
        </Typography>
      </Box>
      <Button
        variant="contained"
        color="secondary"
        size="small"
        startIcon={<AddIcon />}
        onClick={(e) => {
          e.stopPropagation();
          onAddCourse();
        }}
        sx={{
          '&:hover': {
            bgcolor: 'secondary.dark'
          }
        }}
      >
        Add Course
      </Button>
    </Box>
  );
}

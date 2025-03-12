import type { FC } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { Course } from '../../types';

interface CourseSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function CourseSelectionDialog({
  open,
  onClose,
  courses,
  onSelectCourse,
  searchTerm,
  onSearchChange
}: CourseSelectionDialogProps) {
  const filteredCourses = courses.filter(course =>
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select Course</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Search courses"
          type="text"
          fullWidth
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Credits</TableCell>
                <TableCell>Required</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow
                  key={course.id}
                  hover
                  onClick={() => onSelectCourse(course)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{course.code}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>{course.credits}</TableCell>
                  <TableCell>{course.is_required ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
}

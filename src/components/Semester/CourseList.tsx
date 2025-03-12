import React from 'react';
import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Course } from '../../types';
import type { FC } from 'react';

interface CourseListProps {
  courses: Course[];
  onDeleteCourse: (courseId: string) => void;
  onMoveCourse: (courseId: string, targetSemester: number) => void;
  onDragStart: (course: Course) => void;
  onDragEnd: () => void;
}

export const CourseList: FC<CourseListProps> = ({
  courses,
  onDeleteCourse,
  onMoveCourse,
  onDragStart,
  onDragEnd
}) => {
  return (
    <Collapse in={true}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Course Code</TableCell>
              <TableCell>Course Name</TableCell>
              <TableCell>Credits</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow 
                key={course.id}
                draggable
                onDragStart={() => onDragStart(course)}
                onDragEnd={onDragEnd}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: course.is_required ? 600 : 400 }}>
                    {course.code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{course.name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{course.credits}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => onMoveCourse(course.id, 0)}
                      sx={{ '&:hover': { color: 'primary.main' } }}
                    >
                      <SwapHorizIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDeleteCourse(course.id)}
                      sx={{ '&:hover': { color: 'error.main' } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {courses.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No courses in this semester
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Collapse>
  );
}

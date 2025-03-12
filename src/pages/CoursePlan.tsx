import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  Checkbox,
  Tooltip,
  Menu,
  Alert,
  Snackbar,
  Collapse
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { supabase } from '../lib/supabaseClient';
import { Course, Semester } from '../types';
import { Link } from 'react-router-dom';

export function CoursePlan() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [courseSelectionDialogOpen, setCourseSelectionDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalSemesters, setTotalSemesters] = useState(8);
  
  // Menu state for move course dropdown
  const [moveMenuAnchorEl, setMoveMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [courseToMove, setCourseToMove] = useState<{id: string, semesterId: number} | null>(null);
  const moveMenuOpen = Boolean(moveMenuAnchorEl);
  
  // Alert state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'error' | 'warning' | 'info' | 'success'>('error');

  // Collapsed state for semesters
  const [collapsedSemesters, setCollapsedSemesters] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchCoursePlan();
    fetchCourses();
  }, []);

  // Helper function to find a course by ID
  const findCourseById = (courseId: string): Course | undefined => {
    return courses.find(course => course.id === courseId);
  };

  // Helper function to check if a course exists in any semester
  const isCourseInAnyPlan = (courseId: string): boolean => {
    return semesters.some(semester => semester.courseIds.includes(courseId));
  };

  // Helper function to show alert
  const showAlert = (message: string, severity: 'error' | 'warning' | 'info' | 'success' = 'error') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  // Toggle collapse state for a semester
  const toggleSemesterCollapse = (semesterId: number) => {
    setCollapsedSemesters(prev => ({
      ...prev,
      [semesterId]: !prev[semesterId]
    }));
  };

  // Check if a semester is collapsed
  const isSemesterCollapsed = (semesterId: number): boolean => {
    return !!collapsedSemesters[semesterId];
  };

  // Collapse all semesters
  const collapseAllSemesters = () => {
    const allCollapsed: Record<number, boolean> = {};
    semesters.forEach(semester => {
      allCollapsed[semester.id] = true;
    });
    setCollapsedSemesters(allCollapsed);
  };

  // Expand all semesters
  const expandAllSemesters = () => {
    setCollapsedSemesters({});
  };

  const fetchCoursePlan = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return;

      // First, try to get existing course plan
      const { data: coursePlan, error: fetchError } = await supabase
        .from('course_plans')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching course plan:', fetchError);
        return;
      }

      if (coursePlan) {
        // Convert old format (if needed)
        const updatedSemesters = coursePlan.semesters.map((semester: any) => {
          // Check if the semester is using the old format (with courses array of Course objects)
          if (semester.courses && semester.courses.length > 0 && typeof semester.courses[0] !== 'string') {
            return {
              id: semester.id,
              courseIds: semester.courses.map((course: Course) => course.id)
            };
          }
          // Already using the new format or empty semester
          return {
            id: semester.id,
            courseIds: semester.courseIds || []
          };
        });
        
        setSemesters(updatedSemesters.slice(0, coursePlan.total_semesters));
        setTotalSemesters(coursePlan.total_semesters);
        
        // If we had to convert, update the database
        if (JSON.stringify(updatedSemesters) !== JSON.stringify(coursePlan.semesters)) {
          const { error: updateError } = await supabase
            .from('course_plans')
            .update({
              semesters: updatedSemesters
            })
            .eq('id', coursePlan.id);
            
          if (updateError) {
            console.error('Error updating course plan format:', updateError);
          }
        }
      } else {
        // No plan exists yet, create default
        const emptySemesters = Array.from({ length: 8 }, (_, i) => ({
          id: i + 1,
          courseIds: [],
        }));
        
        // Create new course plan
        const { error: insertError } = await supabase
          .from('course_plans')
          .insert({
            user_id: data.user.id,
            total_semesters: 8,
            semesters: emptySemesters,
          });
          
        if (insertError) {
          console.error('Error creating course plan:', insertError);
          return;
        }
        
        setSemesters(emptySemesters);
      }
    } catch (error) {
      console.error('Error in fetchCoursePlan:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return;

      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', data.user.id);

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        return;
      }

      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error in fetchCourses:', error);
    }
  };

  const handleSemesterCountChange = async (count: number) => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return;

      // If decreasing semesters, show warning
      if (count < totalSemesters) {
        // Check if there are courses in the semesters that will be removed
        const semestersToRemove = semesters.slice(count);
        const hasCourses = semestersToRemove.some(semester => semester.courseIds.length > 0);
        
        if (hasCourses) {
          const confirmDecrease = window.confirm(
            "WARNING: Reducing the number of semesters will permanently delete courses from the removed semesters. Are you sure you want to continue?"
          );
          
          if (!confirmDecrease) {
            return; // User canceled the operation
          }
          
          // Double-check with another confirmation
          const doubleConfirm = window.confirm(
            "This action cannot be undone. All courses in the removed semesters will be permanently deleted. Continue?"
          );
          
          if (!doubleConfirm) {
            return; // User canceled the operation
          }
        }
      }

      // Update total semesters
      setTotalSemesters(count);
      
      // Get current semesters
      let updatedSemesters = [...semesters];
      
      if (count > semesters.length) {
        // Add new semesters
        for (let i = semesters.length + 1; i <= count; i++) {
          updatedSemesters.push({
            id: i,
            courseIds: [],
          });
        }
      } else {
        // Remove semesters
        updatedSemesters = updatedSemesters.slice(0, count);
      }
      
      setSemesters(updatedSemesters);
      
      // Update in database
      const { data: coursePlan, error: fetchError } = await supabase
        .from('course_plans')
        .select('id')
        .eq('user_id', data.user.id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching course plan:', fetchError);
        return;
      }
      
      const { error: updateError } = await supabase
        .from('course_plans')
        .update({
          total_semesters: count,
          semesters: updatedSemesters,
        })
        .eq('id', coursePlan.id);
        
      if (updateError) {
        console.error('Error updating course plan:', updateError);
      }
    } catch (error) {
      console.error('Error in handleSemesterCountChange:', error);
    }
  };

  const handleAddCourse = (semesterId: number) => {
    setSelectedSemester(semesterId);
    setCourseSelectionDialogOpen(true);
  };

  const handleSelectCourse = async (course: Course) => {
    try {
      if (!selectedSemester) return;
      
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return;
      
      // Check if course already exists in any semester
      if (isCourseInAnyPlan(course.id)) {
        showAlert(`${course.code} is already in your course plan.`, 'warning');
        return;
      }
      
      // Find the semester
      const updatedSemesters = [...semesters];
      const semesterIndex = updatedSemesters.findIndex(s => s.id === selectedSemester);
      
      if (semesterIndex === -1) return;
      
      // Add course ID to semester
      updatedSemesters[semesterIndex].courseIds.push(course.id);
      setSemesters(updatedSemesters);
      
      // Update in database
      const { data: coursePlan, error: fetchError } = await supabase
        .from('course_plans')
        .select('id')
        .eq('user_id', data.user.id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching course plan:', fetchError);
        return;
      }
      
      const { error: updateError } = await supabase
        .from('course_plans')
        .update({
          semesters: updatedSemesters,
        })
        .eq('id', coursePlan.id);
        
      if (updateError) {
        console.error('Error updating course plan:', updateError);
      }
      
      showAlert(`Added ${course.code} to Semester ${selectedSemester}`, 'success');
      setCourseSelectionDialogOpen(false);
    } catch (error) {
      console.error('Error in handleSelectCourse:', error);
    }
  };

  const handleDeleteCourse = async (courseId: string, semesterId: number) => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return;
      
      // Find the semester
      const updatedSemesters = [...semesters];
      const semesterIndex = updatedSemesters.findIndex(s => s.id === semesterId);
      
      if (semesterIndex === -1) return;
      
      // Remove course ID from semester
      updatedSemesters[semesterIndex].courseIds = updatedSemesters[semesterIndex].courseIds.filter(
        id => id !== courseId
      );
      
      setSemesters(updatedSemesters);
      
      // Update in database
      const { data: coursePlan, error: fetchError } = await supabase
        .from('course_plans')
        .select('id')
        .eq('user_id', data.user.id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching course plan:', fetchError);
        return;
      }
      
      const { error: updateError } = await supabase
        .from('course_plans')
        .update({
          semesters: updatedSemesters,
        })
        .eq('id', coursePlan.id);
        
      if (updateError) {
        console.error('Error updating course plan:', updateError);
      }
    } catch (error) {
      console.error('Error in handleDeleteCourse:', error);
    }
  };

  const handleUpdateCourse = async (courseId: string, field: string, value: any) => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return;
      
      // Update the course in the courses table
      if (['grade', 'is_required'].includes(field)) {
        const { error: courseUpdateError } = await supabase
          .from('courses')
          .update({ [field]: value })
          .eq('id', courseId);
          
        if (courseUpdateError) {
          console.error('Error updating course:', courseUpdateError);
          return;
        }
        
        // Update the local courses state
        setCourses(prevCourses => 
          prevCourses.map(course => 
            course.id === courseId ? { ...course, [field]: value } : course
          )
        );
      }
    } catch (error) {
      console.error('Error in handleUpdateCourse:', error);
    }
  };

  // Handle opening the move menu
  const handleMoveMenuOpen = (event: React.MouseEvent<HTMLElement>, courseId: string, semesterId: number) => {
    setMoveMenuAnchorEl(event.currentTarget);
    setCourseToMove({ id: courseId, semesterId });
  };

  // Handle closing the move menu
  const handleMoveMenuClose = () => {
    setMoveMenuAnchorEl(null);
    setCourseToMove(null);
  };

  // Handle selecting a semester to move to
  const handleMoveTo = (toSemesterId: number) => {
    if (courseToMove) {
      handleMoveCourse(courseToMove.id, courseToMove.semesterId, toSemesterId);
    }
    handleMoveMenuClose();
  };

  const handleMoveCourse = async (courseId: string, fromSemesterId: number, toSemesterId: number) => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return;
      
      // Find the source and destination semesters
      const updatedSemesters = [...semesters];
      const fromSemesterIndex = updatedSemesters.findIndex(s => s.id === fromSemesterId);
      const toSemesterIndex = updatedSemesters.findIndex(s => s.id === toSemesterId);
      
      if (fromSemesterIndex === -1 || toSemesterIndex === -1) return;
      
      // Check if the course ID exists in the source semester
      if (!updatedSemesters[fromSemesterIndex].courseIds.includes(courseId)) return;
      
      // Remove from source semester
      updatedSemesters[fromSemesterIndex].courseIds = updatedSemesters[fromSemesterIndex].courseIds.filter(
        id => id !== courseId
      );
      
      // Add to destination semester
      updatedSemesters[toSemesterIndex].courseIds.push(courseId);
      
      setSemesters(updatedSemesters);
      
      // Update in database
      const { data: coursePlan, error: fetchError } = await supabase
        .from('course_plans')
        .select('id')
        .eq('user_id', data.user.id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching course plan:', fetchError);
        return;
      }
      
      const { error: updateError } = await supabase
        .from('course_plans')
        .update({
          semesters: updatedSemesters,
        })
        .eq('id', coursePlan.id);
        
      if (updateError) {
        console.error('Error updating course plan:', updateError);
      }
    } catch (error) {
      console.error('Error in handleMoveCourse:', error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading course plan...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 4,
        justifyContent: 'space-between'
      }}>
        <Typography variant="h4">Course Plan</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button 
            component={Link} 
            to="/browse" 
            variant="contained"
            color="primary"
          >
            Browse Courses
          </Button>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="semester-count-label">Number of Semesters</InputLabel>
            <Select
              labelId="semester-count-label"
              value={totalSemesters}
              label="Number of Semesters"
              onChange={(e) => handleSemesterCountChange(Number(e.target.value))}
            >
              {[4, 6, 8, 10, 12].map((num) => (
                <MenuItem key={num} value={num}>{num} Semesters</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          variant="outlined" 
          onClick={expandAllSemesters}
          startIcon={<ExpandMoreIcon />}
        >
          Expand All
        </Button>
        <Button 
          variant="outlined" 
          onClick={collapseAllSemesters}
          startIcon={<ExpandLessIcon />}
        >
          Collapse All
        </Button>
      </Box>

      {semesters.map((semester) => (
        <Paper key={semester.id} sx={{ mb: 4, overflow: 'hidden' }}>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'primary.main', 
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
          onClick={() => toggleSemesterCollapse(semester.id)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                size="small" 
                sx={{ color: 'white', mr: 1 }}
              >
                {isSemesterCollapsed(semester.id) ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </IconButton>
              <Typography variant="h6">
                Semester {semester.id} {semester.courseIds.length > 0 && `(${semester.courseIds.length})`}
              </Typography>
            </Box>
            <Button
              startIcon={<AddIcon />}
              onClick={(e) => {
                e.stopPropagation(); // Prevent collapse toggle
                handleAddCourse(semester.id);
              }}
              variant="contained"
              color="secondary"
            >
              Add Course
            </Button>
          </Box>
          <Collapse in={!isSemesterCollapsed(semester.id)}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course Code</TableCell>
                    <TableCell>Course Name</TableCell>
                    <TableCell align="center">Credits</TableCell>
                    <TableCell>Prerequisites</TableCell>
                    <TableCell align="center">Required</TableCell>
                    <TableCell align="center">Grade</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {semester.courseIds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No courses in this semester
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    semester.courseIds.map((courseId) => {
                      const course = findCourseById(courseId);
                      
                      if (!course) {
                        return null; // Skip if course not found
                      }
                      
                      return (
                        <TableRow key={courseId}>
                          <TableCell>{course.code}</TableCell>
                          <TableCell>{course.name}</TableCell>
                          <TableCell align="center">{course.credits}</TableCell>
                          <TableCell>
                            {course.prerequisites && course.prerequisites.length > 0 ? (
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                {course.prerequisites.map((prereq: string) => (
                                  <Chip 
                                    key={prereq} 
                                    label={prereq} 
                                    size="small" 
                                    sx={{ my: 0.5 }}
                                  />
                                ))}
                              </Stack>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                None
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox 
                              checked={course.is_required}
                              onChange={(e) => handleUpdateCourse(courseId, 'is_required', e.target.checked)}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              size="small"
                              value={course.grade || ''}
                              onChange={(e) => handleUpdateCourse(courseId, 'grade', e.target.value)}
                              sx={{ width: 60 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <Tooltip title="Move to another semester">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent collapse toggle
                                    handleMoveMenuOpen(e, courseId, semester.id);
                                  }}
                                >
                                  <SwapHorizIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Remove from plan">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent collapse toggle
                                    handleDeleteCourse(courseId, semester.id);
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </Paper>
      ))}
      
      {/* Move Course Menu */}
      <Menu
        anchorEl={moveMenuAnchorEl}
        open={moveMenuOpen}
        onClose={handleMoveMenuClose}
      >
        <Typography sx={{ px: 2, py: 1, fontWeight: 'bold' }}>
          Move to Semester:
        </Typography>
        {semesters
          .filter((s) => !courseToMove || s.id !== courseToMove.semesterId)
          .map((s) => (
            <MenuItem key={s.id} onClick={() => handleMoveTo(s.id)}>
              Semester {s.id}
            </MenuItem>
          ))}
      </Menu>
      
      {/* Course Selection Dialog */}
      <Dialog 
        open={courseSelectionDialogOpen} 
        onClose={() => setCourseSelectionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Select Course for Semester {selectedSemester}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Search courses"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              sx={{ mb: 3 }}
            />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course Code</TableCell>
                    <TableCell>Course Name</TableCell>
                    <TableCell align="center">Credits</TableCell>
                    <TableCell>Prerequisites</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courses
                    .filter(course => 
                      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      course.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((course) => {
                      const isInPlan = isCourseInAnyPlan(course.id);
                      
                      return (
                        <TableRow key={course.id}>
                          <TableCell>{course.code}</TableCell>
                          <TableCell>{course.name}</TableCell>
                          <TableCell align="center">{course.credits}</TableCell>
                          <TableCell>
                            {course.prerequisites && course.prerequisites.length > 0 ? (
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                {course.prerequisites.map((prereq) => (
                                  <Chip 
                                    key={prereq} 
                                    label={prereq} 
                                    size="small" 
                                    sx={{ my: 0.5 }}
                                  />
                                ))}
                              </Stack>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                None
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant="contained"
                              onClick={() => handleSelectCourse(course)}
                              disabled={isInPlan}
                              color={isInPlan ? "inherit" : "primary"}
                            >
                              {isInPlan ? "Already in Plan" : "Select"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCourseSelectionDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
      {/* Alert Snackbar */}
      <Snackbar 
        open={alertOpen} 
        autoHideDuration={6000} 
        onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setAlertOpen(false)} 
          severity={alertSeverity}
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import { supabase } from '../lib/supabaseClient';
import { Course, Semester } from '../types';
import { Link } from 'react-router-dom';

export function CourseBrowser() {
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [totalSemesters, setTotalSemesters] = useState(8);
  
  // Dialog states
  const [addToPlanDialogOpen, setAddToPlanDialogOpen] = useState(false);
  const [editCourseDialogOpen, setEditCourseDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  // Define an extended type for the edited course that includes prerequisites
  type EditableCourse = Partial<Course> & {
    prerequisites?: string[];
  };
  const [editedCourse, setEditedCourse] = useState<EditableCourse>({});
  const [prerequisiteInput, setPrerequisiteInput] = useState('');
  
  // Alert state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'error' | 'warning' | 'info' | 'success'>('error');

  useEffect(() => {
    fetchCourses();
    fetchCoursePlan();
  }, []);

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

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return;

      const { data: coursesData, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', data.user.id);

      if (fetchError) {
        console.error('Error fetching courses:', fetchError);
        return;
      }

      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error in fetchCourses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoursePlan = async () => {
    try {
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
        
        setSemesters(updatedSemesters);
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
        setSemesters(emptySemesters);
      }
    } catch (error) {
      console.error('Error fetching course plan:', error);
    }
  };

  const handleAddToPlan = (course: Course) => {
    setSelectedCourse(course);
    setSelectedSemester(1);
    setAddToPlanDialogOpen(true);
  };

  const handleConfirmAddToPlan = async () => {
    try {
      if (!selectedCourse) return;
      
      const { data } = await supabase.auth.getUser();
      if (!data || !data.user) return;

      // Check if course already exists in any semester
      if (isCourseInAnyPlan(selectedCourse.id)) {
        showAlert(`${selectedCourse.code} is already in your course plan.`, 'warning');
        return;
      }

      // First, check if course plan exists
      const { data: coursePlan, error: fetchError } = await supabase
        .from('course_plans')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (coursePlan) {
        // Update existing plan
        const updatedSemesters = [...coursePlan.semesters];
        const semesterIndex = updatedSemesters.findIndex(s => s.id === selectedSemester);
        
        if (semesterIndex !== -1) {
          // Initialize courseIds array if it doesn't exist
          if (!updatedSemesters[semesterIndex].courseIds) {
            updatedSemesters[semesterIndex].courseIds = [];
          }
          
          updatedSemesters[semesterIndex].courseIds.push(selectedCourse.id);
          
          const { error: updateError } = await supabase
            .from('course_plans')
            .update({
              semesters: updatedSemesters,
            })
            .eq('id', coursePlan.id);
            
          if (updateError) throw updateError;
          
          // Update local state
          setSemesters(updatedSemesters);
          showAlert(`Added ${selectedCourse.code} to Semester ${selectedSemester}`, 'success');
        }
      } else {
        // Create new plan
        const emptySemesters = Array.from({ length: 8 }, (_, i) => ({
          id: i + 1,
          courseIds: i + 1 === selectedSemester ? [selectedCourse.id] : [],
        }));
        
        const { error: insertError } = await supabase
          .from('course_plans')
          .insert({
            user_id: data.user.id,
            total_semesters: 8,
            semesters: emptySemesters,
          });
          
        if (insertError) throw insertError;
        
        // Update local state
        setSemesters(emptySemesters);
        showAlert(`Added ${selectedCourse.code} to Semester ${selectedSemester}`, 'success');
      }
      
      setAddToPlanDialogOpen(false);
    } catch (error) {
      console.error('Error adding course to plan:', error);
      showAlert('Failed to add course to plan', 'error');
    }
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setEditedCourse({ ...course });
    setEditCourseDialogOpen(true);
  };

  const handleSaveCourse = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data || !data.user) return;

      // Prepare course data
      const courseData = {
        code: editedCourse.code || '',
        name: editedCourse.name || '',
        credits: editedCourse.credits || 0,
        semester: selectedSemester,
        is_required: editedCourse.is_required || false,
        user_id: data.user.id,
        prerequisites: editedCourse.prerequisites || []
      };

      // Check if course code already exists
      const { data: existingCourses, error: checkError } = await supabase
        .from('courses')
        .select('id')
        .eq('code', courseData.code)
        .eq('user_id', data.user.id);

      if (checkError) throw checkError;

      let updatedCourseId: string;

      if (existingCourses && existingCourses.length > 0) {
        // Update existing course
        updatedCourseId = existingCourses[0].id;
        const { error: updateError } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', updatedCourseId);

        if (updateError) throw updateError;
      } else {
        // Insert new course
        const { data: insertedData, error: insertError } = await supabase
          .from('courses')
          .insert(courseData)
          .select();

        if (insertError) throw insertError;
        
        if (insertedData && insertedData.length > 0) {
          updatedCourseId = insertedData[0].id;
        }
      }

      // Refresh courses
      fetchCourses();
      
      // Reset form
      setEditedCourse({});
      setPrerequisiteInput('');
      setEditCourseDialogOpen(false);
      
      showAlert(`Course ${courseData.code} saved successfully`, 'success');
    } catch (error) {
      console.error('Error saving course:', error);
      showAlert('Failed to save course', 'error');
    }
  };

  const handleAddPrerequisite = () => {
    if (!prerequisiteInput.trim()) return;
    
    setEditedCourse(prev => {
      const currentPrereqs = prev.prerequisites || [];
      if (!currentPrereqs.includes(prerequisiteInput.trim())) {
        return {
          ...prev,
          prerequisites: [...currentPrereqs, prerequisiteInput.trim()]
        };
      }
      return prev;
    });
    
    setPrerequisiteInput('');
  };

  const handleRemovePrerequisite = (prereq: string) => {
    setEditedCourse(prev => {
      const currentPrereqs = prev.prerequisites || [];
      return {
        ...prev,
        prerequisites: currentPrereqs.filter(p => p !== prereq)
      };
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 4,
        justifyContent: 'space-between'
      }}>
        <Typography variant="h4">Course Browser</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedCourse(null);
            setEditedCourse({});
            setEditCourseDialogOpen(true);
          }}
        >
          Add New Course
        </Button>
      </Box>
      
      <Paper sx={{ mb: 4, p: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search courses by code or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography>Loading courses...</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                courses
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
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleAddToPlan(course)}
                              disabled={isInPlan}
                              color={isInPlan ? "inherit" : "primary"}
                            >
                              {isInPlan ? "In Plan" : "Add to Plan"}
                            </Button>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditCourse(course)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Add to Plan Dialog */}
      <Dialog 
        open={addToPlanDialogOpen} 
        onClose={() => setAddToPlanDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add Course to Plan
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Select a semester to add {selectedCourse?.code}: {selectedCourse?.name}
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="semester-select-label">Semester</InputLabel>
              <Select
                labelId="semester-select-label"
                value={selectedSemester}
                label="Semester"
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
              >
                {semesters.map((semester) => (
                  <MenuItem key={semester.id} value={semester.id}>
                    Semester {semester.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddToPlanDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmAddToPlan} 
            variant="contained"
          >
            Add to Plan
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Course Dialog */}
      <Dialog 
        open={editCourseDialogOpen} 
        onClose={() => setEditCourseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedCourse ? 'Edit Course' : 'Add New Course'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            mt: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            <TextField
              fullWidth
              label="Course Code"
              value={editedCourse.code || ''}
              onChange={(e) => setEditedCourse({...editedCourse, code: e.target.value})}
              required
            />
            <TextField
              fullWidth
              label="Course Name"
              value={editedCourse.name || ''}
              onChange={(e) => setEditedCourse({...editedCourse, name: e.target.value})}
              required
            />
            <TextField
              fullWidth
              label="Credits"
              type="number"
              value={editedCourse.credits || ''}
              onChange={(e) => setEditedCourse({...editedCourse, credits: Number(e.target.value)})}
              inputProps={{ min: 1, max: 6 }}
            />
            <FormControl fullWidth>
              <InputLabel id="required-label">Required</InputLabel>
              <Select
                labelId="required-label"
                value={editedCourse.is_required ? 'yes' : 'no'}
                label="Required"
                onChange={(e) => setEditedCourse({
                  ...editedCourse, 
                  is_required: e.target.value === 'yes'
                })}
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Prerequisites
              </Typography>
              <Box sx={{ 
                display: 'flex',
                gap: 1,
                mb: 2
              }}>
                <TextField
                  label="Add Prerequisite"
                  value={prerequisiteInput}
                  onChange={(e) => setPrerequisiteInput(e.target.value)}
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <Button 
                  variant="outlined"
                  onClick={handleAddPrerequisite}
                >
                  Add
                </Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {(editedCourse.prerequisites || []).map((prereq) => (
                  <Chip 
                    key={prereq} 
                    label={prereq} 
                    onDelete={() => handleRemovePrerequisite(prereq)}
                    size="small"
                    sx={{ my: 0.5 }}
                  />
                ))}
              </Stack>
              {(editedCourse.prerequisites || []).length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No prerequisites added
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCourseDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveCourse} 
            variant="contained"
            disabled={!editedCourse.code || !editedCourse.name}
          >
            Save Course
          </Button>
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

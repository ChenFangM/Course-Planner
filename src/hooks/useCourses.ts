import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Course } from '../types';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = async (course: Course) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('courses')
        .update(course)
        .eq('id', course.id);

      if (error) throw error;
      setCourses(prev => prev.map(c => c.id === course.id ? course : c));
    } catch (err) {
      setError('Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  const findCourseById = (id: string) => courses.find(c => c.id === id);

  useEffect(() => {
    fetchCourses();
  }, []);

  return {
    courses,
    loading,
    error,
    updateCourse,
    findCourseById,
    fetchCourses
  };
}

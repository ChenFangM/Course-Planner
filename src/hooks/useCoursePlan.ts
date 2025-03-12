import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Semester } from '../types';

interface CoursePlan {
  id: string;
  user_id: string;
  total_semesters: number;
  semesters: Semester[];
}

export function useCoursePlan() {
  const [coursePlan, setCoursePlan] = useState<CoursePlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoursePlan = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('course_plans')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setCoursePlan(data);
    } catch (err) {
      setError('Failed to fetch course plan');
    } finally {
      setLoading(false);
    }
  };

  const updateCoursePlan = async (semesters: Semester[]) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('course_plans')
        .update({ semesters })
        .eq('user_id', user.id);

      if (error) throw error;
      setCoursePlan(prev => prev ? { ...prev, semesters } : null);
    } catch (err) {
      setError('Failed to update course plan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursePlan();
  }, []);

  return {
    coursePlan,
    loading,
    error,
    updateCoursePlan
  };
}

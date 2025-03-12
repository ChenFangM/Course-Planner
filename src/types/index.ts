export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  is_required: boolean;
  grade?: string;
  prerequisites: string[];
  userId?: string;
}

export interface Semester {
  id: number;
  courseIds: string[]; // Changed from courses: Course[] to courseIds: string[]
}

export interface CoursePlan {
  id: string;
  userId: string;
  semesters: Semester[];
  totalSemesters: number;
  createdAt: string;
  updatedAt: string;
}

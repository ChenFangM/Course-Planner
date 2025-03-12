export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  is_required: boolean;
  prerequisites?: string[];
  grade?: string;
  semester?: number;
}

export interface Semester {
  id: number;
  courseIds: string[];
}

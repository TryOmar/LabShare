export interface CodeFile {
  id: string;
  filename: string;
  language: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  file_size: number | null;
  created_at: string;
  updated_at: string;
  downloadUrl?: string | null;
}

export interface Course {
  id: string;
  name: string;
  description: string;
}

export interface Lab {
  id: string;
  lab_number: number;
  title: string;
  course_id: string;
  courses?: Course;
}

export interface Submission {
  id: string;
  title: string;
  student_id: string;
  lab_id: string;
  view_count: number;
  upvote_count?: number;
  user_has_upvoted?: boolean;
  created_at: string;
  updated_at: string;
  is_anonymous?: boolean;
  students?: {
    id: string;
    name: string;
    email: string;
  };
  labs?: Lab;
}

export interface Student {
  id: string;
  name: string;
  email: string;
}

export interface Track {
  id: string;
  code: string;
  name: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  status: { id: number; description: string };
  time: string;
  memory: number;
  message?: string;
}

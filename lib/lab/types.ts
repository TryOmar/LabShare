export interface Course {
  id: string;
  name: string;
  description: string;
}

export interface Lab {
  id: string;
  course_id: string;
  lab_number: number;
  title: string;
  description: string;
  courses?: Course;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  track_id: string;
}

export interface Track {
  id: string;
  code: string;
  name: string;
}

export interface Submission {
  id: string;
  title: string;
  student_id: string;
  view_count: number;
  upvote_count?: number;
  is_anonymous?: boolean;
  students?: Student;
}

export interface PastedCodeFile {
  filename: string;
  language: string;
  content: string;
}

export type UploadFile = 
  | { filename: string; language: string; content: string }
  | { filename: string; mimeType: string; base64: string };


import type {
  Submission,
  CodeFile,
  Attachment,
  Student,
  Track,
  ExecutionResult,
} from "./types";

export interface AccessStatus {
  hasFullAccess: boolean;
  isLoggedIn: boolean;
  requiresLogin: boolean;
  requiresSubmission: boolean;
  userSubmissionId: string | null;
  labId: string;
}

export interface SubmissionData {
  submission: Submission;
  student: Student | null;
  track: Track | null;
  isOwner: boolean;
  isAdmin: boolean;
  codeFiles: CodeFile[];
  attachments: Attachment[];
  accessStatus?: AccessStatus;
}

export interface UpdateCodeFileData {
  filename: string;
  content: string;
  language: string;
}

export interface RunCodeData {
  code: string;
  language: string;
  stdin: string;
}

export interface UploadFile {
  filename: string;
  language?: string;
  content?: string;
  mimeType?: string;
  base64?: string;
}

/**
 * Fetch submission data from the API
 * Now public - returns submission with accessStatus indicating if user can view full content
 */
export async function fetchSubmission(
  submissionId: string
): Promise<SubmissionData> {
  const response = await fetch(`/api/submission/${submissionId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to load submission: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Update submission anonymity setting
 */
export async function updateSubmissionAnonymity(
  submissionId: string,
  isAnonymous: boolean
): Promise<Submission> {
  const response = await fetch(`/api/submission/${submissionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      isAnonymous,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to update submission anonymity");
  }

  const data = await response.json();
  return data.submission;
}

/**
 * Move submission to a different lab
 */
export async function moveSubmission(
  submissionId: string,
  targetLabId: string
): Promise<{ submission: Submission; message: string }> {
  const response = await fetch(`/api/submission/${submissionId}/move`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      targetLabId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to move submission");
  }

  const data = await response.json();
  return { submission: data.submission, message: data.message };
}

/**
 * Update submission title (rename submission)
 */
export async function updateSubmissionTitle(
  submissionId: string,
  title: string
): Promise<Submission> {
  const response = await fetch(`/api/submission/${submissionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      title,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update submission title");
  }

  const data = await response.json();
  return data.submission;
}

/**
 * Update code file (filename, content, language)
 */
export async function updateCodeFile(
  submissionId: string,
  codeFileId: string,
  data: UpdateCodeFileData
): Promise<void> {
  const response = await fetch(
    `/api/submission/${submissionId}/code/${codeFileId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update code file");
  }
}

/**
 * Rename code file
 */
export async function renameCodeFile(
  submissionId: string,
  codeFileId: string,
  filename: string
): Promise<void> {
  const response = await fetch(
    `/api/submission/${submissionId}/code/${codeFileId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        filename,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to rename code file");
  }
}

/**
 * Delete code file
 */
export async function deleteCodeFile(
  submissionId: string,
  codeFileId: string
): Promise<void> {
  const response = await fetch(
    `/api/submission/${submissionId}/code/${codeFileId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete code file");
  }
}

/**
 * Rename attachment
 */
export async function renameAttachment(
  submissionId: string,
  attachmentId: string,
  filename: string
): Promise<void> {
  const response = await fetch(
    `/api/submission/${submissionId}/attachment/${attachmentId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        filename,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to rename attachment");
  }
}

/**
 * Delete attachment
 */
export async function deleteAttachment(
  submissionId: string,
  attachmentId: string
): Promise<void> {
  const response = await fetch(
    `/api/submission/${submissionId}/attachment/${attachmentId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete attachment");
  }
}

/**
 * Toggle upvote on submission
 */
export async function toggleUpvote(
  submissionId: string
): Promise<{ upvoteCount: number; upvoted: boolean }> {
  const response = await fetch(`/api/submission/${submissionId}/upvote`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to toggle upvote");
  }

  const data = await response.json();
  return data;
}

/**
 * Delete submission
 */
export async function deleteSubmission(submissionId: string): Promise<void> {
  const response = await fetch(`/api/submission/${submissionId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to delete submission");
  }
}

/**
 * Run code execution
 */
export async function runCode(data: RunCodeData): Promise<ExecutionResult> {
  const response = await fetch("/api/code/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to execute code");
  }

  const result = await response.json();
  return result;
}

/**
 * Upload files to submission
 */
export async function uploadFiles(
  submissionId: string,
  files: UploadFile[]
): Promise<void> {
  const response = await fetch(`/api/submission/${submissionId}/files`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      files,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to add files");
  }
}

/**
 * Get auth status (for navigation)
 */
export async function getAuthStatus(): Promise<{
  authenticated: boolean;
  student?: Student;
}> {
  const response = await fetch("/api/auth/status", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    return { authenticated: false };
  }

  const data = await response.json();
  return data;
}

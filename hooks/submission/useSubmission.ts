import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type {
  Submission,
  CodeFile,
  Attachment,
  Student,
  Track,
} from "@/lib/submission/types";
import { fetchSubmission, getAuthStatus, type AccessStatus } from "@/lib/submission/api";

interface UseSubmissionResult {
  submission: Submission | null;
  codeFiles: CodeFile[];
  attachments: Attachment[];
  selectedCodeFile: CodeFile | null;
  selectedAttachment: Attachment | null;
  student: Student | null;
  track: Track | null;
  isOwner: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string;
  accessStatus: AccessStatus | null;
  setSubmission: (submission: Submission | null) => void;
  setSelectedCodeFile: (file: CodeFile | null) => void;
  setSelectedAttachment: (attachment: Attachment | null) => void;
  reloadSubmission: () => Promise<void>;
}

export function useSubmission(submissionId: string): UseSubmissionResult {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedCodeFile, setSelectedCodeFile] = useState<CodeFile | null>(
    null
  );
  const [selectedAttachment, setSelectedAttachment] =
    useState<Attachment | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const router = useRouter();

  const loadSubmission = async () => {
    try {
      const data = await fetchSubmission(submissionId);

      setSubmission(data.submission);
      setStudent(data.student);
      setTrack(data.track);
      setIsOwner(data.isOwner);
      setIsAdmin(data.isAdmin || false);
      setCodeFiles(data.codeFiles || []);
      setAttachments(data.attachments || []);
      setAccessStatus(data.accessStatus || null);

      // Set selected file (prefer code file, then attachment)
      if (data.codeFiles && data.codeFiles.length > 0) {
        setSelectedCodeFile(data.codeFiles[0]);
        setSelectedAttachment(null);
      } else if (data.attachments && data.attachments.length > 0) {
        setSelectedAttachment(data.attachments[0]);
        setSelectedCodeFile(null);
      }
    } catch (err) {
      console.error("Error loading submission:", err);

      if (err instanceof Error) {
        // Handle 404 - submission not found
        if (err.message.includes("not found")) {
          setError("Submission not found");
          setLoading(false);
          return;
        }
      }
      // On other errors, set generic error
      setError("Failed to load submission");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmission();
  }, [submissionId]);

  const reloadSubmission = async () => {
    try {
      const data = await fetchSubmission(submissionId);
      setCodeFiles(data.codeFiles || []);
      setAttachments(data.attachments || []);

      // Update selected file if it still exists
      if (selectedCodeFile) {
        const updatedFile = data.codeFiles?.find(
          (f: CodeFile) => f.id === selectedCodeFile.id
        );
        if (updatedFile) {
          setSelectedCodeFile(updatedFile);
        } else if (data.codeFiles && data.codeFiles.length > 0) {
          setSelectedCodeFile(data.codeFiles[0]);
        } else {
          setSelectedCodeFile(null);
        }
      }

      if (selectedAttachment) {
        const updatedAttachment = data.attachments?.find(
          (a: Attachment) => a.id === selectedAttachment.id
        );
        if (updatedAttachment) {
          setSelectedAttachment(updatedAttachment);
        } else if (data.attachments && data.attachments.length > 0) {
          setSelectedAttachment(data.attachments[0]);
        } else {
          setSelectedAttachment(null);
        }
      }
    } catch (err) {
      console.error("Error reloading submission:", err);
      throw err; // Let the caller handle the error (they might want to show toast)
    }
  };

  return {
    submission,
    codeFiles,
    attachments,
    selectedCodeFile,
    selectedAttachment,
    student,
    track,
    isOwner,
    isAdmin,
    loading,
    error,
    accessStatus,
    setSubmission,
    setSelectedCodeFile,
    setSelectedAttachment,
    reloadSubmission,
  };
}


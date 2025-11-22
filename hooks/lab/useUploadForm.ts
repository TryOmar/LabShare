import { useState, useCallback } from "react";
import { getRandomSolutionName } from "@/lib/lab/uploadUtils";
import { processFilesForUpload, validateUploadFiles } from "@/lib/lab/uploadUtils";
import type { UploadFile } from "@/lib/lab/types";
import type { PastedCodeFile } from "@/lib/lab/types";

interface UseUploadFormOptions {
  labId: string;
  files: File[];
  pastedCodeFiles: PastedCodeFile[];
  onSuccess: () => void;
  onError: (error: string) => void;
}

interface UseUploadFormResult {
  title: string;
  isAnonymous: boolean;
  loading: boolean;
  error: string;
  setTitle: (title: string) => void;
  setIsAnonymous: (anonymous: boolean) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * Hook for managing upload form state and submission
 */
export function useUploadForm({
  labId,
  files,
  pastedCodeFiles,
  onSuccess,
  onError,
}: UseUploadFormOptions): UseUploadFormResult {
  const [title, setTitle] = useState(getRandomSolutionName());
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate title - if user deleted the default, require them to enter one
      if (!title.trim() || title.trim() === "") {
        setError("Solution name is required");
        setLoading(false);
        return;
      }

      let filesToUpload: UploadFile[] = [];

      // Add pasted code files
      filesToUpload.push(...pastedCodeFiles);

      // Process uploaded/dropped files
      if (files.length > 0) {
        const processedFiles = await processFilesForUpload(files);
        filesToUpload.push(...processedFiles);
      }

      // Validate that we have at least one file
      if (filesToUpload.length === 0) {
        setError("Please add at least one file");
        setLoading(false);
        return;
      }

      // Check for duplicate filenames (case-insensitive)
      const validation = validateUploadFiles(filesToUpload);
      
      if (!validation.isValid) {
        setError(`Duplicate filenames detected: ${validation.duplicates.join(', ')}. Please remove duplicates before uploading.`);
        setLoading(false);
        return;
      }

      // Upload submission via API route (server-side validation)
      // Note: studentId is not sent - it's validated from the cookie server-side
      const response = await fetch("/api/submission/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          labId,
          title,
          files: filesToUpload,
          isAnonymous: isAnonymous,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload submission");
      }

      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [labId, title, isAnonymous, files, pastedCodeFiles, onSuccess, onError]);

  return {
    title,
    isAnonymous,
    loading,
    error,
    setTitle,
    setIsAnonymous,
    handleSubmit,
  };
}


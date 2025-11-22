import { useState, useCallback } from "react";
import type { PastedCodeFile } from "@/lib/lab/types";
import { findDuplicateFilenames } from "@/lib/lab/fileUtils";

interface UseFileUploadResult {
  files: File[];
  pastedCodeFiles: PastedCodeFile[];
  error: string;
  addFiles: (newFiles: File[]) => void;
  removeFile: (index: number) => void;
  removePastedCodeFile: (index: number) => void;
  addPastedCodeFile: (file: PastedCodeFile) => void;
  setError: (error: string) => void;
  clearFiles: () => void;
}

/**
 * Hook for managing file uploads (both File objects and pasted code files)
 */
export function useFileUpload(): UseFileUploadResult {
  const [files, setFiles] = useState<File[]>([]);
  const [pastedCodeFiles, setPastedCodeFiles] = useState<PastedCodeFile[]>([]);
  const [error, setError] = useState("");

  // Add files to the list (avoid duplicates)
  const addFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => {
      // Check against both existing files and pasted code files
      const existingFileNames = new Set(prev.map(f => f.name.toLowerCase()));
      const existingPastedNames = new Set(pastedCodeFiles.map(f => f.filename.toLowerCase()));
      const allExistingNames = new Set([...existingFileNames, ...existingPastedNames]);
      
      const uniqueNewFiles = newFiles.filter(f => !allExistingNames.has(f.name.toLowerCase()));
      
      if (uniqueNewFiles.length < newFiles.length) {
        const duplicates = newFiles.filter(f => allExistingNames.has(f.name.toLowerCase()));
        setError(`Skipped ${newFiles.length - uniqueNewFiles.length} duplicate file(s): ${duplicates.map(f => f.name).join(', ')}`);
      } else {
        setError("");
      }
      
      return [...prev, ...uniqueNewFiles];
    });
  }, [pastedCodeFiles]);

  // Remove file from list
  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Remove pasted code file
  const removePastedCodeFile = useCallback((index: number) => {
    setPastedCodeFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Add pasted code file with duplicate checking
  const addPastedCodeFile = useCallback((file: PastedCodeFile) => {
    setPastedCodeFiles(prev => {
      const existingFileNames = new Set(files.map(f => f.name.toLowerCase()));
      const existingPastedNames = new Set(prev.map(f => f.filename.toLowerCase()));
      const allExistingNames = new Set([...existingFileNames, ...existingPastedNames]);
      
      if (allExistingNames.has(file.filename.toLowerCase())) {
        setError(`A file with the name "${file.filename}" already exists. Please use a different name.`);
        return prev;
      }
      
      setError("");
      return [...prev, file];
    });
  }, [files]);

  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([]);
    setPastedCodeFiles([]);
    setError("");
  }, []);

  return {
    files,
    pastedCodeFiles,
    error,
    addFiles,
    removeFile,
    removePastedCodeFile,
    addPastedCodeFile,
    setError,
    clearFiles,
  };
}


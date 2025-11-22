import { useCallback } from "react";
import type { CodeFile, Attachment } from "@/lib/submission/types";

interface UseFileSelectionProps {
  setSelectedCodeFile: (file: CodeFile | null) => void;
  setSelectedAttachment: (attachment: Attachment | null) => void;
  resetPreviews: () => void;
  resetExecution: () => void;
  resetAllEditing: () => void;
}

interface UseFileSelectionResult {
  handleSelectCodeFile: (file: CodeFile) => void;
  handleSelectAttachment: (attachment: Attachment) => void;
  handleResetPreview: () => void;
}

/**
 * Hook to manage file selection with automatic state resets
 */
export function useFileSelection({
  setSelectedCodeFile,
  setSelectedAttachment,
  resetPreviews,
  resetExecution,
  resetAllEditing,
}: UseFileSelectionProps): UseFileSelectionResult {
  const handleSelectCodeFile = useCallback(
    (file: CodeFile) => {
      setSelectedCodeFile(file);
      setSelectedAttachment(null);
      resetPreviews();
      resetExecution();
      resetAllEditing();
    },
    [setSelectedCodeFile, setSelectedAttachment, resetPreviews, resetExecution, resetAllEditing]
  );

  const handleSelectAttachment = useCallback(
    (attachment: Attachment) => {
      setSelectedAttachment(attachment);
      setSelectedCodeFile(null);
      resetPreviews();
      resetExecution();
      resetAllEditing();
    },
    [setSelectedCodeFile, setSelectedAttachment, resetPreviews, resetExecution, resetAllEditing]
  );

  const handleResetPreview = useCallback(() => {
    resetPreviews();
    resetExecution();
  }, [resetPreviews, resetExecution]);

  return {
    handleSelectCodeFile,
    handleSelectAttachment,
    handleResetPreview,
  };
}


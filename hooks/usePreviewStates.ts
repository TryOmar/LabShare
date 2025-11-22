import { useState, useEffect } from "react";
import type { CodeFile, Attachment } from "@/lib/submission/types";
import { isImageAttachment } from "@/lib/submission/utils";

interface UsePreviewStatesProps {
  selectedCodeFile: CodeFile | null;
  selectedAttachment: Attachment | null;
}

interface UsePreviewStatesResult {
  showHtmlPreview: boolean;
  showImagePreview: boolean;
  toggleHtmlPreview: () => void;
  toggleImagePreview: () => void;
  resetPreviews: () => void;
}

/**
 * Hook to manage preview states with automatic reset logic
 */
export function usePreviewStates({
  selectedCodeFile,
  selectedAttachment,
}: UsePreviewStatesProps): UsePreviewStatesResult {
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  // Reset HTML preview when selected file is not HTML
  useEffect(() => {
    if (
      selectedCodeFile &&
      selectedCodeFile.language.toLowerCase() !== "html"
    ) {
      setShowHtmlPreview(false);
    }
  }, [selectedCodeFile]);

  // Reset image preview when selected attachment is not an image or when switching to code file
  useEffect(() => {
    if (selectedAttachment && !isImageAttachment(selectedAttachment)) {
      setShowImagePreview(false);
    }
    if (selectedCodeFile) {
      setShowImagePreview(false);
    }
  }, [selectedAttachment, selectedCodeFile]);

  const toggleHtmlPreview = () => {
    setShowHtmlPreview((prev) => !prev);
  };

  const toggleImagePreview = () => {
    setShowImagePreview((prev) => !prev);
  };

  const resetPreviews = () => {
    setShowHtmlPreview(false);
    setShowImagePreview(false);
  };

  return {
    showHtmlPreview,
    showImagePreview,
    toggleHtmlPreview,
    toggleImagePreview,
    resetPreviews,
  };
}


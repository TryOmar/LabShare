import { useState, useEffect, useRef } from "react";
import { detectLanguageFromContent } from "@/lib/lab/uploadUtils";

interface UsePasteHandlerResult {
  showPasteArea: boolean;
  pastedContent: string;
  pastedFileName: string;
  language: string;
  setPastedContent: (content: string) => void;
  setPastedFileName: (name: string) => void;
  setLanguage: (lang: string) => void;
  setShowPasteArea: (show: boolean) => void;
  handleTextareaPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  handleCancelPaste: () => void;
  pasteTextareaRef: React.RefObject<HTMLTextAreaElement>;
}

interface UsePasteHandlerOptions {
  onFilesPasted: (files: File[]) => void;
  showPasteArea: boolean;
  setShowPasteArea: (show: boolean) => void;
}

/**
 * Hook for handling paste events (Ctrl+V) for files/images and text
 */
export function usePasteHandler({
  onFilesPasted,
  showPasteArea,
  setShowPasteArea,
}: UsePasteHandlerOptions): UsePasteHandlerResult {
  const [pastedContent, setPastedContent] = useState("");
  const [pastedFileName, setPastedFileName] = useState("");
  const [language, setLanguage] = useState("text");
  const pasteTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      // Don't interfere if user is pasting into the textarea itself (let normal paste behavior happen)
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) {
        return;
      }

      // Check for images first (clipboard images)
      const filesToAdd: File[] = [];
      let hasText = false;
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Check for image files (from clipboard)
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            filesToAdd.push(file);
          }
        } else if (item.kind === 'string' && item.type === 'text/plain') {
          hasText = true;
        }
      }

      // If images found, add them as attachments
      if (filesToAdd.length > 0) {
        e.preventDefault();
        onFilesPasted(filesToAdd);
      } else if (hasText) {
        // If text is pasted, open text area and paste text directly
        e.preventDefault();
        
        // Get text content synchronously from clipboard
        const textContent = e.clipboardData?.getData('text/plain') || '';
        
        // Open paste area if not already open
        if (!showPasteArea) {
          setShowPasteArea(true);
        }
        
        // Wait a bit for textarea to be available, then set the text
        setTimeout(() => {
          if (textContent) {
            setPastedContent(textContent);
            // Auto-detect language from pasted content
            const detectedLang = detectLanguageFromContent(textContent);
            setLanguage(detectedLang);
            pasteTextareaRef.current?.focus();
            // Move cursor to end
            if (pasteTextareaRef.current) {
              const textarea = pasteTextareaRef.current;
              textarea.setSelectionRange(textarea.value.length, textarea.value.length);
            }
          }
        }, 10);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [showPasteArea, onFilesPasted, setShowPasteArea]);

  // Handle text paste in textarea - let normal paste behavior happen
  const handleTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Normal paste behavior is allowed - React will handle it automatically
    // We don't need to do anything special here
  };

  // Cancel paste area
  const handleCancelPaste = () => {
    setShowPasteArea(false);
    setPastedContent("");
    setPastedFileName("");
  };

  return {
    showPasteArea,
    pastedContent,
    pastedFileName,
    language,
    setPastedContent,
    setPastedFileName,
    setLanguage,
    setShowPasteArea,
    handleTextareaPaste,
    handleCancelPaste,
    pasteTextareaRef,
  };
}


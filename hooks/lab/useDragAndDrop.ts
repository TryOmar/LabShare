import { useState, useEffect, useRef } from "react";

interface UseDragAndDropResult {
  isDragging: boolean;
  isDraggingOverPage: boolean;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
}

/**
 * Hook for managing drag and drop functionality
 * Handles both local drop zone and global page-level drag detection
 */
export function useDragAndDrop(): UseDragAndDropResult {
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingOverPage, setIsDraggingOverPage] = useState(false);
  const dragCounterRef = useRef(0);

  // Global drag handlers for page-level drag detection
  useEffect(() => {
    const handleGlobalDragEnter = (e: DragEvent) => {
      // Only show overlay if dragging files (not text/elements)
      if (e.dataTransfer?.types.includes('Files')) {
        dragCounterRef.current++;
        if (dragCounterRef.current === 1) {
          setIsDraggingOverPage(true);
        }
      }
    };

    const handleGlobalDragLeave = (e: DragEvent) => {
      // Only decrement if we're actually leaving the document
      // Check if we're leaving to a point outside the viewport
      if (e.clientX === 0 && e.clientY === 0) {
        dragCounterRef.current = 0;
        setIsDraggingOverPage(false);
      } else {
        dragCounterRef.current--;
        if (dragCounterRef.current <= 0) {
          dragCounterRef.current = 0;
          setIsDraggingOverPage(false);
        }
      }
    };

    const handleGlobalDragOver = (e: DragEvent) => {
      // Only prevent default if dragging files
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
      }
    };

    const handleGlobalDrop = (e: DragEvent) => {
      // Reset counter when files are dropped anywhere
      dragCounterRef.current = 0;
      setIsDraggingOverPage(false);
    };

    // Add event listeners to document
    document.addEventListener('dragenter', handleGlobalDragEnter);
    document.addEventListener('dragleave', handleGlobalDragLeave);
    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('drop', handleGlobalDrop);

    return () => {
      document.removeEventListener('dragenter', handleGlobalDragEnter);
      document.removeEventListener('dragleave', handleGlobalDragLeave);
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  // Drag and drop handlers for the drop zone
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're actually leaving the drop zone
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setIsDraggingOverPage(false);
    dragCounterRef.current = 0;
  };

  return {
    isDragging,
    isDraggingOverPage,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
}


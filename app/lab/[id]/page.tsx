"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from 'next/navigation';
import Navigation from "@/components/navigation";
import { detectLanguage } from "@/lib/language-detection";

interface Lab {
  id: string;
  course_id: string;
  lab_number: number;
  title: string;
  description: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  track_id: string;
}

interface Track {
  id: string;
  code: string;
  name: string;
}

interface Submission {
  id: string;
  title: string;
  student_id: string;
  view_count: number;
  students?: Student;
}

export default function LabPage() {
  const [lab, setLab] = useState<Lab | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userSubmission, setUserSubmission] = useState<Submission | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const params = useParams();
  const labId = params.id as string;

  // Store referrer when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const referrer = document.referrer;
      const currentPath = window.location.pathname;
      
      // Always try to get a valid referrer
      if (referrer && referrer.includes(window.location.origin)) {
        try {
          const referrerPath = new URL(referrer).pathname;
          // Only store if referrer is different from current page
          if (referrerPath !== currentPath && referrerPath !== `/lab/${labId}`) {
            sessionStorage.setItem('labPageReferrer', referrerPath);
          } else {
            // If referrer is same as current page, default to dashboard
            sessionStorage.setItem('labPageReferrer', '/dashboard');
          }
        } catch (e) {
          // If URL parsing fails, default to dashboard
          sessionStorage.setItem('labPageReferrer', '/dashboard');
        }
      } else {
        // No referrer or external referrer - always default to dashboard
        sessionStorage.setItem('labPageReferrer', '/dashboard');
      }
    }
  }, [labId]);

  useEffect(() => {
    // Check if upload=true is in query params
    const searchParams = new URLSearchParams(window.location.search);
    const shouldUpload = searchParams.get("upload") === "true";
    
    if (shouldUpload) {
      setShowUploadModal(true);
      // Remove the query param from URL
      router.replace(`/lab/${labId}`, { scroll: false });
    }
  }, [labId, router]);

  useEffect(() => {
    const loadLabData = async () => {
      try {
        // Check if this is an upload request
        const searchParams = new URLSearchParams(window.location.search);
        const isUploadRequest = searchParams.get("upload") === "true";
        
        // Fetch lab data from API route (server-side validation)
        const url = isUploadRequest 
          ? `/api/lab/${labId}?upload=true`
          : `/api/lab/${labId}`;
        
        const response = await fetch(url, {
          method: "GET",
          credentials: "include", // Include cookies
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Unauthorized - redirect to login
            router.push("/login");
            return;
          }
          if (response.status === 403) {
            // Access denied - lab is locked
            const errorData = await response.json().catch(() => ({}));
            setError(errorData.error || "Access denied. You must submit a solution for this lab before accessing it.");
            setLoading(false);
            // Still try to get student data for navigation
            try {
              const authResponse = await fetch("/api/auth/status", {
                method: "GET",
                credentials: "include",
              });
              if (authResponse.ok) {
                const authData = await authResponse.json();
                if (authData.authenticated && authData.student) {
                  setStudent(authData.student);
                }
              }
            } catch (err) {
              // Ignore auth errors
            }
            return;
          }
          throw new Error(`Failed to load lab: ${response.statusText}`);
        }

        const data = await response.json();
        
        setLab(data.lab);
        setStudent(data.student);
        setTrack(data.track);
        setUserSubmission(data.userSubmission);
        setSubmissions(data.submissions || []);
      } catch (err) {
        console.error("Error loading lab:", err);
        // On error, redirect to login as a fallback
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadLabData();
  }, [labId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-black">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Navigation student={student} track={track} />
        <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
          <div className="border-2 border-red-500 bg-red-50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => router.push("/labs")}
              className="px-4 py-2 bg-black text-white font-semibold hover:bg-gray-800"
            >
              Back to Labs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navigation student={student} track={track} />

      <div className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        {/* Lab Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2 break-words">
            Lab {lab?.lab_number}: {lab?.title}
          </h1>
          {lab?.description && (
            <p className="text-sm sm:text-base text-gray-600 break-words">{lab.description}</p>
          )}
        </div>

        {/* Action Bar */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-black text-white font-semibold hover:bg-gray-800"
          >
            {userSubmission ? "Edit Submission" : "Upload Solution"}
          </button>
          {userSubmission && (
            <button
              onClick={() => router.push(`/submission/${userSubmission.id}`)}
              className="px-4 sm:px-6 py-2 text-sm sm:text-base border border-black text-black font-semibold hover:bg-gray-50"
            >
              View My Solution
            </button>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <UploadModal
            labId={labId}
            onClose={(shouldNavigateBack = false) => {
              setShowUploadModal(false);
              if (shouldNavigateBack) {
                // Navigate back to previous page or dashboard when canceling
                const referrer = sessionStorage.getItem('labPageReferrer');
                const currentPath = window.location.pathname;
                
                // Check if we have a valid referrer that's different from current page
                if (referrer && referrer !== currentPath && referrer.startsWith('/') && referrer !== `/lab/${labId}`) {
                  router.push(referrer);
                } else {
                  // Default to dashboard
                  router.push('/dashboard');
                }
              } else {
                // After successful upload, reload the page to refresh lab data
                window.location.href = `/lab/${labId}`;
              }
            }}
          />
        )}

        {/* Submissions List */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-black mb-3 sm:mb-4">
            Solutions ({submissions.length})
          </h2>
          {submissions.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  onClick={() => router.push(`/submission/${submission.id}`)}
                  className="border border-black p-3 sm:p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-black break-words">
                        {submission.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 break-words">
                        by {submission.students?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {submission.students?.id === student?.id && (
                        <span className="text-xs bg-gray-100 px-2 py-1 border border-black whitespace-nowrap">
                          Your Solution
                        </span>
                      )}
                      <span className="text-xs bg-gray-100 px-2 py-1 border border-black whitespace-nowrap">
                        {submission.view_count} {submission.view_count === 1 ? 'view' : 'views'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm sm:text-base text-gray-600">No solutions uploaded yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface UploadModalProps {
  labId: string;
  onClose: (shouldNavigateBack?: boolean) => void;
}

function UploadModal({ labId, onClose }: UploadModalProps) {
  // Array of random solution name variations
  const randomSolutionNames = [
    "Solution",
    "Approach",
    "Submission",
    "Lab",
    "Task",
    "Assignment",
    "Implementation",
    "Method",
    "Answer",
    "Response",
    "Attempt",
    "Draft",
    "Work",
    "Result",
    "Entry",
    "Try",
    "Effort",
    "Take",
    "Way",
    "Path",
    "Plan",
    "Idea",
    "Fix",
    "Reply",
    "Turn",
    "Shot",
    "Go",
    "Run",
    "Pass",
    "Hit",
    "Crack",
    "Break",
    "Win",
    "Nail",
    "Smash",
    "Crush",
    "Rock",
    "Boss",
    "Beast",
    "Fire",
    "Wave",
    "Vibe",
    "Move",
    "Flex",
    "Show"
  ];

  // Get a random solution name on mount
  const getRandomSolutionName = () => {
    return randomSolutionNames[Math.floor(Math.random() * randomSolutionNames.length)];
  };

  const [title, setTitle] = useState(getRandomSolutionName());
  const [pastedContent, setPastedContent] = useState("");
  const [pastedFileName, setPastedFileName] = useState("");
  const [language, setLanguage] = useState("text");
  const [files, setFiles] = useState<File[]>([]);
  const [pastedCodeFiles, setPastedCodeFiles] = useState<Array<{ filename: string; language: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingOverPage, setIsDraggingOverPage] = useState(false);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const pasteTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const dragCounterRef = React.useRef(0);

  const detectedLanguages: Record<string, string> = {
    ".js": "javascript",
    ".ts": "typescript",
    ".py": "python",
    ".cpp": "cpp",
    ".c": "c",
    ".java": "java",
    ".cs": "csharp",
    ".php": "php",
    ".rb": "ruby",
    ".go": "go",
    ".rs": "rust",
    ".txt": "text",
    ".sql": "SQL",
    ".html": "HTML",
    ".css": "CSS",
  };

  const codeExtensions = ['.js', '.ts', '.py', '.cpp', '.c', '.java', '.cs', '.php', '.rb', '.go', '.rs', '.txt', '.sql', '.html', '.css'];

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Add files to the list (avoid duplicates)
  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => {
      const existingNames = new Set(prev.map(f => f.name));
      const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));
      return [...prev, ...uniqueNewFiles];
    });
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  // Global drag handlers for page-level drag detection
  React.useEffect(() => {
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

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  };

  // Handle paste (Ctrl+V) for files/images and text
  React.useEffect(() => {
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
        addFiles(filesToAdd);
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
            const detectedLang = detectLanguage(textContent);
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
  }, [showPasteArea]);

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

  // Add pasted code as a file
  const handleAddPastedCode = () => {
    if (!pastedContent.trim()) {
      setError("Please paste some code first");
      return;
    }
    
    const filename = pastedFileName.trim() || `code.${language}`;
    setPastedCodeFiles(prev => [...prev, {
      filename,
      language,
      content: pastedContent,
    }]);
    
    setPastedContent("");
    setPastedFileName("");
    setError("");
  };

  // Remove file from list
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      let filesToUpload: Array<
        | { filename: string; language: string; content: string }
        | { filename: string; mimeType: string; base64: string }
      > = [];

      // Add pasted code files
      filesToUpload.push(...pastedCodeFiles);

      // Process uploaded/dropped files
      if (files.length > 0) {
        for (const file of files) {
          const ext = "." + file.name.split(".").pop()?.toLowerCase();
          
          // Check if it's a code file
          if (codeExtensions.includes(ext)) {
            // Parse as code file
            const content = await file.text();
            const detectedLang = detectedLanguages[ext] || "text";

            filesToUpload.push({
              filename: file.name,
              language: detectedLang,
              content,
            });
          } else {
            // Convert to base64 for attachment
            const base64 = await fileToBase64(file);
            filesToUpload.push({
              filename: file.name,
              mimeType: file.type || 'application/octet-stream',
              base64: base64,
            });
          }
        }
      }

      // Validate that we have at least one file
      if (filesToUpload.length === 0) {
        setError("Please add at least one file");
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload submission");
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // Remove pasted code file
  const removePastedCodeFile = (index: number) => {
    setPastedCodeFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle backdrop click - only close if clicking directly on backdrop, not modal content
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the backdrop (not on modal content)
    // Don't close if user has text selected (they might be selecting text in an input)
    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().length > 0;
    
    if (e.target === e.currentTarget && !hasSelection) {
      onClose();
    }
  };

  return (
    <>
      {/* Global drag overlay - appears when dragging files anywhere on the page */}
      {isDraggingOverPage && (
        <div 
          className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-md z-[60] flex items-center justify-center pointer-events-none animate-in fade-in duration-200"
        >
          <div className="bg-white border-4 border-black border-dashed p-12 max-w-2xl mx-4 shadow-2xl transform transition-all duration-200 scale-105 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <svg 
                className="mx-auto h-16 w-16 text-black mb-4 animate-bounce" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
              <h3 className="text-lg sm:text-2xl font-bold text-black mb-2">Drop files to upload</h3>
              <p className="text-sm sm:text-base text-gray-600">Release to add files to your submission</p>
            </div>
          </div>
        </div>
      )}

      <div 
        className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
        onClick={handleBackdropClick}
      >
        <div 
          className="bg-white border border-black p-4 sm:p-6 max-w-lg w-full my-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
        <h2 className="text-xl sm:text-2xl font-bold text-black mb-3 sm:mb-4">Upload Solution</h2>

        <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="space-y-3 sm:space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm sm:text-base text-black font-semibold mb-2">Solution Name</label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onMouseMove={(e) => e.stopPropagation()}
              onSelect={(e) => e.stopPropagation()}
              onDragStart={(e) => e.stopPropagation()}
              className="w-full px-3 py-2 text-sm sm:text-base border border-black bg-white text-black"
              required
            />
          </div>

          {/* Combined Upload & Paste Box */}
          <div>
            <label className="block text-sm sm:text-base text-black font-semibold mb-2">Files & Code</label>
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed p-4 sm:p-6 lg:p-8 transition-all duration-200 ${
                isDragging 
                  ? 'border-black bg-gray-100 scale-105 shadow-lg' 
                  : 'border-black bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-center">
                {isDragging ? (
                  <>
                    <svg 
                      className="mx-auto h-12 w-12 text-black mb-3 animate-pulse" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                      />
                    </svg>
                    <p className="text-lg font-semibold text-black mb-1">
                      Drop files here
                    </p>
                    <p className="text-sm text-gray-600">
                      Release to upload
                    </p>
                  </>
                ) : (
                  <>
                    <svg 
                      className="mx-auto h-10 w-10 text-gray-400 mb-3" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                      />
                    </svg>
                    <p className="text-sm text-black mb-2">
                      <span className="font-semibold">Drag files here</span> or{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-black hover:text-gray-700 underline font-medium"
                      >
                        browse
                      </button>
                      {' '}or{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasteArea(true);
                          setTimeout(() => pasteTextareaRef.current?.focus(), 10);
                        }}
                        className="text-black hover:text-gray-700 underline font-medium"
                      >
                        paste code
                      </button>
                    </p>
                    <p className="text-xs text-gray-500">
                      Press Ctrl+V to paste files or code
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="*/*"
              />

              {/* Paste Code Area - Only show when user clicks paste or presses Ctrl+V */}
              {showPasteArea && (
                <div className="space-y-2 mt-3 border-t border-black pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-black font-semibold">Paste Code</label>
                    <button
                      type="button"
                      onClick={handleCancelPaste}
                      className="text-xs text-gray-600 hover:text-black underline"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    ref={pasteTextareaRef}
                    value={pastedContent}
                    onChange={(e) => {
                      const newContent = e.target.value;
                      setPastedContent(newContent);
                      // Auto-detect language as user types/pastes
                      if (newContent.trim().length > 10) {
                        const detectedLang = detectLanguage(newContent);
                        setLanguage(detectedLang);
                      }
                    }}
                    onPaste={handleTextareaPaste}
                    placeholder="Paste code here (Ctrl+V)..."
                    rows={4}
                    className="w-full px-3 py-2 border border-black bg-white text-black font-mono text-xs"
                  />
                  {pastedContent && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pastedFileName}
                        onChange={(e) => setPastedFileName(e.target.value)}
                        placeholder="File name (optional)"
                        className="flex-1 px-3 py-2 border border-black bg-white text-black text-sm"
                      />
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="px-3 py-2 border border-black bg-white text-black text-sm"
                      >
                        <option value="text">text</option>
                        {Object.entries(detectedLanguages)
                          .filter(([ext, lang]) => lang !== "text") // Remove duplicate "text"
                          .map(([ext, lang]) => (
                            <option key={ext} value={lang}>
                              {lang}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          handleAddPastedCode();
                          // Keep paste area open for next paste
                          setPastedContent("");
                          setPastedFileName("");
                          pasteTextareaRef.current?.focus();
                        }}
                        className="px-4 py-2 bg-black text-white font-semibold hover:bg-gray-800 text-sm"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* File List */}
          {(files.length > 0 || pastedCodeFiles.length > 0) && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {pastedCodeFiles.map((file, index) => (
                <div
                  key={`pasted-${index}`}
                  className="flex items-center justify-between p-2 border border-black bg-white"
                >
                  <span className="text-xs text-black truncate flex-1">📄 {file.filename}</span>
                  <button
                    type="button"
                    onClick={() => removePastedCodeFile(index)}
                    className="ml-2 text-black hover:text-red-600 text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
              {files.map((file, index) => {
                const ext = "." + file.name.split(".").pop()?.toLowerCase();
                const isCodeFile = codeExtensions.includes(ext);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border border-black bg-white"
                  >
                    <span className="text-xs text-black truncate flex-1">
                      {isCodeFile ? '📄' : '📎'} {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 text-black hover:text-red-600 text-sm"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div>
              <p className="text-red-600 text-sm">{error}</p>
              {error.toLowerCase().includes('mime type') && error.toLowerCase().includes('not supported') && (
                <p className="text-xs text-gray-600 mt-1">
                  Think this should be fixed? <a href="https://github.com/TryOmar/LabShare/issues/new" target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-700 underline">Open an issue</a> or <a href="https://forms.gle/25mEvcjTPrhA6THf9" target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-700 underline">report it</a>.
                </p>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || (files.length === 0 && pastedCodeFiles.length === 0)}
              className="flex-1 bg-black text-white font-semibold py-2 sm:py-2.5 text-sm sm:text-base hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
            <button
              type="button"
              onClick={() => onClose(true)}
              className="flex-1 border border-black text-black font-semibold py-2 sm:py-2.5 text-sm sm:text-base hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}

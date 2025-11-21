"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Navigation from "@/components/navigation";
import CommentsSection from "@/components/comments-section";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { formatDateTime } from "@/lib/utils";
import { detectLanguage } from "@/lib/language-detection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface CodeFile {
  id: string;
  filename: string;
  language: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface Attachment {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  file_size: number | null;
  created_at: string;
  updated_at: string;
  downloadUrl?: string | null;
}

interface Course {
  id: string;
  name: string;
  description: string;
}

interface Lab {
  id: string;
  lab_number: number;
  title: string;
  course_id: string;
  courses?: Course;
}

interface Submission {
  id: string;
  title: string;
  student_id: string;
  lab_id: string;
  view_count: number;
  upvote_count?: number;
  user_has_upvoted?: boolean;
  created_at: string;
  updated_at: string;
  is_anonymous?: boolean;
  students?: {
    id: string;
    name: string;
    email: string;
  };
  labs?: Lab;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Track {
  id: string;
  code: string;
  name: string;
}

const languageColors: Record<string, string> = {
  javascript: "bg-yellow-100 text-yellow-800",
  typescript: "bg-blue-100 text-blue-800",
  python: "bg-blue-100 text-blue-800",
  cpp: "bg-purple-100 text-purple-800",
  c: "bg-gray-100 text-gray-800",
  java: "bg-orange-100 text-orange-800",
  csharp: "bg-green-100 text-green-800",
  php: "bg-indigo-100 text-indigo-800",
  ruby: "bg-red-100 text-red-800",
  go: "bg-cyan-100 text-cyan-800",
  rust: "bg-red-100 text-red-800",
  text: "bg-gray-100 text-gray-800",
  SQL: "bg-blue-100 text-white-800",
  HTML: "bg-orange-100 text-red-800",
  CSS: "bg-blue-100 text-blue-800",
};

// Map incoming language strings (from API) to Prism language identifiers
const mapLanguageToPrism = (lang?: string) => {
  if (!lang) return "text";
  const l = lang.toLowerCase();
  if (l === "c++" || l === "cpp") return "cpp";
  if (l === "c#" || l === "csharp") return "csharp";
  if (l === "ts" || l === "tsx" || l === "typescript") return "typescript";
  if (l === "js" || l === "jsx" || l === "javascript") return "javascript";
  if (l === "py" || l === "python") return "python";
  if (l === "sql") return "sql";
  if (l === "html") return "html";
  if (l === "java") return "java";
  if (l === "php") return "php";
  if (l === "ruby") return "ruby";
  if (l === "go") return "go";
  if (l === "rust") return "rust";
  if (l === "text" || l === "plain") return "text";
  return l; // fallback: try the provided value
};

// Add Files Modal Component
interface AddFilesModalProps {
  submissionId: string;
  onClose: () => void;
}

function AddFilesModal({ submissionId, onClose }: AddFilesModalProps) {
  const [pastedContent, setPastedContent] = useState("");
  const [pastedFileName, setPastedFileName] = useState("");
  const [language, setLanguage] = useState("text");
  const [files, setFiles] = useState<File[]>([]);
  const [pastedCodeFiles, setPastedCodeFiles] = useState<
    Array<{ filename: string; language: string; content: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const pasteTextareaRef = React.useRef<HTMLTextAreaElement>(null);

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

  const codeExtensions = [
    ".js",
    ".ts",
    ".py",
    ".cpp",
    ".c",
    ".java",
    ".cs",
    ".php",
    ".rb",
    ".go",
    ".rs",
    ".txt",
    ".sql",
    ".html",
    ".css",
  ];

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const uniqueNewFiles = newFiles.filter((f) => !existingNames.has(f.name));
      return [...prev, ...uniqueNewFiles];
    });
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  };

  // Handle paste (Ctrl+V)
  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "TEXTAREA" || target.tagName === "INPUT")
      ) {
        return;
      }

      const filesToAdd: File[] = [];
      let hasText = false;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            filesToAdd.push(file);
          }
        } else if (item.kind === "string" && item.type === "text/plain") {
          hasText = true;
        }
      }

      if (filesToAdd.length > 0) {
        e.preventDefault();
        addFiles(filesToAdd);
      } else if (hasText) {
        e.preventDefault();
        const textContent = e.clipboardData?.getData("text/plain") || "";
        if (!showPasteArea) {
          setShowPasteArea(true);
        }
        setTimeout(() => {
          if (textContent) {
            setPastedContent(textContent);
            const detectedLang = detectLanguage(textContent);
            setLanguage(detectedLang);
            pasteTextareaRef.current?.focus();
            if (pasteTextareaRef.current) {
              const textarea = pasteTextareaRef.current;
              textarea.setSelectionRange(
                textarea.value.length,
                textarea.value.length
              );
            }
          }
        }, 10);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [showPasteArea]);

  const handleAddPastedCode = () => {
    if (!pastedContent.trim()) {
      setError("Please paste some code first");
      return;
    }

    const filename = pastedFileName.trim() || `code.${language}`;
    setPastedCodeFiles((prev) => [
      ...prev,
      {
        filename,
        language,
        content: pastedContent,
      },
    ]);

    setPastedContent("");
    setPastedFileName("");
    setError("");
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removePastedCodeFile = (index: number) => {
    setPastedCodeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let filesToUpload: Array<
        | { filename: string; language: string; content: string }
        | { filename: string; mimeType: string; base64: string }
      > = [];

      filesToUpload.push(...pastedCodeFiles);

      if (files.length > 0) {
        for (const file of files) {
          const ext = "." + file.name.split(".").pop()?.toLowerCase();

          if (codeExtensions.includes(ext)) {
            const content = await file.text();
            const detectedLang = detectedLanguages[ext] || "text";
            filesToUpload.push({
              filename: file.name,
              language: detectedLang,
              content,
            });
          } else {
            const base64 = await fileToBase64(file);
            filesToUpload.push({
              filename: file.name,
              mimeType: file.type || "application/octet-stream",
              base64: base64,
            });
          }
        }
      }

      if (filesToUpload.length === 0) {
        setError("Please add at least one file");
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/submission/${submissionId}/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          files: filesToUpload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add files");
      }

      toast.success("Files added successfully!");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add files");
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-gradient-card border border-border/50 p-5 sm:p-7 max-w-lg w-full max-h-[90vh] overflow-y-auto my-4 rounded-2xl shadow-modern-xl backdrop-blur-sm animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-5 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Add Files
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-foreground font-semibold mb-2">
              Files & Code
            </label>
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 transition-all duration-300 ${
                isDragging
                  ? "border-primary bg-primary/10 scale-105 shadow-primary-lg"
                  : "border-border/50 bg-white/80 hover:bg-accent/30 hover:border-primary/40 shadow-modern backdrop-blur-sm"
              }`}
            >
              <div className="text-center">
                <p className="text-sm text-foreground mb-1">
                  Drag files here or{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:text-primary/80 underline transition-colors duration-200"
                  >
                    browse
                  </button>{" "}
                  or{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasteArea(true);
                      setTimeout(() => pasteTextareaRef.current?.focus(), 10);
                    }}
                    className="text-primary hover:text-primary/80 underline transition-colors duration-200"
                  >
                    paste code
                  </button>
                </p>
                <p className="text-xs text-muted-foreground">
                  Press Ctrl+V to paste files or code
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="*/*"
              />

              {showPasteArea && (
                <div className="space-y-2 mt-4 border-t border-border/30 pt-4">
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="text-sm text-foreground font-semibold">
                      Paste Code
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasteArea(false);
                        setPastedContent("");
                        setPastedFileName("");
                      }}
                      className="text-xs text-muted-foreground hover:text-primary underline transition-colors duration-200"
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
                      if (newContent.trim().length > 10) {
                        const detectedLang = detectLanguage(newContent);
                        setLanguage(detectedLang);
                      }
                    }}
                    placeholder="Paste code here (Ctrl+V)..."
                    rows={4}
                    className="w-full px-4 py-3 border border-border/50 bg-white/80 text-foreground font-mono text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 shadow-modern"
                  />
                  {pastedContent && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pastedFileName}
                        onChange={(e) => setPastedFileName(e.target.value)}
                        placeholder="File name (optional)"
                        className="flex-1 px-3 py-2 border border-border/50 bg-white/80 text-foreground text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                      />
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="px-3 py-2 border border-border/50 bg-white/80 text-foreground text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                      >
                        <option value="text">text</option>
                        {Object.entries(detectedLanguages)
                          .filter(([ext, lang]) => lang !== "text")
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
                          setPastedContent("");
                          setPastedFileName("");
                          pasteTextareaRef.current?.focus();
                        }}
                        className="px-4 py-2 gradient-primary text-primary-foreground font-semibold hover:gradient-primary-hover rounded-lg transition-all duration-300 shadow-primary hover:shadow-primary-lg text-sm"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {(files.length > 0 || pastedCodeFiles.length > 0) && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {pastedCodeFiles.map((file, index) => (
                <div
                  key={`pasted-${index}`}
                  className="flex items-center justify-between p-2.5 border border-border/50 bg-white/80 rounded-lg backdrop-blur-sm"
                >
                  <span className="text-xs text-foreground truncate flex-1">
                    📄 {file.filename}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePastedCodeFile(index)}
                    className="ml-2 text-muted-foreground hover:text-destructive text-sm transition-colors duration-200"
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
                    className="flex items-center justify-between p-2.5 border border-border/50 bg-white/80 rounded-lg backdrop-blur-sm"
                  >
                    <span className="text-xs text-foreground truncate flex-1">
                      {isCodeFile ? "📄" : "📎"} {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 text-muted-foreground hover:text-destructive text-sm transition-colors duration-200"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div className="animate-slide-up">
              <p className="text-destructive text-sm font-medium">{error}</p>
              {error.toLowerCase().includes("mime type") &&
                error.toLowerCase().includes("not supported") && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Think this should be fixed?{" "}
                    <a
                      href="https://github.com/TryOmar/LabShare/issues/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 underline transition-colors duration-200"
                    >
                      Open an issue
                    </a>{" "}
                    or{" "}
                    <a
                      href="https://forms.gle/25mEvcjTPrhA6THf9"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 underline transition-colors duration-200"
                    >
                      report it
                    </a>
                    .
                  </p>
                )}
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={
                loading || (files.length === 0 && pastedCodeFiles.length === 0)
              }
              className="flex-1 gradient-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-primary hover:shadow-primary-lg"
            >
              {loading ? "Adding..." : "Add Files"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border/50 text-foreground font-semibold py-2.5 rounded-lg hover:bg-accent/50 hover:border-primary/40 hover:text-primary transition-all duration-300 shadow-modern hover:shadow-primary/10 backdrop-blur-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SubmissionPage() {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Editing states
  const [editingCodeFileId, setEditingCodeFileId] = useState<string | null>(
    null
  );
  const [renamingCodeFileId, setRenamingCodeFileId] = useState<string | null>(
    null
  );
  const [renamingAttachmentId, setRenamingAttachmentId] = useState<
    string | null
  >(null);
  const [showAddFilesModal, setShowAddFilesModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null); // For 3-dot menu

  // Edit form states for code files
  const [editCodeFilename, setEditCodeFilename] = useState("");
  const [editCodeContent, setEditCodeContent] = useState("");
  const [editCodeLanguage, setEditCodeLanguage] = useState("");

  // Rename states (inline in sidebar)
  const [renameCodeFilename, setRenameCodeFilename] = useState("");
  const [renameAttachmentFilename, setRenameAttachmentFilename] = useState("");

  // Comments refresh key - increment to trigger comment reload
  const [commentsRefreshKey, setCommentsRefreshKey] = useState(0);

  // Delete dialog states
  const [deleteSubmissionDialogOpen, setDeleteSubmissionDialogOpen] =
    useState(false);
  const [deleteCodeFileDialogOpen, setDeleteCodeFileDialogOpen] =
    useState(false);
  const [deleteAttachmentDialogOpen, setDeleteAttachmentDialogOpen] =
    useState(false);
  const [codeFileToDelete, setCodeFileToDelete] = useState<{
    id: string;
    filename: string;
  } | null>(null);
  const [attachmentToDelete, setAttachmentToDelete] = useState<{
    id: string;
    filename: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);

  const router = useRouter();
  const params = useParams();
  const submissionId = params.id as string;

  useEffect(() => {
    const loadSubmission = async () => {
      try {
        // Fetch submission data from API route (server-side validation)
        const response = await fetch(`/api/submission/${submissionId}`, {
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
            // Access denied - user hasn't solved this lab
            const errorData = await response.json().catch(() => ({}));
            setError(
              errorData.error ||
                "Access denied. You must submit a solution for this lab before viewing other submissions."
            );
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
          throw new Error(`Failed to load submission: ${response.statusText}`);
        }

        const data = await response.json();

        setSubmission(data.submission);
        setStudent(data.student);
        setTrack(data.track);
        setIsOwner(data.isOwner);
        setCodeFiles(data.codeFiles || []);
        setAttachments(data.attachments || []);

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
        // On error, redirect to login as a fallback
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadSubmission();
  }, [submissionId, router]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".menu-container")) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openMenuId]);

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleToggleAnonymity = async (currentValue: boolean) => {
    if (!submission) return;

    try {
      const response = await fetch(`/api/submission/${submissionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          isAnonymous: !currentValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update submission anonymity");
      }

      const data = await response.json();
      setSubmission(data.submission);
      toast.success("Anonymity setting updated");
    } catch (err) {
      console.error("Error updating submission anonymity:", err);
      toast.error("Failed to update anonymity setting. Please try again.");
    }
  };

  // Reload submission data
  const reloadSubmission = async () => {
    try {
      const response = await fetch(`/api/submission/${submissionId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to load submission: ${response.statusText}`);
      }

      const data = await response.json();
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
      toast.error("Failed to reload submission data");
    }
  };

  // Start editing code file (content in preview area)
  const startEditCodeFile = (file: CodeFile) => {
    // Select the file if it's not already selected
    setSelectedCodeFile(file);
    setSelectedAttachment(null);
    // Start editing
    setEditingCodeFileId(file.id);
    setEditCodeFilename(file.filename);
    setEditCodeContent(file.content);
    setEditCodeLanguage(file.language);
    setRenamingCodeFileId(null);
    setRenamingAttachmentId(null);
    setOpenMenuId(null);
  };

  // Cancel editing code file
  const cancelEditCodeFile = () => {
    setEditingCodeFileId(null);
    setEditCodeFilename("");
    setEditCodeContent("");
    setEditCodeLanguage("");
  };

  // Start renaming code file (inline in sidebar)
  const startRenameCodeFile = (file: CodeFile) => {
    setRenamingCodeFileId(file.id);
    setRenameCodeFilename(file.filename);
    setEditingCodeFileId(null);
    setRenamingAttachmentId(null);
    setOpenMenuId(null);
  };

  // Cancel renaming code file
  const cancelRenameCodeFile = () => {
    setRenamingCodeFileId(null);
    setRenameCodeFilename("");
  };

  // Save code file rename
  const saveCodeFileRename = async () => {
    if (!renamingCodeFileId) return;

    try {
      const response = await fetch(
        `/api/submission/${submissionId}/code/${renamingCodeFileId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            filename: renameCodeFilename,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to rename code file");
      }

      toast.success("File renamed successfully!");
      cancelRenameCodeFile();
      await reloadSubmission();
      setCommentsRefreshKey((prev) => prev + 1); // Refresh comments
    } catch (err) {
      console.error("Error renaming code file:", err);
      toast.error(err instanceof Error ? err.message : "Failed to rename file");
    }
  };

  // Save code file changes
  const saveCodeFile = async () => {
    if (!editingCodeFileId) return;

    try {
      const response = await fetch(
        `/api/submission/${submissionId}/code/${editingCodeFileId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            filename: editCodeFilename,
            content: editCodeContent,
            language: editCodeLanguage,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update code file");
      }

      toast.success("Code file updated successfully!");
      cancelEditCodeFile();
      await reloadSubmission();
      setCommentsRefreshKey((prev) => prev + 1); // Refresh comments
    } catch (err) {
      console.error("Error updating code file:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update code file"
      );
    }
  };

  // Delete code file
  const handleDeleteCodeFileClick = (fileId: string, filename: string) => {
    setCodeFileToDelete({ id: fileId, filename });
    setDeleteCodeFileDialogOpen(true);
  };

  const deleteCodeFile = async () => {
    if (!codeFileToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/submission/${submissionId}/code/${codeFileToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete code file");
      }

      toast.success("Code file deleted successfully!");
      if (selectedCodeFile?.id === codeFileToDelete.id) {
        setSelectedCodeFile(null);
      }
      setDeleteCodeFileDialogOpen(false);
      setCodeFileToDelete(null);
      await reloadSubmission();
      setCommentsRefreshKey((prev) => prev + 1); // Refresh comments
    } catch (err) {
      console.error("Error deleting code file:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete code file"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Start renaming attachment (inline in sidebar)
  const startRenameAttachment = (attachment: Attachment) => {
    setRenamingAttachmentId(attachment.id);
    setRenameAttachmentFilename(attachment.filename);
    setRenamingCodeFileId(null);
    setEditingCodeFileId(null);
    setOpenMenuId(null);
  };

  // Cancel renaming attachment
  const cancelRenameAttachment = () => {
    setRenamingAttachmentId(null);
    setRenameAttachmentFilename("");
  };

  // Save attachment rename
  const saveAttachmentRename = async () => {
    if (!renamingAttachmentId) return;

    try {
      const response = await fetch(
        `/api/submission/${submissionId}/attachment/${renamingAttachmentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            filename: renameAttachmentFilename,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to rename attachment");
      }

      toast.success("Attachment renamed successfully!");
      cancelRenameAttachment();
      await reloadSubmission();
      setCommentsRefreshKey((prev) => prev + 1); // Refresh comments
    } catch (err) {
      console.error("Error renaming attachment:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to rename attachment"
      );
    }
  };

  // Delete attachment
  const handleDeleteAttachmentClick = (
    attachmentId: string,
    filename: string
  ) => {
    setAttachmentToDelete({ id: attachmentId, filename });
    setDeleteAttachmentDialogOpen(true);
  };

  const deleteAttachment = async () => {
    if (!attachmentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/submission/${submissionId}/attachment/${attachmentToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete attachment");
      }

      toast.success("Attachment deleted successfully!");
      if (selectedAttachment?.id === attachmentToDelete.id) {
        setSelectedAttachment(null);
      }
      setDeleteAttachmentDialogOpen(false);
      setAttachmentToDelete(null);
      await reloadSubmission();
      setCommentsRefreshKey((prev) => prev + 1); // Refresh comments
    } catch (err) {
      console.error("Error deleting attachment:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete attachment"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle upvote with optimistic update
  const handleToggleUpvote = async () => {
    if (!submission || isOwner || isUpvoting) return;

    // Store previous state for potential rollback
    const previousSubmission = { ...submission };
    const previousUpvoteCount = submission.upvote_count || 0;
    const previousUserHasUpvoted = submission.user_has_upvoted || false;

    // Optimistically update UI immediately
    const newUpvoteCount = previousUserHasUpvoted
      ? previousUpvoteCount - 1
      : previousUpvoteCount + 1;
    const newUserHasUpvoted = !previousUserHasUpvoted;

    setSubmission({
      ...submission,
      upvote_count: newUpvoteCount,
      user_has_upvoted: newUserHasUpvoted,
    });
    setIsUpvoting(true);

    try {
      const response = await fetch(`/api/submission/${submissionId}/upvote`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to toggle upvote");
      }

      const data = await response.json();

      // Update with server response to ensure consistency
      setSubmission({
        ...submission,
        upvote_count: data.upvoteCount,
        user_has_upvoted: data.upvoted,
      });
    } catch (err) {
      console.error("Error toggling upvote:", err);

      // Revert to previous state on error
      setSubmission(previousSubmission);

      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to toggle upvote. Please try again."
      );
    } finally {
      setIsUpvoting(false);
    }
  };

  // Delete submission
  const deleteSubmission = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/submission/${submissionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete submission");
      }

      // Show success message and redirect to labs page
      toast.success("Submission deleted successfully!");
      router.push("/labs");
    } catch (err) {
      console.error("Error deleting submission:", err);
      toast.error("Failed to delete submission. Please try again.");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-white to-accent/20 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="spinner h-5 w-5"></div>
          <p className="text-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-white via-white to-accent/10 animate-fade-in">
        <Navigation student={student} track={track} />
        <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
          <div className="border-2 border-destructive/50 bg-destructive/10 rounded-xl p-6 sm:p-8 shadow-modern-lg animate-slide-up backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-destructive"
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
              <h2 className="text-xl font-bold text-destructive">
                Access Denied
              </h2>
            </div>
            <p className="text-destructive/90 mb-5 leading-relaxed">{error}</p>
            <button
              onClick={() => router.push("/labs")}
              className="px-5 py-2.5 gradient-primary text-primary-foreground font-semibold rounded-lg hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-primary hover:shadow-primary-lg"
            >
              Back to Labs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-white via-white to-accent/10 animate-fade-in">
      <Navigation student={student} track={track} />

      <div className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        {/* Breadcrumb Navigation */}
        {submission?.labs?.courses && submission?.labs && (
          <div className="mb-4 sm:mb-6 animate-slide-up">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href={`/labs?course=${submission.labs.courses.id}`}
                      className="hover:text-primary transition-colors duration-200"
                    >
                      {submission.labs.courses.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href={`/lab/${submission.labs.id}`}
                      className="hover:text-primary transition-colors duration-200"
                    >
                      Lab {submission.labs.lab_number}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{submission.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 sm:mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {submission?.title}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 break-words">
                by{" "}
                {submission?.is_anonymous && !isOwner
                  ? "Anonymous"
                  : submission?.students?.name || "Unknown"}
              </p>
            </div>
            {isOwner && (
              <button
                onClick={() => router.back()}
                className="px-4 sm:px-5 py-2.5 text-sm sm:text-base border border-border/50 text-foreground font-semibold rounded-lg hover:bg-accent/50 hover:border-primary/40 hover:text-primary whitespace-nowrap flex-shrink-0 transition-all duration-300 shadow-modern hover:shadow-primary/10 backdrop-blur-sm"
              >
                Back
              </button>
            )}
          </div>

          {/* Metadata */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4 flex-wrap items-center">
            <span>{submission?.view_count} views</span>
            <span className="break-words">
              Created:{" "}
              {submission?.created_at && formatDateTime(submission.created_at)}
            </span>
            {/* Upvote Button */}
            {!isOwner && (
              <button
                onClick={handleToggleUpvote}
                disabled={isUpvoting}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  submission?.user_has_upvoted
                    ? "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
                    : "bg-accent/50 text-muted-foreground border border-border/50 hover:bg-accent hover:border-primary/40 hover:text-primary"
                } ${
                  isUpvoting
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 ${
                    submission?.user_has_upvoted ? "fill-current" : ""
                  }`}
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                <span className="font-medium">
                  {submission?.upvote_count || 0}
                </span>
              </button>
            )}
            {isOwner && (
              <>
                <span className="break-words">
                  Last edited:{" "}
                  {submission?.updated_at &&
                    formatDateTime(submission.updated_at)}
                </span>
                <div className="flex items-center gap-2">
                  <Switch
                    id="submission-anonymous-toggle"
                    checked={submission?.is_anonymous || false}
                    onCheckedChange={() =>
                      handleToggleAnonymity(submission?.is_anonymous || false)
                    }
                  />
                  <Label
                    htmlFor="submission-anonymous-toggle"
                    className="text-xs sm:text-sm text-muted-foreground cursor-pointer"
                  >
                    Anonymous
                  </Label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="w-full lg:w-auto">
            {/* Add Files Button - Single button above both sections */}
            {isOwner && (
              <div className="mb-4">
                <button
                  onClick={() => setShowAddFilesModal(true)}
                  className="w-full px-4 py-2.5 border border-border/50 bg-white/80 text-foreground hover:bg-accent/50 hover:border-primary/40 hover:text-primary text-sm font-semibold rounded-lg transition-all duration-300 shadow-modern hover:shadow-primary/10 backdrop-blur-sm"
                >
                  + Add Files
                </button>
              </div>
            )}

            {/* Code Files List */}
            {codeFiles.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Code Files
                </h3>
                <div className="space-y-2">
                  {codeFiles.map((file) => (
                    <div key={file.id} className="relative">
                      {renamingCodeFileId === file.id ? (
                        // Inline rename mode
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={renameCodeFilename}
                            onChange={(e) =>
                              setRenameCodeFilename(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                saveCodeFileRename();
                              } else if (e.key === "Escape") {
                                cancelRenameCodeFile();
                              }
                            }}
                            onBlur={(e) => {
                              // Only save on blur if the related target is not the cancel button
                              const relatedTarget =
                                e.relatedTarget as HTMLElement;
                              if (
                                !relatedTarget ||
                                !relatedTarget.closest(
                                  "button[data-cancel-rename]"
                                )
                              ) {
                                saveCodeFileRename();
                              }
                            }}
                            autoFocus
                            className="flex-1 px-2.5 py-1.5 border border-border/50 text-xs bg-white/80 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                          />
                          <button
                            onClick={saveCodeFileRename}
                            className="px-2.5 py-1.5 gradient-primary text-primary-foreground text-xs rounded-lg hover:gradient-primary-hover transition-all duration-200 shadow-primary"
                          >
                            ✓
                          </button>
                          <button
                            data-cancel-rename
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent blur event
                            }}
                            onClick={cancelRenameCodeFile}
                            className="px-2.5 py-1.5 border border-border/50 text-foreground text-xs rounded-lg hover:bg-accent/50 hover:border-primary/40 transition-all duration-200 shadow-modern"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        // View mode with 3-dot menu
                        <div className="relative flex items-center">
                          <button
                            onClick={() => {
                              setSelectedCodeFile(file);
                              setSelectedAttachment(null);
                              setOpenMenuId(null);
                            }}
                            className={`flex-1 text-left p-2.5 border rounded-lg text-xs truncate pr-8 transition-all duration-200 ${
                              selectedCodeFile?.id === file.id
                                ? "gradient-primary text-primary-foreground border-primary shadow-primary"
                                : "bg-white/80 text-foreground border-border/50 hover:bg-accent/50 hover:border-primary/40 shadow-modern backdrop-blur-sm"
                            }`}
                            title={file.filename}
                          >
                            📄 {file.filename}
                          </button>
                          {isOwner && (
                            <div className="absolute right-1 z-10">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                      selectedCodeFile?.id === file.id
                                        ? "text-white hover:bg-gray-700"
                                        : "text-foreground hover:bg-accent/50"
                                    }`}
                                    title="Options"
                                    style={{
                                      fontSize: "12px",
                                      lineHeight: "1",
                                      letterSpacing: "1px",
                                    }}
                                  >
                                    •••
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-gradient-card border border-border/50 shadow-modern-lg min-w-[120px] p-1 rounded-lg backdrop-blur-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditCodeFile(file);
                                    }}
                                    className="text-xs cursor-pointer focus:bg-accent/50 hover:bg-accent/30 rounded-md transition-colors duration-200"
                                  >
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startRenameCodeFile(file);
                                    }}
                                    className="text-xs cursor-pointer focus:bg-accent/50 hover:bg-accent/30 rounded-md transition-colors duration-200"
                                  >
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCodeFileClick(
                                        file.id,
                                        file.filename
                                      );
                                    }}
                                    className="text-xs cursor-pointer focus:bg-destructive/10 hover:bg-destructive/10 text-destructive rounded-md transition-colors duration-200"
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div>
                <h3 className="font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Attachments
                </h3>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="relative">
                      {renamingAttachmentId === attachment.id ? (
                        // Inline rename mode
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={renameAttachmentFilename}
                            onChange={(e) =>
                              setRenameAttachmentFilename(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                saveAttachmentRename();
                              } else if (e.key === "Escape") {
                                cancelRenameAttachment();
                              }
                            }}
                            onBlur={(e) => {
                              // Only save on blur if the related target is not the cancel button
                              const relatedTarget =
                                e.relatedTarget as HTMLElement;
                              if (
                                !relatedTarget ||
                                !relatedTarget.closest(
                                  "button[data-cancel-rename]"
                                )
                              ) {
                                saveAttachmentRename();
                              }
                            }}
                            autoFocus
                            className="flex-1 px-2.5 py-1.5 border border-border/50 text-xs bg-white/80 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                          />
                          <button
                            onClick={saveAttachmentRename}
                            className="px-2.5 py-1.5 gradient-primary text-primary-foreground text-xs rounded-lg hover:gradient-primary-hover transition-all duration-200 shadow-primary"
                          >
                            ✓
                          </button>
                          <button
                            data-cancel-rename
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent blur event
                            }}
                            onClick={cancelRenameAttachment}
                            className="px-2.5 py-1.5 border border-border/50 text-foreground text-xs rounded-lg hover:bg-accent/50 hover:border-primary/40 transition-all duration-200 shadow-modern"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        // View mode with 3-dot menu
                        <div className="relative flex items-center">
                          <button
                            onClick={() => {
                              setSelectedAttachment(attachment);
                              setSelectedCodeFile(null);
                              setOpenMenuId(null);
                            }}
                            className={`flex-1 text-left p-2.5 border rounded-lg text-xs truncate pr-8 transition-all duration-200 ${
                              selectedAttachment?.id === attachment.id
                                ? "gradient-primary text-primary-foreground border-primary shadow-primary"
                                : "bg-white/80 text-foreground border-border/50 hover:bg-accent/50 hover:border-primary/40 shadow-modern backdrop-blur-sm"
                            }`}
                            title={attachment.filename}
                          >
                            📎 {attachment.filename}
                          </button>
                          {isOwner && (
                            <div className="absolute right-1 z-10">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                      selectedAttachment?.id === attachment.id
                                        ? "text-white hover:bg-gray-700"
                                        : "text-foreground hover:bg-accent/50"
                                    }`}
                                    title="Options"
                                    style={{
                                      fontSize: "12px",
                                      lineHeight: "1",
                                      letterSpacing: "1px",
                                    }}
                                  >
                                    •••
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-gradient-card border border-border/50 shadow-modern-lg min-w-[120px] p-1 rounded-lg backdrop-blur-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startRenameAttachment(attachment);
                                    }}
                                    className="text-xs cursor-pointer focus:bg-accent/50 hover:bg-accent/30 rounded-md transition-colors duration-200"
                                  >
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAttachmentClick(
                                        attachment.id,
                                        attachment.filename
                                      );
                                    }}
                                    className="text-xs cursor-pointer focus:bg-destructive/10 hover:bg-destructive/10 text-destructive rounded-md transition-colors duration-200"
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {codeFiles.length === 0 && attachments.length === 0 && !isOwner && (
              <div className="text-muted-foreground text-sm">No files</div>
            )}
          </div>

          {/* Code Viewer + Attachments + Comments */}
          <div className="lg:col-span-3 space-y-6 w-full min-w-0">
            {/* Code File Viewer */}
            {selectedCodeFile ? (
              // View/Edit mode (inline editing like GitHub)
              <div className="border border-border/50 rounded-xl overflow-hidden shadow-modern backdrop-blur-sm bg-gradient-card w-full min-w-0">
                {/* File Header */}
                <div
                  className={`bg-muted/50 border-b border-border/30 p-3 sm:p-4 flex justify-between rounded-t-xl ${
                    editingCodeFileId === selectedCodeFile.id
                      ? "items-start"
                      : "items-center"
                  }`}
                >
                  <div className="flex-1 pr-4 min-w-0">
                    {editingCodeFileId === selectedCodeFile.id ? (
                      // Edit mode - show filename input and language selector
                      <div className="space-y-2 w-full">
                        <input
                          type="text"
                          value={editCodeFilename}
                          onChange={(e) => setEditCodeFilename(e.target.value)}
                          className="w-full px-3 py-2 border border-border/50 bg-white/80 text-foreground text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                          placeholder="Filename"
                        />
                        <select
                          value={editCodeLanguage}
                          onChange={(e) => setEditCodeLanguage(e.target.value)}
                          className="px-3 py-2 border border-border/50 bg-white/80 text-foreground text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                        >
                          <option value="text">text</option>
                          <option value="javascript">javascript</option>
                          <option value="typescript">typescript</option>
                          <option value="python">python</option>
                          <option value="java">java</option>
                          <option value="c">c</option>
                          <option value="cpp">cpp</option>
                          <option value="csharp">csharp</option>
                          <option value="php">php</option>
                          <option value="ruby">ruby</option>
                          <option value="go">go</option>
                          <option value="rust">rust</option>
                          <option value="SQL">SQL</option>
                          <option value="HTML">HTML</option>
                          <option value="CSS">CSS</option>
                        </select>
                      </div>
                    ) : (
                      // View mode - show filename and language badge
                      <>
                        <p className="font-semibold text-foreground">
                          {selectedCodeFile.filename}
                        </p>
                        <span
                          className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${
                            languageColors[selectedCodeFile.language] ||
                            languageColors.text
                          }`}
                        >
                          {selectedCodeFile.language.toUpperCase()}
                        </span>
                      </>
                    )}
                  </div>
                  {isOwner && !editingCodeFileId && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => startEditCodeFile(selectedCodeFile)}
                        className="px-3 py-1.5 text-xs border border-border/50 bg-white/80 text-foreground hover:bg-accent/50 hover:border-primary/40 hover:text-primary rounded-lg transition-all duration-200 shadow-modern"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            selectedCodeFile.content
                          );
                          toast.success("Copied to clipboard!");
                        }}
                        className="px-3 py-1.5 text-xs border border-border/50 bg-white/80 text-foreground hover:bg-accent/50 hover:border-primary/40 hover:text-primary rounded-lg transition-all duration-200 shadow-modern"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                  {isOwner && editingCodeFileId === selectedCodeFile.id && (
                    <div className="flex gap-2 flex-shrink-0 pt-0.5">
                      <button
                        onClick={saveCodeFile}
                        className="px-3 py-1.5 text-xs gradient-primary text-primary-foreground hover:gradient-primary-hover rounded-lg transition-all duration-200 shadow-primary hover:shadow-primary-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditCodeFile}
                        className="px-3 py-1.5 text-xs border border-border/50 bg-white/80 text-foreground hover:bg-accent/50 hover:border-primary/40 rounded-lg transition-all duration-200 shadow-modern"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Code Content - Edit or View */}
                {editingCodeFileId === selectedCodeFile.id ? (
                  <div className="p-4 sm:p-5 bg-white/80 backdrop-blur-sm w-full min-w-0 overflow-x-auto">
                    <textarea
                      value={editCodeContent}
                      onChange={(e) => {
                        setEditCodeContent(e.target.value);
                      }}
                      className="w-full min-w-full px-4 py-3 border border-border/50 bg-white/80 text-foreground font-mono text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 shadow-modern"
                      rows={25}
                      placeholder="Code content"
                      style={{
                        fontFamily: "monospace",
                        resize: "vertical",
                        whiteSpace: "pre",
                        overflowWrap: "normal",
                        overflowX: "auto",
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto bg-gray-50">
                    <pre className="p-0 m-0 text-xs leading-relaxed min-w-full">
                      <SyntaxHighlighter
                        language={mapLanguageToPrism(selectedCodeFile.language)}
                        style={oneLight}
                        PreTag="div"
                        showLineNumbers={true}
                        wrapLongLines={true}
                        customStyle={{
                          margin: 0,
                          background: "transparent",
                          padding: "1rem",
                          overflow: "visible",
                        }}
                        className="!p-4 text-xs leading-relaxed"
                      >
                        {selectedCodeFile.content}
                      </SyntaxHighlighter>
                    </pre>
                  </div>
                )}
              </div>
            ) : selectedAttachment ? (
              // View mode (no edit mode in preview for attachments - only rename in sidebar)
              <div className="border border-border/50 rounded-xl overflow-hidden shadow-modern backdrop-blur-sm bg-gradient-card w-full min-w-0">
                {/* Attachment Header */}
                <div className="bg-muted/50 border-b border-border/30 p-3 sm:p-4 flex justify-between items-center rounded-t-xl">
                  <div>
                    <p className="font-semibold text-foreground">
                      {selectedAttachment.filename}
                    </p>
                    <div className="mt-2 flex gap-2 items-center">
                      <span className="text-xs text-muted-foreground">
                        {selectedAttachment.mime_type}
                      </span>
                      <span className="text-xs text-muted-foreground/80">
                        • {formatFileSize(selectedAttachment.file_size)}
                      </span>
                    </div>
                  </div>
                  {selectedAttachment.downloadUrl ? (
                    <a
                      href={selectedAttachment.downloadUrl}
                      download={selectedAttachment.filename}
                      className="px-4 py-2 text-xs border border-border/50 bg-white/80 text-foreground hover:bg-accent/50 hover:border-primary/40 hover:text-primary rounded-lg font-semibold transition-all duration-200 shadow-modern"
                    >
                      Download
                    </a>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 text-xs border border-border/30 bg-muted/50 text-muted-foreground font-semibold cursor-not-allowed rounded-lg"
                    >
                      Download Unavailable
                    </button>
                  )}
                </div>

                {/* Attachment Info */}
                <div className="p-6 bg-muted/30">
                  <p className="text-muted-foreground text-sm">
                    This file is stored in storage. Click the download button to
                    retrieve it.
                  </p>
                  <p className="text-xs text-muted-foreground/80 mt-2">
                    Uploaded: {formatDateTime(selectedAttachment.created_at)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No file selected</p>
            )}

            {/* Comments Section */}
            {submission && (
              <CommentsSection
                submissionId={submission.id}
                studentId={student?.id || ""}
                studentName={student?.name || ""}
                refreshKey={commentsRefreshKey}
              />
            )}

            {/* Upvote Section - Bottom of submission for easy access after reading */}
            {!isOwner && submission && (
              <div className="mt-8 pt-6 border-t border-border/50 animate-slide-up">
                <div className="flex flex-col items-center justify-center gap-4 py-6">
                  <p className="text-sm text-muted-foreground text-center">
                    Found this submission helpful?
                  </p>
                  <button
                    onClick={handleToggleUpvote}
                    disabled={isUpvoting}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 font-semibold ${
                      submission?.user_has_upvoted
                        ? "bg-primary/10 text-primary border-2 border-primary/30 hover:bg-primary/20 hover:scale-105"
                        : "bg-accent/50 text-muted-foreground border-2 border-border/50 hover:bg-accent hover:border-primary/40 hover:text-primary hover:scale-105"
                    } ${
                      isUpvoting
                        ? "opacity-50 cursor-not-allowed scale-100"
                        : "cursor-pointer active:scale-95"
                    } shadow-modern hover:shadow-primary/20`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 transition-transform duration-200 ${
                        submission?.user_has_upvoted
                          ? "fill-current scale-110"
                          : ""
                      }`}
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    <span>
                      {submission?.user_has_upvoted ? "Upvoted" : "Upvote"}
                    </span>
                    <span className="font-bold">
                      {submission?.upvote_count || 0}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {isOwner && (
          <div className="mt-8 flex gap-3 animate-slide-up">
            <button
              onClick={() => setDeleteSubmissionDialogOpen(true)}
              className="px-6 py-2.5 border border-destructive/50 text-destructive font-semibold rounded-lg hover:bg-destructive/10 hover:border-destructive transition-all duration-300 shadow-modern"
            >
              Delete Submission
            </button>
          </div>
        )}

        {/* Add Files Modal */}
        {showAddFilesModal && (
          <AddFilesModal
            submissionId={submissionId}
            onClose={() => {
              setShowAddFilesModal(false);
              reloadSubmission();
              setCommentsRefreshKey((prev) => prev + 1); // Refresh comments
            }}
          />
        )}

        {/* Delete Confirmation Dialogs */}
        <DeleteConfirmationDialog
          open={deleteSubmissionDialogOpen}
          onOpenChange={setDeleteSubmissionDialogOpen}
          title="Delete Submission"
          description="Are you sure you want to delete this submission? This action cannot be undone and will delete all associated files and comments."
          onConfirm={deleteSubmission}
          isLoading={isDeleting}
        />

        <DeleteConfirmationDialog
          open={deleteCodeFileDialogOpen}
          onOpenChange={(open) => {
            setDeleteCodeFileDialogOpen(open);
            if (!open) {
              setCodeFileToDelete(null);
            }
          }}
          title="Delete Code File"
          description={`Are you sure you want to delete "${codeFileToDelete?.filename}"? This action cannot be undone.`}
          onConfirm={deleteCodeFile}
          isLoading={isDeleting}
        />

        <DeleteConfirmationDialog
          open={deleteAttachmentDialogOpen}
          onOpenChange={(open) => {
            setDeleteAttachmentDialogOpen(open);
            if (!open) {
              setAttachmentToDelete(null);
            }
          }}
          title="Delete Attachment"
          description={`Are you sure you want to delete "${attachmentToDelete?.filename}"? This action cannot be undone.`}
          onConfirm={deleteAttachment}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}

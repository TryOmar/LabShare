"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import Navigation from "@/components/navigation";
import CommentsSection from "@/components/comments-section";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { formatDateTime } from "@/lib/utils";

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

interface Submission {
  id: string;
  title: string;
  student_id: string;
  lab_id: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  students?: {
    id: string;
    name: string;
    email: string;
  };
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
  SQL:"bg-blue-100 text-white-800",
  HTML:"bg-orange-100 text-red-800",
  CSS:"bg-blue-100 text-blue-800",
};

// Map incoming language strings (from API) to Prism language identifiers
const mapLanguageToPrism = (lang?: string) => {
  if (!lang) return 'text';
  const l = lang.toLowerCase();
  if (l === 'c++' || l === 'cpp') return 'cpp';
  if (l === 'c#' || l === 'csharp') return 'csharp';
  if (l === 'ts' || l === 'tsx' || l === 'typescript') return 'typescript';
  if (l === 'js' || l === 'jsx' || l === 'javascript') return 'javascript';
  if (l === 'py' || l === 'python') return 'python';
  if (l === 'sql') return 'sql';
  if (l === 'html') return 'html';
  if (l === 'java') return 'java';
  if (l === 'php') return 'php';
  if (l === 'ruby') return 'ruby';
  if (l === 'go') return 'go';
  if (l === 'rust') return 'rust';
  if (l === 'text' || l === 'plain') return 'text';
  return l; // fallback: try the provided value
};

export default function SubmissionPage() {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedCodeFile, setSelectedCodeFile] = useState<CodeFile | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
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
            setError(errorData.error || "Access denied. You must submit a solution for this lab before viewing other submissions.");
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

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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

      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-3xl font-bold text-black">{submission?.title}</h1>
              <p className="text-gray-600 mt-1">
                by {submission?.students?.name}
              </p>
            </div>
            {isOwner && (
              <button
                onClick={() => router.back()}
                className="px-4 py-2 border border-black text-black font-semibold hover:bg-gray-100"
              >
                Back
              </button>
            )}
          </div>

          {/* Metadata */}
          <div className="flex gap-4 text-sm text-gray-600 mt-4">
            <span>{submission?.view_count} views</span>
            <span>
              Created: {submission?.created_at && formatDateTime(submission.created_at)}
            </span>
            {isOwner && (
              <span>
                Last edited: {submission?.updated_at && formatDateTime(submission.updated_at)}
              </span>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div>
            {/* Code Files List */}
            {codeFiles.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-black mb-3">Code Files</h3>
                <div className="space-y-2">
                  {codeFiles.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => {
                        setSelectedCodeFile(file);
                        setSelectedAttachment(null);
                      }}
                      className={`w-full text-left p-2 border border-black text-xs truncate ${
                        selectedCodeFile?.id === file.id
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-gray-100"
                      }`}
                      title={file.filename}
                    >
                      📄 {file.filename}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div>
                <h3 className="font-bold text-black mb-3">Attachments</h3>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <button
                      key={attachment.id}
                      onClick={() => {
                        setSelectedAttachment(attachment);
                        setSelectedCodeFile(null);
                      }}
                      className={`w-full text-left p-2 border border-black text-xs truncate ${
                        selectedAttachment?.id === attachment.id
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-gray-100"
                      }`}
                      title={attachment.filename}
                    >
                      📎 {attachment.filename}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {codeFiles.length === 0 && attachments.length === 0 && (
              <div className="text-gray-500 text-sm">No files</div>
            )}
          </div>

          {/* Code Viewer + Attachments + Comments */}
          <div className="lg:col-span-3 space-y-6">
            {/* Code File Viewer */}
            {selectedCodeFile ? (
              <div className="border border-black">
                {/* File Header */}
                <div className="bg-gray-100 border-b border-black p-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-black">{selectedCodeFile.filename}</p>
                    <span
                      className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${
                        languageColors[selectedCodeFile.language] ||
                        languageColors.text
                      }`}
                    >
                      {selectedCodeFile.language.toUpperCase()}
                    </span>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => {
                        // Copy to clipboard
                        navigator.clipboard.writeText(selectedCodeFile.content);
                      }}
                      className="px-3 py-1 text-xs border border-black bg-white text-black hover:bg-gray-200"
                    >
                      Copy
                    </button>
                  )}
                </div>

                {/* Code Content */}
                <pre className="p-0 bg-gray-50 overflow-x-auto text-xs leading-relaxed">
                  <SyntaxHighlighter
                    language={mapLanguageToPrism(selectedCodeFile.language)}
                    style={oneLight}
                    PreTag="div"
                    showLineNumbers={true}
                    wrapLongLines={true}
                    customStyle={{ margin: 0, background: 'transparent' }}
                    className="!p-4 text-xs leading-relaxed"
                  >
                    {selectedCodeFile.content}
                  </SyntaxHighlighter>
                </pre>
              </div>
            ) : selectedAttachment ? (
              <div className="border border-black">
                {/* Attachment Header */}
                <div className="bg-gray-100 border-b border-black p-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-black">{selectedAttachment.filename}</p>
                    <div className="mt-2 flex gap-2 items-center">
                      <span className="text-xs text-gray-600">
                        {selectedAttachment.mime_type}
                      </span>
                      <span className="text-xs text-gray-500">
                        • {formatFileSize(selectedAttachment.file_size)}
                      </span>
                    </div>
                  </div>
                  {selectedAttachment.downloadUrl ? (
                    <a
                      href={selectedAttachment.downloadUrl}
                      download={selectedAttachment.filename}
                      className="px-4 py-2 text-xs border border-black bg-white text-black hover:bg-gray-200 font-semibold"
                    >
                      Download
                    </a>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 text-xs border border-gray-300 bg-gray-100 text-gray-400 font-semibold cursor-not-allowed"
                    >
                      Download Unavailable
                    </button>
                  )}
                </div>

                {/* Attachment Info */}
                <div className="p-6 bg-gray-50">
                  <p className="text-gray-600 text-sm">
                    This file is stored in storage. Click the download button to retrieve it.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Uploaded: {formatDateTime(selectedAttachment.created_at)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No file selected</p>
            )}

            {/* Comments Section */}
            {submission && (
              <CommentsSection
                submissionId={submission.id}
                studentId={student?.id || ""}
                studentName={student?.name || ""}
              />
            )}
          </div>
        </div>

        {/* Actions */}
        {isOwner && (
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-black text-white font-semibold hover:bg-gray-800"
            >
              Edit
            </button>
            <button
              onClick={async () => {
                if (confirm("Delete this submission?")) {
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
                  }
                }
              }}
              className="px-6 py-2 border border-red-600 text-red-600 font-semibold hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

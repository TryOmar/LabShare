"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from 'next/navigation';
import Navigation from "@/components/navigation";

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
  const [editSubmissionId, setEditSubmissionId] = useState<string | null>(null);
  const [editSubmissionData, setEditSubmissionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const params = useParams();
  const labId = params.id as string;

  useEffect(() => {
    // Check if upload=true or edit=<id> is in query params
    const searchParams = new URLSearchParams(window.location.search);
    const shouldUpload = searchParams.get("upload") === "true";
    const editId = searchParams.get("edit");
    
    if (shouldUpload) {
      setShowUploadModal(true);
      // Remove the query param from URL
      router.replace(`/lab/${labId}`, { scroll: false });
    } else if (editId) {
      setEditSubmissionId(editId);
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

  useEffect(() => {
    // Load submission data when editing
    const loadSubmissionData = async () => {
      if (!editSubmissionId) return;

      try {
        const response = await fetch(`/api/submission/${editSubmissionId}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          console.error("Failed to load submission for editing");
          return;
        }

        const data = await response.json();
        setEditSubmissionData(data);
      } catch (err) {
        console.error("Error loading submission data:", err);
      }
    };

    loadSubmissionData();
  }, [editSubmissionId]);

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
        {/* Lab Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Lab {lab?.lab_number}: {lab?.title}
          </h1>
          {lab?.description && (
            <p className="text-gray-600">{lab.description}</p>
          )}
        </div>

        {/* Action Bar */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-2 bg-black text-white font-semibold hover:bg-gray-800"
          >
            {userSubmission ? "Edit Submission" : "Upload Solution"}
          </button>
          {userSubmission && (
            <button
              onClick={() => router.push(`/submission/${userSubmission.id}`)}
              className="px-6 py-2 border border-black text-black font-semibold hover:bg-gray-50"
            >
              View My Solution
            </button>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <UploadModal
            labId={labId}
            existingSubmissionData={editSubmissionData}
            onClose={() => {
              setShowUploadModal(false);
              setEditSubmissionId(null);
              setEditSubmissionData(null);
              // Reload the page to refresh lab data and make it accessible
              window.location.href = `/lab/${labId}`;
            }}
          />
        )}

        {/* Submissions List */}
        <div>
          <h2 className="text-xl font-bold text-black mb-4">
            Solutions ({submissions.length})
          </h2>
          {submissions.length > 0 ? (
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  onClick={() => router.push(`/submission/${submission.id}`)}
                  className="border border-black p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-black">
                        {submission.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        by {submission.students?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {submission.students?.id === student?.id && (
                        <span className="text-xs bg-gray-100 px-2 py-1 border border-black">
                          Your Solution
                        </span>
                      )}
                      <span className="text-xs bg-gray-100 px-2 py-1 border border-black">
                        {submission.view_count} {submission.view_count === 1 ? 'view' : 'views'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No solutions uploaded yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface UploadModalProps {
  labId: string;
  existingSubmissionData?: any;
  onClose: () => void;
}

function UploadModal({ labId, existingSubmissionData, onClose }: UploadModalProps) {
  const [title, setTitle] = useState("");
  const [uploadType, setUploadType] = useState<"paste" | "file">("paste");
  const [codeContent, setCodeContent] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    ".sql": "SQL"
  };

  // Pre-populate form when editing existing submission
  useEffect(() => {
    if (existingSubmissionData) {
      const { submission, files: existingFiles } = existingSubmissionData;
      
      if (submission) {
        setTitle(submission.title || "");
      }
      
      if (existingFiles && existingFiles.length > 0) {
        // If there's only one file, use paste mode and pre-populate it
        if (existingFiles.length === 1) {
          setUploadType("paste");
          setCodeContent(existingFiles[0].content || "");
          setLanguage(existingFiles[0].language || "javascript");
        } else {
          // For multiple files, keep file upload mode
          // Note: We can't pre-populate File objects, so user will need to re-upload
          setUploadType("file");
        }
      }
    }
  }, [existingSubmissionData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!title.trim()) {
        setError("Title is required");
        setLoading(false);
        return;
      }

      let filesToUpload: Array<{ filename: string; language: string; content: string }> = [];

      if (uploadType === "paste") {
        if (!codeContent.trim()) {
          setError("Code content is required");
          setLoading(false);
          return;
        }
        filesToUpload = [
          { filename: `code.${language}`, language, content: codeContent },
        ];
      } else {
        if (files.length === 0) {
          setError("Please select at least one file");
          setLoading(false);
          return;
        }

        for (const file of files) {
          const content = await file.text();
          const ext = "." + file.name.split(".").pop()?.toLowerCase();
          const detectedLang = detectedLanguages[ext] || "text";

          filesToUpload.push({
            filename: file.name,
            language: detectedLang,
            content,
          });
        }
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-black p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-black mb-4">
          {existingSubmissionData ? "Edit Solution" : "Upload Solution"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-black font-semibold mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., My Solution"
              className="w-full px-3 py-2 border border-black bg-white text-black"
              required
            />
          </div>

          {/* Upload Type */}
          <div>
            <label className="block text-black font-semibold mb-2">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={uploadType === "paste"}
                  onChange={() => setUploadType("paste")}
                  className="w-4 h-4"
                />
                <span className="text-black">Paste Code</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={uploadType === "file"}
                  onChange={() => setUploadType("file")}
                  className="w-4 h-4"
                />
                <span className="text-black">Upload Files</span>
              </label>
            </div>
          </div>

          {/* Paste Code */}
          {uploadType === "paste" && (
            <>
              <div>
                <label className="block text-black font-semibold mb-2">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-black bg-white text-black"
                >
                  {Object.entries(detectedLanguages).map(([ext, lang]) => (
                    <option key={ext} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-black font-semibold mb-2">
                  Code
                </label>
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  placeholder="Paste your code here..."
                  rows={6}
                  className="w-full px-3 py-2 border border-black bg-white text-black font-mono text-sm"
                />
              </div>
            </>
          )}

          {/* Upload Files */}
          {uploadType === "file" && (
            <div>
              <label className="block text-black font-semibold mb-2">
                Files
              </label>
              {existingSubmissionData && existingSubmissionData.files && existingSubmissionData.files.length > 1 && (
                <p className="text-sm text-gray-600 mb-2">
                  Note: Re-upload all files for your submission. Previous files: {existingSubmissionData.files.map((f: any) => f.filename).join(", ")}
                </p>
              )}
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".js,.ts,.py,.cpp,.c,.java,.cs,.php,.rb,.go,.rs,.txt"
                className="w-full"
              />
              {files.length > 0 && (
                <div className="mt-2">
                  {files.map((file) => (
                    <p key={file.name} className="text-sm text-gray-600">
                      ✓ {file.name}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white font-semibold py-2 hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? (existingSubmissionData ? "Saving..." : "Uploading...") : (existingSubmissionData ? "Save" : "Upload")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-black text-black font-semibold py-2 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

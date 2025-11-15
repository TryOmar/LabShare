"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from 'next/navigation';
import Navigation from "@/components/navigation";
import CommentsSection from "@/components/comments-section";

interface SubmissionFile {
  id: string;
  filename: string;
  language: string;
  content: string;
}

interface Version {
  id: string;
  version_number: number;
  created_at: string;
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
  SQL:"bg-blue-100 text-white-800"
};

export default function SubmissionPage() {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<SubmissionFile | null>(null);
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
        setVersions(data.versions || []);
        setFiles(data.files || []);

        // Set selected version and file
        if (data.versions && data.versions.length > 0) {
          setSelectedVersion(data.versions[0]);
        }
        if (data.files && data.files.length > 0) {
          setSelectedFile(data.files[0]);
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

  const handleVersionChange = async (version: Version) => {
    setSelectedVersion(version);

    try {
      // Fetch files for the selected version from API route
      const response = await fetch(`/api/submission/${submissionId}/files?versionId=${version.id}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load version files");
      }

      const data = await response.json();
      setFiles(data.files || []);
      
      if (data.files && data.files.length > 0) {
        setSelectedFile(data.files[0]);
      }
    } catch (err) {
      console.error("Error loading version files:", err);
    }
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
              Created: {submission?.created_at && new Date(submission.created_at).toLocaleDateString()}
            </span>
            {isOwner && (
              <span>
                Last edited: {submission?.updated_at && new Date(submission.updated_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div>
            {/* Versions */}
            {versions.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-black mb-3">Versions</h3>
                <div className="space-y-2">
                  {versions.map((version) => (
                    <button
                      key={version.id}
                      onClick={() => handleVersionChange(version)}
                      className={`w-full text-left p-2 border border-black text-sm ${
                        selectedVersion?.id === version.id
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-gray-100"
                      }`}
                    >
                      <div>v{version.version_number}</div>
                      <div className="text-xs">
                        {new Date(version.created_at).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Files List */}
            {files.length > 0 && (
              <div>
                <h3 className="font-bold text-black mb-3">Files</h3>
                <div className="space-y-2">
                  {files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left p-2 border border-black text-xs truncate ${
                        selectedFile?.id === file.id
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-gray-100"
                      }`}
                      title={file.filename}
                    >
                      {file.filename}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Code Viewer + Comments */}
          <div className="lg:col-span-3 space-y-6">
            {/* Code Viewer */}
            {selectedFile ? (
              <div className="border border-black">
                {/* File Header */}
                <div className="bg-gray-100 border-b border-black p-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-black">{selectedFile.filename}</p>
                    <span
                      className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${
                        languageColors[selectedFile.language] ||
                        languageColors.text
                      }`}
                    >
                      {selectedFile.language.toUpperCase()}
                    </span>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => {
                        // Copy to clipboard
                        navigator.clipboard.writeText(selectedFile.content);
                      }}
                      className="px-3 py-1 text-xs border border-black bg-white text-black hover:bg-gray-200"
                    >
                      Copy
                    </button>
                  )}
                </div>

                {/* Code Content */}
                <pre className="p-4 bg-gray-50 overflow-x-auto text-xs leading-relaxed">
                  <code className="text-black font-mono">{selectedFile.content}</code>
                </pre>
              </div>
            ) : (
              <p className="text-gray-600">No files in this version</p>
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

                    router.back();
                  } catch (err) {
                    console.error("Error deleting submission:", err);
                    alert("Failed to delete submission. Please try again.");
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

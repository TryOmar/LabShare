"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from "@/components/navigation";
import { UploadModal } from "@/components/lab/UploadModal";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Lab, Student, Track, Submission } from "@/lib/lab/types";

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
              <h2 className="text-xl font-bold text-destructive">Access Denied</h2>
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
        {lab?.courses && (
          <div className="mb-4 sm:mb-6 animate-slide-up">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href={`/labs?course=${lab.courses.id}`}
                      className="hover:text-primary transition-colors duration-200"
                    >
                      {lab.courses.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    Lab {lab.lab_number}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        {/* Lab Header */}
        <div className="mb-6 sm:mb-8 animate-slide-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 break-words bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Lab {lab?.lab_number}: {lab?.title}
          </h1>
          {lab?.description && (
            <p className="text-sm sm:text-base text-muted-foreground break-words leading-relaxed">{lab.description}</p>
          )}
        </div>

        {/* Action Bar */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-3 animate-slide-up">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-5 sm:px-6 py-2.5 text-sm sm:text-base gradient-primary text-primary-foreground font-semibold rounded-lg hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-primary hover:shadow-primary-lg"
          >
            {userSubmission ? "Edit Submission" : "Upload Solution"}
          </button>
          {userSubmission && (
            <button
              onClick={() => router.push(`/submission/${userSubmission.id}`)}
              className="px-5 sm:px-6 py-2.5 text-sm sm:text-base border border-border/50 text-foreground font-semibold rounded-lg hover:bg-accent/50 hover:border-primary/40 hover:text-primary transition-all duration-300 shadow-modern hover:shadow-primary/10 backdrop-blur-sm"
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
        <div className="animate-slide-up">
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-5 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Solutions ({submissions.length})
          </h2>
          {submissions.length > 0 ? (
            <div className="space-y-3">
              {submissions.map((submission, index) => (
                <div
                  key={submission.id}
                  onClick={() => router.push(`/submission/${submission.id}`)}
                  className="border border-border/50 p-4 sm:p-5 rounded-xl hover:bg-accent/30 hover:border-primary/40 hover:shadow-modern cursor-pointer transition-all duration-300 hover-lift backdrop-blur-sm bg-gradient-card shadow-modern"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground break-words">
                        {submission.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground break-words mt-1">
                        by {submission.is_anonymous ? 'Anonymous' : (submission.students?.name || 'Unknown')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {submission.students?.id === student?.id && (
                        <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 border border-primary/30 rounded-lg whitespace-nowrap font-medium">
                          Your Solution
                        </span>
                      )}
                      <span className="text-xs bg-accent px-3 py-1.5 border border-border/50 rounded-lg whitespace-nowrap text-muted-foreground">
                        {submission.view_count} {submission.view_count === 1 ? 'view' : 'views'}
                      </span>
                      <span className="text-xs bg-accent px-3 py-1.5 border border-border/50 rounded-lg whitespace-nowrap text-muted-foreground flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        {submission.upvote_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm sm:text-base text-muted-foreground">No solutions uploaded yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

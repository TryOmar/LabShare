"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from 'next/navigation';
import Navigation from "@/components/navigation";

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

interface Lab {
  id: string;
  course_id: string;
  lab_number: number;
  title: string;
  description: string;
}

export default function LockedLabPage() {
  const [lab, setLab] = useState<Lab | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
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
            sessionStorage.setItem('lockedLabPageReferrer', referrerPath);
          } else {
            // If referrer is same as current page, default to dashboard
            sessionStorage.setItem('lockedLabPageReferrer', '/dashboard');
          }
        } catch (e) {
          // If URL parsing fails, default to dashboard
          sessionStorage.setItem('lockedLabPageReferrer', '/dashboard');
        }
      } else {
        // No referrer or external referrer - always default to dashboard
        sessionStorage.setItem('lockedLabPageReferrer', '/dashboard');
      }
    }
  }, [labId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get student info for navigation
        const authResponse = await fetch("/api/auth/status", {
          method: "GET",
          credentials: "include",
        });

        if (authResponse.ok) {
          const authData = await authResponse.json();
          if (authData.authenticated && authData.student) {
            setStudent(authData.student);
            // Get track info
            const dashboardResponse = await fetch("/api/dashboard", {
              method: "GET",
              credentials: "include",
            });
            if (dashboardResponse.ok) {
              const dashboardData = await dashboardResponse.json();
              setTrack(dashboardData.track);
            }
          }
        }

        // Get lab info - use upload=true to get lab info even if locked
        const labResponse = await fetch(`/api/lab/${labId}?upload=true`, {
          method: "GET",
          credentials: "include",
        });

        if (labResponse.ok) {
          const labData = await labResponse.json();
          setLab(labData.lab);
        } else if (labResponse.status === 403) {
          // If still 403, try to get lab info from labs endpoint
          const labsResponse = await fetch("/api/labs", {
            method: "GET",
            credentials: "include",
          });
          if (labsResponse.ok) {
            const labsData = await labsResponse.json();
            // Find the lab in the labs data
            const allLabs: Lab[] = [];
            Object.values(labsData.labsByCourse || {}).forEach((labs: any) => {
              allLabs.push(...labs);
            });
            const foundLab = allLabs.find((l: Lab) => l.id === labId);
            if (foundLab) {
              setLab(foundLab);
            }
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [labId]);

  const handleContinue = () => {
    // Redirect to lab page with upload parameter
    router.push(`/lab/${labId}?upload=true`);
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

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-white via-white to-accent/10 animate-fade-in">
      <Navigation student={student} track={track} />

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="border-2 border-border/50 bg-gradient-card rounded-2xl p-8 sm:p-10 shadow-modern-xl backdrop-blur-sm animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-primary"
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
            <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Lab {lab?.lab_number} — Locked
            </h1>
          </div>

          <div className="mb-8">
            <p className="text-lg text-muted-foreground leading-relaxed">
              You must <span className="font-bold text-foreground">complete</span> this lab and have it <span className="font-bold text-foreground">reviewed</span> by the <span className="font-bold text-foreground">instructor</span> before you can access other students' submissions.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mt-4">
              Once you finish and review it, you can upload your work here.
            </p>
          </div>

          <div className="mb-8 p-4 bg-muted/50 border border-border/30 rounded-xl backdrop-blur-sm">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-5 h-5 border-2 border-primary rounded cursor-pointer accent-primary transition-all duration-200"
              />
              <span className="text-base text-foreground">
                I confirm I've <span className="font-bold">completed</span> and <span className="font-bold">reviewed</span> this lab with the <span className="font-bold">instructor</span>.
              </span>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleContinue}
              disabled={!confirmed}
              className={`px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${
                confirmed
                  ? "gradient-primary text-primary-foreground hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] shadow-primary hover:shadow-primary-lg"
                  : "bg-muted/50 text-muted-foreground cursor-not-allowed shadow-modern"
              }`}
            >
              Continue
            </button>
            <button
              onClick={() => {
                // Try to go back in browser history first
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back();
                  // Fallback: if still on same page after a moment, use referrer or default
                  setTimeout(() => {
                    if (window.location.pathname === `/lab/${labId}/locked`) {
                      const referrer = sessionStorage.getItem('lockedLabPageReferrer');
                      if (referrer && referrer.startsWith('/') && referrer !== `/lab/${labId}/locked` && referrer !== `/lab/${labId}`) {
                        router.push(referrer);
                      } else {
                        router.push('/dashboard');
                      }
                    }
                  }, 100);
                } else {
                  // No history, use referrer or default to dashboard
                  const referrer = sessionStorage.getItem('lockedLabPageReferrer');
                  if (referrer && referrer.startsWith('/') && referrer !== `/lab/${labId}/locked` && referrer !== `/lab/${labId}`) {
                    router.push(referrer);
                  } else {
                    router.push('/dashboard');
                  }
                }
              }}
              className="px-6 py-3 border border-border/50 text-foreground font-semibold rounded-lg hover:bg-accent/50 hover:border-primary/40 backdrop-blur-sm transition-all duration-300 shadow-modern hover:shadow-primary/10"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


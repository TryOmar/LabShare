"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import Navigation from "@/components/navigation";
import LastUpdates from "@/components/last-updates";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/loading-skeletons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

interface Course {
  id: string;
  name: string;
  description: string;
  submissions?: Submission[];
}

interface Lab {
  id: string;
  course_id: string;
  lab_number: number;
  title: string;
  description: string;
}

interface Lab {
  id: string;
  lab_number: number;
  title: string;
  course_id: string;
  courses?: {
    id: string;
    name: string;
  };
}

interface Submission {
  id: string;
  student_id: string;
  lab_id: string;
  title: string;
  view_count: number;
  created_at: string;
  students?: Student;
  labs?: Lab;
  hasAccess?: boolean;
}

// Format timestamp as "Nov 18, 2025 — 5:17 PM"
const formatUploadTimestamp = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dateStr = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr} — ${timeStr}`;
};

// Course Card Component
const CourseCard = ({ 
  course, 
  router 
}: { 
  course: Course; 
  router: { push: (path: string) => void };
}) => {
  const submissions = course.submissions || [];
  const recentSubmissions = submissions.slice(0, 3);

  return (
    <div className="border border-border/50 bg-gradient-card rounded-xl hover:shadow-modern-lg hover:shadow-primary/10 transition-all duration-500 hover-lift animate-fade-in backdrop-blur-sm">
      {/* Course Header */}
      <div
        onClick={() => router.push(`/labs?course=${course.id}`)}
        className="border-b border-border/30 p-4 sm:p-5 hover:bg-accent/30 cursor-pointer transition-all duration-300 rounded-t-xl backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-sm sm:text-lg text-foreground flex-1 min-w-0 truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{course.name}</h3>
          <span className="text-xs font-medium text-muted-foreground hover:text-primary whitespace-nowrap flex-shrink-0 transition-all duration-300 group-hover:translate-x-1">All Labs →</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-3 sm:p-4">
        {recentSubmissions.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Recent Uploads</span>
              <span className="text-xs text-gray-500">{submissions.length} total</span>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {recentSubmissions.map((submission) => {
                const isLocked = !submission.hasAccess;
                const labNumber = submission.labs?.lab_number;
                const labTitle = labNumber ? `Lab ${labNumber}` : 'Lab';

                return (
                  <div
                    key={submission.id}
                    className={`p-3 sm:p-4 border border-border/50 rounded-xl transition-all duration-300 ${
                      isLocked
                        ? "bg-muted/50 opacity-60 backdrop-blur-sm"
                        : "bg-white/80 hover:bg-accent/30 hover:border-primary/40 hover:shadow-modern hover-lift backdrop-blur-sm"
                    }`}
                  >
                    {/* Lab Number and Title */}
                    <div className="mb-2 flex items-center gap-2">
                      <h4 className={`font-semibold text-xs sm:text-sm flex-1 ${isLocked ? "text-muted-foreground" : "text-foreground"} break-words`}>
                        <span className="hidden sm:inline">{labTitle} — </span>{submission.title}
                      </h4>
                      {isLocked && (
                        <svg className="h-4 w-4 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </div>

                    {/* Uploader Name */}
                    <p className={`text-xs mb-2 ${isLocked ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                      by {submission.students?.name}
                    </p>

                    {/* Views and Timestamp */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 sm:mb-3 flex-wrap">
                      <span>{submission.view_count} views</span>
                      <span>•</span>
                      <span className="break-words">{formatUploadTimestamp(submission.created_at)}</span>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isLocked) {
                          // Redirect to locked lab page that explains they need to finish with instructor
                          router.push(`/lab/${submission.lab_id}/locked`);
                        } else {
                          // Open submission viewer
                          router.push(`/submission/${submission.id}`);
                        }
                      }}
                      className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 ${
                        isLocked
                          ? "gradient-primary text-primary-foreground hover:gradient-primary-hover shadow-primary hover:shadow-primary-lg hover:scale-[1.02] active:scale-[0.98]"
                          : "gradient-primary text-primary-foreground hover:gradient-primary-hover shadow-primary hover:shadow-primary-lg hover:scale-[1.02] active:scale-[0.98]"
                      }`}
                    >
                      {isLocked 
                        ? (labNumber ? `Submit Lab ${labNumber} to Unlock` : 'Submit to Unlock')
                        : 'View Submission'
                      }
                    </button>
                  </div>
                );
              })}
            </div>
            {submissions.length > 3 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/labs?course=${course.id}`);
                }}
                className="w-full text-xs text-center text-muted-foreground hover:text-primary py-2 border-t border-border transition-colors duration-200"
              >
                View all {submissions.length} uploads →
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">No uploads yet</p>
            <button
              onClick={() => router.push(`/labs?course=${course.id}`)}
              className="text-xs text-muted-foreground hover:text-primary underline transition-colors duration-200"
            >
              View Labs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  
  // State
  const [student, setStudent] = useState<Student | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesWithSubmissions, setCoursesWithSubmissions] = useState<Course[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Submission form state
  const [labsByCourse, setLabsByCourse] = useState<Map<string, Lab[]>>(new Map());
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedLabId, setSelectedLabId] = useState<string>("");
  const [suggestedLabs, setSuggestedLabs] = useState<Array<{
    lab_id: string;
    lab_number: number;
    lab_title: string;
    course_id: string;
    course_name: string;
  }>>([]);

  // Refs
  const sidebarRef = useRef<HTMLDivElement>(null);
  const coursesBoxRef = useRef<HTMLDivElement>(null);

  // Match courses box height with sidebar
  useEffect(() => {
    const matchHeights = () => {
      if (sidebarRef.current && coursesBoxRef.current) {
        coursesBoxRef.current.style.minHeight = `${sidebarRef.current.offsetHeight}px`;
      }
    };

    matchHeights();
    window.addEventListener('resize', matchHeights);
    const timeout = setTimeout(matchHeights, 100);
    
    return () => {
      window.removeEventListener('resize', matchHeights);
      clearTimeout(timeout);
    };
  }, [coursesWithSubmissions.length]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Check if terms are accepted first
        const termsResponse = await fetch("/api/auth/check-terms", {
          method: "GET",
          credentials: "include",
        });

        if (termsResponse.ok) {
          const termsData = await termsResponse.json();
          if (!termsData.termsAccepted) {
            // Terms not accepted, redirect to terms page
            router.push("/terms");
            return;
          }
        }

        // Fetch dashboard data from API route (server-side validation)
        const response = await fetch("/api/dashboard", {
          method: "GET",
          credentials: "include", // Include cookies
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Unauthorized - redirect to login
            router.push("/login");
            return;
          }
          throw new Error(`Failed to load dashboard: ${response.statusText}`);
        }

        const data = await response.json();
        
        setStudent(data.student);
        setTrack(data.track);
        setCourses(data.courses || []);
        setCoursesWithSubmissions(data.coursesWithSubmissions || []);
        setRecentSubmissions(data.recentSubmissions || []);
        setSuggestedLabs(data.suggestedLabs || []);

        // Fetch labs data for submission form
        const labsResponse = await fetch("/api/labs", {
          method: "GET",
          credentials: "include",
        });

        if (labsResponse.ok) {
          const labsData = await labsResponse.json();
          const labsMap = new Map<string, Lab[]>();
          Object.entries(labsData.labsByCourse || {}).forEach(([courseId, labsList]) => {
            labsMap.set(courseId, labsList as Lab[]);
          });
          setLabsByCourse(labsMap);
        }
      } catch (err) {
        console.error("Error loading dashboard:", err);
        // On error, redirect to login as a fallback
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <>
        <Navigation student={null} track={null} />
        <DashboardSkeleton />
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white animate-fade-in">
      <Navigation student={student} track={track} />

      <div className="flex-1 p-4 sm:p-6 w-full">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8 px-2 sm:px-4 animate-slide-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Welcome, {student?.name}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground break-words">
            {track?.name} • {student?.email}
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start px-2 sm:px-4">
          {/* Main Content */}
          <div className="lg:col-span-2 w-full">
            {/* Submit Work Section */}
            <div className="mb-6 sm:mb-8 w-full border border-border/50 p-5 sm:p-7 bg-gradient-card rounded-2xl shadow-modern hover:shadow-modern-lg transition-all duration-500 hover-lift animate-slide-up backdrop-blur-sm">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-5 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Submit Your Lab</h2>
              
              {/* Instructions */}
              <div className="mb-5 sm:mb-6 p-4 sm:p-5 bg-muted/50 border border-border/30 rounded-xl backdrop-blur-sm">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Please ensure you have <span className="font-bold text-foreground">completed</span> the lab and had it <span className="font-bold text-foreground">reviewed</span> by the <span className="font-bold text-foreground">instructor</span> before uploading. Do not upload random files.
                </p>
              </div>

              {/* Suggested Labs */}
              {suggestedLabs.length > 0 && (
                <div className="mb-5 flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-medium text-muted-foreground">Suggested Labs:</p>
                  {suggestedLabs.map((suggestion) => (
                    <button
                      key={suggestion.lab_id}
                      onClick={() => {
                        setSelectedCourseId(suggestion.course_id);
                        setSelectedLabId(suggestion.lab_id);
                      }}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium border border-border/50 bg-white/80 hover:bg-accent/50 hover:border-primary/40 hover:text-primary transition-all duration-300 rounded-lg shadow-modern hover:shadow-primary/10 backdrop-blur-sm"
                    >
                      <span className="hidden sm:inline">{suggestion.course_name} • </span>Lab {suggestion.lab_number}
                    </button>
                  ))}
                </div>
              )}

              {/* Course and Lab Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                {/* Course Selector */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2.5">
                    Select Course
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      setSelectedLabId(""); // Reset lab when course changes
                    }}
                    className="w-full p-3 sm:p-3.5 text-sm sm:text-base border border-border/50 bg-white/80 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-modern transition-all duration-300 backdrop-blur-sm hover:border-primary/30"
                  >
                    <option value="">Choose a course...</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lab Selector */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2.5">
                    Select Lab
                  </label>
                  <select
                    value={selectedLabId}
                    onChange={(e) => setSelectedLabId(e.target.value)}
                    disabled={!selectedCourseId}
                    className="w-full p-3 sm:p-3.5 text-sm sm:text-base border border-border/50 bg-white/80 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-modern transition-all duration-300 backdrop-blur-sm hover:border-primary/30 disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed"
                  >
                    <option value="">Choose a lab...</option>
                    {selectedCourseId && labsByCourse.get(selectedCourseId)?.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        Lab {lab.lab_number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={() => {
                  if (selectedLabId) {
                    router.push(`/lab/${selectedLabId}?upload=true`);
                  }
                }}
                disabled={!selectedLabId}
                className={`w-full py-3 sm:py-3.5 px-5 sm:px-6 text-sm sm:text-base font-semibold rounded-lg transition-all duration-300 ${
                  selectedLabId
                    ? "gradient-primary text-primary-foreground hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] shadow-primary hover:shadow-primary-lg"
                    : "bg-muted/50 text-muted-foreground border border-border/50 cursor-not-allowed shadow-modern"
                }`}
              >
                Continue to Upload
              </button>
            </div>

            {/* Courses Section */}
            <div ref={coursesBoxRef} className="mb-6 sm:mb-8 w-full border border-border/50 p-5 sm:p-7 bg-gradient-card rounded-2xl shadow-modern hover:shadow-modern-lg transition-all duration-500 hover-lift animate-slide-up backdrop-blur-sm">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-5 sm:mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Recent Courses</h2>
              
              {coursesWithSubmissions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {coursesWithSubmissions.map((course, index) => (
                    <div key={course.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                      <CourseCard course={course} router={router} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-2">No courses available</p>
                  <p className="text-sm text-muted-foreground">Courses will appear here once assigned</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div ref={sidebarRef} className="lg:col-span-1 space-y-4 sm:space-y-5">
            <div className="border border-border/50 p-4 sm:p-5 rounded-xl shadow-modern hover:shadow-modern-lg transition-all duration-500 hover-lift animate-slide-up backdrop-blur-sm bg-gradient-card">
              <h3 className="font-bold text-sm sm:text-base text-foreground mb-4 sm:mb-5 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Profile</h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <p>
                  <span className="font-semibold text-foreground">Name:</span>
                  <br />
                  <span className="text-muted-foreground break-words">{student?.name}</span>
                </p>
                <p>
                  <span className="font-semibold text-foreground">Email:</span>
                  <br />
                  <span className="text-muted-foreground break-all">{student?.email}</span>
                </p>
                <p>
                  <span className="font-semibold text-foreground">Track:</span>
                  <br />
                  <span className="text-muted-foreground break-words">{track?.name}</span>
                </p>
              </div>
            </div>
            {/* 1. Repository */}
            <div className="border border-border/50 p-4 sm:p-5 rounded-xl shadow-modern hover:shadow-modern-lg transition-all duration-500 hover-lift animate-slide-up backdrop-blur-sm bg-gradient-card">
              <h3 className="font-bold text-sm sm:text-base text-foreground mb-4 sm:mb-5 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Repository</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-5 leading-relaxed">
                Explore the LabShare codebase, architecture, and project structure. See how the platform works and track development progress.
              </p>
              <a
                href="https://github.com/TryOmar/LabShare"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 sm:px-5 py-2.5 text-xs sm:text-sm gradient-primary text-primary-foreground font-semibold text-center rounded-lg hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-primary hover:shadow-primary-lg"
              >
                Go to Repo
              </a>
            </div>

            {/* 2. Contribute */}
            <div className="border border-border/50 p-4 sm:p-5 rounded-xl shadow-modern hover:shadow-modern-lg transition-all duration-500 hover-lift animate-slide-up backdrop-blur-sm bg-gradient-card">
              <h3 className="font-bold text-sm sm:text-base text-foreground mb-4 sm:mb-5 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Contribute</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-5 leading-relaxed">
                Share feature ideas, improvements, or code contributions. Get publicly credited in the Last Updates section for your work.
              </p>
            {/* Disabled link: prevent accidental outbound navigation from the dashboard.
              Contributions should be made via PRs/issues on the repo — enable when ready. */}
            <a
              href="https://github.com/TryOmar/LabShare/issues/new"
              //onClick={(e) => e.preventDefault()}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-4 sm:px-5 py-2.5 text-xs sm:text-sm bg-primary text-primary-foreground font-semibold text-center rounded-lg hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-modern hover:shadow-modern-lg"

            >
              Contribute on GitHub
            </a>
            </div>

            {/* 3. Report */}
            <div className="border border-border/50 p-4 sm:p-5 rounded-xl shadow-modern hover:shadow-modern-lg transition-all duration-500 hover-lift animate-slide-up backdrop-blur-sm bg-gradient-card">
              <h3 className="font-bold text-sm sm:text-base text-foreground mb-4 sm:mb-5 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Report</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-5 leading-relaxed">
                Found a bug or have feedback? Submit reports anonymously or with contact info. No coding required.
              </p>
              <a
                href="https://forms.gle/25mEvcjTPrhA6THf9"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 sm:px-5 py-2.5 text-xs sm:text-sm gradient-primary text-primary-foreground font-semibold text-center rounded-lg hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-primary hover:shadow-primary-lg"
              >
                Submit Report
              </a>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <div className="border border-border/50 p-4 sm:p-5 rounded-xl cursor-pointer hover:bg-accent/30 transition-all duration-500 hover-lift shadow-modern hover:shadow-modern-lg animate-slide-up backdrop-blur-sm bg-gradient-card">
                  <h3 className="font-bold text-sm sm:text-base text-foreground mb-4 sm:mb-5 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Last Updates</h3>
                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-5">
                    <LastUpdates showTitle={false} maxItems={5} />
                  </div>
                  <div className="pt-3 sm:pt-4 border-t border-border/30">
                    <p className="text-xs text-muted-foreground text-center mb-3 font-medium">
                      Click to view all updates
                    </p>
                    <Link
                      href="/last-updates"
                      onClick={(e) => e.stopPropagation()}
                      className="block w-full px-4 sm:px-5 py-2.5 text-xs sm:text-sm gradient-primary text-primary-foreground font-semibold text-center rounded-lg hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-primary hover:shadow-primary-lg"
                    >
                      View Full Changelog
                    </Link>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto mx-4">
                <DialogHeader>
                  <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
                    Last Updates
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <LastUpdates showTitle={false} />
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <Link
                    href="/last-updates"
                    className="text-sm text-primary hover:underline font-semibold transition-colors duration-200"
                  >
                    View Full Page →
                  </Link>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}

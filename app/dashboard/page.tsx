"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
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

interface Course {
  id: string;
  name: string;
  description: string;
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

export default function DashboardPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
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
        setRecentSubmissions(data.recentSubmissions || []);
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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-black">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navigation student={student} track={track} />

      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Welcome, {student?.name}
          </h1>
          <p className="text-gray-600">
            {track?.name} • {student?.email}
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Courses Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-black mb-4">Your Courses</h2>
              <div className="space-y-2">
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => router.push(`/labs?course=${course.id}`)}
                      className="border border-black p-4 hover:bg-gray-50 cursor-pointer"
                    >
                      <h3 className="font-semibold text-black">
                        {course.name}
                      </h3>
                      {course.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {course.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No courses available</p>
                )}
              </div>
            </div>

            {/* Recent Submissions */}
            <div>
              <h2 className="text-xl font-bold text-black mb-4">
                Recent Uploads
              </h2>
              <div className="space-y-2">
                {recentSubmissions.length > 0 ? (
                  recentSubmissions.map((submission) => {
                    const isUserSubmission = submission.student_id === student?.id;
                    const isLocked = !submission.hasAccess;
                    return (
                      <div
                        key={submission.id}
                        onClick={() => {
                          if (!isLocked) {
                            router.push(`/submission/${submission.id}`);
                          }
                        }}
                        className={`border border-black p-4 relative ${
                          isLocked
                            ? "bg-gray-100 opacity-60 cursor-not-allowed"
                            : "hover:bg-gray-50 cursor-pointer"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                                {submission.labs?.courses?.name && (
                                  <span className="font-medium">
                                    {submission.labs.courses.name}
                                  </span>
                                )}
                                {submission.labs && (
                                  <>
                                    {submission.labs?.courses?.name && <span>•</span>}
                                    <span>
                                      {submission.labs.title.startsWith(`Lab ${submission.labs.lab_number}`) 
                                        ? submission.labs.title 
                                        : `Lab ${submission.labs.lab_number}: ${submission.labs.title}`}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={`font-semibold text-base ${isLocked ? "text-gray-500" : "text-black"}`}>
                                  {submission.title}
                                </h3>
                                {isLocked && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-gray-600 flex-shrink-0"
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
                                )}
                              </div>
                              <p className={`text-sm ${isLocked ? "text-gray-400" : "text-gray-600"}`}>
                                by {submission.students?.name}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 border border-black flex-shrink-0 ${
                            isLocked ? "bg-gray-200 text-gray-500" : "bg-gray-100"
                          }`}>
                            {submission.view_count} views
                          </span>
                        </div>
                        <p className={`text-xs mt-2 ${isLocked ? "text-gray-400" : "text-gray-500"}`}>
                          {new Date(submission.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-600">No submissions yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="border border-black p-4 mb-4">
              <h3 className="font-bold text-black mb-4">Profile</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold text-black">Name:</span>
                  <br />
                  <span className="text-gray-600">{student?.name}</span>
                </p>
                <p>
                  <span className="font-semibold text-black">Email:</span>
                  <br />
                  <span className="text-gray-600">{student?.email}</span>
                </p>
                <p>
                  <span className="font-semibold text-black">Track:</span>
                  <br />
                  <span className="text-gray-600">{track?.name}</span>
                </p>
              </div>
            </div>
            <div className="border border-black p-4">
              <h3 className="font-bold text-black mb-4">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Report issues, request assistance, or suggest improvements to the platform. We're here to help and listen to your feedback.
              </p>
              <a
                href="https://forms.gle/25mEvcjTPrhA6THf9"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-2 bg-black text-white font-semibold text-center hover:bg-gray-800"
              >
                Report Issue or Request Help
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

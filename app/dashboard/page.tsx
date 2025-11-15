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

interface Submission {
  id: string;
  student_id: string;
  lab_id: string;
  title: string;
  view_count: number;
  created_at: string;
  students?: Student;
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
                  recentSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      onClick={() => router.push(`/submission/${submission.id}`)}
                      className="border border-black p-4 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-black">
                            {submission.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            by {submission.students?.name}
                          </p>
                        </div>
                        <span className="text-xs bg-gray-100 px-2 py-1 border border-black">
                          {submission.view_count} views
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No submissions yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="border border-black p-4">
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
          </div>
        </div>
      </div>
    </div>
  );
}

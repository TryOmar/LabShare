"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Navigation from "@/components/navigation";

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

export default function LabsPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [labs, setLabs] = useState<Map<string, Lab[]>>(new Map());
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadLabs = async () => {
      try {
        // Fetch labs data from API route (server-side validation)
        const response = await fetch("/api/labs", {
          method: "GET",
          credentials: "include", // Include cookies
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Unauthorized - redirect to login
            router.push("/login");
            return;
          }
          throw new Error(`Failed to load labs: ${response.statusText}`);
        }

        const data = await response.json();
        
        setStudent(data.student);
        setTrack(data.track);
        setCourses(data.courses || []);
        
        // Convert labsByCourse object to Map
        const labsMap = new Map<string, Lab[]>();
        Object.entries(data.labsByCourse || {}).forEach(([courseId, labsList]) => {
          labsMap.set(courseId, labsList as Lab[]);
        });
        setLabs(labsMap);

        // Set first course as selected
        if (data.courses && data.courses.length > 0) {
          setSelectedCourse(data.courses[0].id);
        }
      } catch (err) {
        console.error("Error loading labs:", err);
        // On error, redirect to login as a fallback
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadLabs();
  }, [router]);

  const selectedLabs = selectedCourse ? labs.get(selectedCourse) : [];

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
        <h1 className="text-3xl font-bold text-black mb-6">Labs</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Courses Sidebar */}
          <div>
            <h2 className="font-bold text-black mb-4">Courses</h2>
            <div className="space-y-2">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course.id)}
                  className={`w-full text-left p-3 border border-black ${
                    selectedCourse === course.id
                      ? "bg-black text-white"
                      : "bg-white text-black hover:bg-gray-100"
                  }`}
                >
                  <p className="font-semibold text-sm">{course.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Labs List */}
          <div className="lg:col-span-3">
            {selectedLabs && selectedLabs.length > 0 ? (
              <div className="space-y-3">
                {selectedLabs.map((lab) => (
                  <div
                    key={lab.id}
                    onClick={() => router.push(`/lab/${lab.id}`)}
                    className="border border-black p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-black">
                          Lab {lab.lab_number}: {lab.title}
                        </h3>
                        {lab.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {lab.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 border border-black">
                        Lab {lab.lab_number}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No labs available for this course</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

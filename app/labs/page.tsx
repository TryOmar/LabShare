"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Navigation from "@/components/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

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
  hasSubmission?: boolean;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

        // Set first course as selected if no course param in URL
        const params = new URLSearchParams(window.location.search);
        const courseParam = params.get("course");
        if (courseParam && data.courses.some((c: Course) => c.id === courseParam)) {
          setSelectedCourse(courseParam);
        } else if (data.courses && data.courses.length > 0) {
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

      <div className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text animate-slide-up">Labs</h1>
          
          {/* Mobile Course Selector Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="lg:hidden border-border/50 bg-white/80 text-foreground hover:bg-accent/50 hover:border-primary/40 hover:text-primary shadow-modern backdrop-blur-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                {courses.find(c => c.id === selectedCourse)?.name || "Select Course"}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Courses</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {courses.map((course, index) => (
                  <button
                    key={course.id}
                    onClick={() => {
                      setSelectedCourse(course.id);
                      router.replace(`/labs?course=${course.id}`);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left p-3 border rounded-lg text-sm transition-all duration-300 ${
                      selectedCourse === course.id
                        ? "gradient-primary text-primary-foreground border-primary shadow-primary"
                        : "bg-white/80 text-foreground border-border/50 hover:bg-accent/50 hover:border-primary/40 shadow-modern backdrop-blur-sm"
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <p className="font-semibold break-words">{course.name}</p>
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Desktop Courses Sidebar */}
          <div className="hidden lg:block">
            <h2 className="font-bold text-sm sm:text-base text-foreground mb-3 sm:mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text animate-slide-up">Courses</h2>
            <div className="space-y-2">
              {courses.map((course, index) => (
                <button
                  key={course.id}
                  onClick={() => {
                    setSelectedCourse(course.id);
                    router.replace(`/labs?course=${course.id}`);
                  }}
                  className={`w-full text-left p-2 sm:p-3 border rounded-lg text-xs sm:text-sm transition-all duration-300 ${
                    selectedCourse === course.id
                      ? "gradient-primary text-primary-foreground border-primary shadow-primary"
                      : "bg-white/80 text-foreground border-border/50 hover:bg-accent/50 hover:border-primary/40 shadow-modern backdrop-blur-sm"
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <p className="font-semibold break-words">{course.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Labs List */}
          <div className="lg:col-span-3">
            {selectedLabs && selectedLabs.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {selectedLabs.map((lab, index) => {
                  const isLocked = !lab.hasSubmission;
                  return (
                    <div
                      key={lab.id}
                      onClick={() => {
                        if (!isLocked) {
                          router.push(`/lab/${lab.id}`);
                        } else {
                          router.push(`/lab/${lab.id}/locked`);
                        }
                      }}
                      className={`border border-border/50 p-3 sm:p-4 rounded-xl relative cursor-pointer transition-all duration-300 animate-fade-in ${
                        isLocked
                          ? "bg-muted/30 opacity-60"
                          : "bg-gradient-card hover:bg-accent/30 hover:border-primary/40 hover:shadow-modern backdrop-blur-sm shadow-modern"
                      }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex justify-between items-start gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold text-sm sm:text-base ${isLocked ? "text-muted-foreground" : "text-foreground"} break-words`}>
                              Lab {lab.lab_number}: {lab.title}
                            </h3>
                            {isLocked && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0"
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
                          {lab.description && (
                            <p className={`text-xs sm:text-sm mt-1 ${isLocked ? "text-muted-foreground/60" : "text-muted-foreground"} break-words`}>
                              {lab.description}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 border rounded-lg flex-shrink-0 whitespace-nowrap ${
                          isLocked 
                            ? "bg-muted/50 text-muted-foreground border-border/50" 
                            : "bg-primary/10 text-primary border-primary/30 font-medium"
                        }`}>
                          Lab {lab.lab_number}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm sm:text-base text-muted-foreground">No labs available for this course</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

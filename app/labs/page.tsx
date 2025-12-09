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
import { Accordion } from "@/components/ui/accordion";
import { LabAccordionItem } from "@/components/lab/LabAccordionItem";

/**
 * Course data structure
 */
interface Course {
  id: string;
  name: string;
  description: string;
}

/**
 * Lab data structure
 */
interface Lab {
  id: string;
  course_id: string;
  lab_number: number;
  title: string;
  description: string;
  hasSubmission?: boolean;
  submissionCount?: number;
  latestSubmissionDate?: string | null;
  topUpvotes?: number;
  totalViews?: number;
}

/**
 * Student data structure
 */
interface Student {
  id: string;
  name: string;
  email: string;
  track_id: string;
}

/**
 * Track data structure
 */
interface Track {
  id: string;
  code: string;
  name: string;
}

/**
 * LabsPage displays all available labs in an accordion format.
 * Users can expand labs to see submission previews without being redirected.
 * Only clicking on a specific submission triggers the lock check.
 */
export default function LabsPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [labs, setLabs] = useState<Map<string, Lab[]>>(new Map());
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [expandedLabs, setExpandedLabs] = useState<string[]>([]);
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
                      setExpandedLabs([]); // Reset expanded labs when switching courses
                      router.replace(`/labs?course=${course.id}`);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left p-3 border rounded-lg text-sm transition-all duration-300 ${selectedCourse === course.id
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
                    setExpandedLabs([]); // Reset expanded labs when switching courses
                    router.replace(`/labs?course=${course.id}`);
                  }}
                  className={`w-full text-left p-2 sm:p-3 border rounded-lg text-xs sm:text-sm transition-all duration-300 ${selectedCourse === course.id
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

          {/* Labs Accordion */}
          <div className="lg:col-span-3">
            {selectedLabs && selectedLabs.length > 0 ? (
              <Accordion
                type="multiple"
                value={expandedLabs}
                onValueChange={setExpandedLabs}
                className="space-y-0"
              >
                {selectedLabs.map((lab, index) => (
                  <LabAccordionItem
                    key={lab.id}
                    lab={lab}
                    index={index}
                    isExpanded={expandedLabs.includes(lab.id)}
                  />
                ))}
              </Accordion>
            ) : (
              <div className="border border-border/50 rounded-xl p-6 sm:p-8 bg-gradient-card shadow-modern backdrop-blur-sm text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-sm sm:text-base text-muted-foreground">
                  No labs available for this course
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

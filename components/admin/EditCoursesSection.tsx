"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CourseEditor } from "./CourseEditor";

interface Course {
    id: string;
    name: string;
    description: string;
    tracks: TrackOption[];
}

interface TrackOption {
    id: string;
    code: string;
    name: string;
}

/**
 * EditCoursesSection component for viewing and editing courses.
 * Lists all courses with edit capability.
 */
export function EditCoursesSection() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const loadCourses = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/admin/courses", {
                method: "GET",
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                setCourses(data.courses || []);
            }
        } catch (err) {
            console.error("Error loading courses:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
    }, []);

    const filteredCourses = courses.filter((course) =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCourseUpdated = () => {
        loadCourses();
        setSelectedCourse(null);
    };

    if (selectedCourse) {
        return (
            <CourseEditor
                course={selectedCourse}
                onBack={() => setSelectedCourse(null)}
                onUpdated={handleCourseUpdated}
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="border border-border/50 p-4 sm:p-6 rounded-xl shadow-modern backdrop-blur-sm bg-gradient-card">
                <div className="mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">Edit Courses</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Select a course to edit its details, tracks, and labs.
                    </p>
                </div>

                <div className="mb-4">
                    <Label htmlFor="search-courses" className="sr-only">
                        Search courses
                    </Label>
                    <Input
                        id="search-courses"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search courses..."
                        className="max-w-md"
                    />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="spinner h-5 w-5"></div>
                        <span className="ml-2 text-muted-foreground">Loading courses...</span>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No courses found matching your search." : "No courses available."}
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredCourses.map((course) => (
                            <button
                                key={course.id}
                                onClick={() => setSelectedCourse(course)}
                                className="text-left p-4 rounded-lg border border-border/50 bg-white/80 hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 shadow-modern"
                            >
                                <h3 className="font-semibold text-foreground truncate">{course.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {course.description || "No description"}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {course.tracks.map((track) => (
                                        <span
                                            key={track.id}
                                            className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                                        >
                                            {track.code}
                                        </span>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

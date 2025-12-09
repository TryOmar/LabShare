"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface Message {
    type: "success" | "error";
    text: string;
}

/**
 * ManageCoursesSection component for managing courses.
 * Combines listing, adding, and editing courses in a unified interface.
 */
export function ManageCoursesSection() {
    // List/Edit State
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Add Form State
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
    const [tracks, setTracks] = useState<TrackOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [coursesRes, tracksRes] = await Promise.all([
                fetch("/api/admin/courses", { method: "GET", credentials: "include" }),
                fetch("/api/tracks", { method: "GET", credentials: "include" })
            ]);

            if (coursesRes.ok) {
                const data = await coursesRes.json();
                setCourses(data.courses || []);
            }

            if (tracksRes.ok) {
                const data = await tracksRes.json();
                setTracks(data.tracks || []);
            }
        } catch (err) {
            console.error("Error loading data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredCourses = courses.filter((course) =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleTrackToggle = (trackId: string) => {
        setSelectedTracks((prev) =>
            prev.includes(trackId)
                ? prev.filter((id) => id !== trackId)
                : [...prev, trackId]
        );
    };

    const handleAddCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch("/api/admin/courses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: newName.trim(),
                    description: newDescription.trim(),
                    trackIds: selectedTracks,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({
                    type: "success",
                    text: data.message || "Course added successfully!",
                });
                setNewName("");
                setNewDescription("");
                setSelectedTracks([]);
                setShowAddForm(false);
                loadData(); // Reload list
            } else {
                setMessage({
                    type: "error",
                    text: data.message || data.error || "Failed to add course",
                });
            }
        } catch (error: any) {
            setMessage({
                type: "error",
                text: error.message || "An error occurred",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCourseUpdated = () => {
        loadData();
        setSelectedCourse(null);
    };

    const handleCourseDeleted = () => {
        loadData();
        setSelectedCourse(null);
        setMessage({ type: "success", text: "Course deleted successfully!" });
    };

    // If editing a course, show the editor
    if (selectedCourse) {
        return (
            <CourseEditor
                course={selectedCourse}
                tracks={tracks}
                onBack={() => setSelectedCourse(null)}
                onUpdated={handleCourseUpdated}
                onDeleted={handleCourseDeleted}
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="border border-border/50 p-4 sm:p-6 rounded-xl shadow-modern backdrop-blur-sm bg-gradient-card">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-foreground">
                            Manage Courses
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            View, add, and manage courses.
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className={showAddForm
                            ? "border-red-300 text-red-600 bg-red-50 hover:bg-red-100"
                            : "gradient-primary text-primary-foreground hover:gradient-primary-hover"}
                        variant={showAddForm ? "outline" : "default"}
                    >
                        {showAddForm ? "Cancel" : "+ Add Course"}
                    </Button>
                </div>

                {/* Add Course Form */}
                {showAddForm && (
                    <form onSubmit={handleAddCourse} className="mb-6 p-4 bg-accent/30 rounded-lg border border-border/50 animate-slide-up">
                        <h3 className="text-base font-semibold text-foreground mb-4">Add New Course</h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="new-course-name" className="text-sm font-semibold">
                                    Course Name
                                </Label>
                                <Input
                                    id="new-course-name"
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required
                                    className="mt-1"
                                    placeholder="Enter course name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="new-course-desc" className="text-sm font-semibold">
                                    Description
                                </Label>
                                <Textarea
                                    id="new-course-desc"
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    className="mt-1 min-h-[80px]"
                                    placeholder="Enter description (optional)"
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-semibold block mb-2">
                                    Assign to Tracks
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {tracks.map((track) => (
                                        <button
                                            key={track.id}
                                            type="button"
                                            onClick={() => handleTrackToggle(track.id)}
                                            className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${selectedTracks.includes(track.id)
                                                ? "bg-primary text-primary-foreground border-primary shadow-modern"
                                                : "bg-white/80 text-foreground border-border/50 hover:border-primary/30 hover:bg-accent/50"
                                                }`}
                                        >
                                            {track.code}
                                        </button>
                                    ))}
                                    {tracks.length === 0 && (
                                        <p className="text-sm text-muted-foreground">Loading tracks...</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-2">
                            <Button
                                type="submit"
                                disabled={submitting || !newName.trim() || selectedTracks.length === 0}
                                className="gradient-primary text-primary-foreground"
                            >
                                {submitting ? "Adding..." : "Add Course"}
                            </Button>
                        </div>
                    </form>
                )}

                {/* Message */}
                {message && (
                    <div
                        className={`mb-4 p-4 rounded-lg border ${message.type === "success"
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-red-50 border-red-200 text-red-800"
                            }`}
                    >
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                {/* Search Bar */}
                <div className="mb-4">
                    <Label htmlFor="search-courses" className="sr-only">Search courses</Label>
                    <Input
                        id="search-courses"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search courses..."
                        className="max-w-md w-full"
                    />
                </div>

                {/* Courses Grid */}
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
                                className="group text-left p-4 rounded-lg border border-border/50 bg-white/80 hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 shadow-modern relative overflow-hidden flex flex-col items-start"
                            >
                                <div className="w-full">
                                    <h3 className="font-semibold text-foreground truncate pr-2">{course.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 min-h-[2.5em]">
                                        {course.description || "No description"}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-3">
                                        {course.tracks.map((track) => (
                                            <span
                                                key={track.id}
                                                className="text-xs px-2 py-0.5 bg-secondary/50 text-secondary-foreground border border-border/10 rounded-full"
                                            >
                                                {track.code}
                                            </span>
                                        ))}
                                        {course.tracks.length === 0 && (
                                            <span className="text-xs text-muted-foreground italic">No tracks assigned</span>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4 w-full pt-3 border-t border-border/30 flex justify-end">
                                    <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        Edit Details
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

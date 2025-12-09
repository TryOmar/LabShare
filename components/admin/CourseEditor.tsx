"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CourseLabsEditor } from "./CourseLabsEditor";

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

interface CourseEditorProps {
    course: Course;
    onBack: () => void;
    onUpdated: () => void;
    onDeleted?: () => void;
}

/**
 * CourseEditor component for editing course details.
 * Delegates lab management to CourseLabsEditor.
 */
export function CourseEditor({ course, onBack, onUpdated, onDeleted }: CourseEditorProps) {
    const [name, setName] = useState(course.name);
    const [description, setDescription] = useState(course.description || "");
    const [selectedTracks, setSelectedTracks] = useState<string[]>(
        course.tracks.map((t) => t.id)
    );
    const [allTracks, setAllTracks] = useState<TrackOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);

    useEffect(() => {
        const loadTracks = async () => {
            try {
                const response = await fetch("/api/tracks", { method: "GET", credentials: "include" });
                if (response.ok) {
                    const data = await response.json();
                    setAllTracks(data.tracks || []);
                }
            } catch (err) {
                console.error("Error loading tracks:", err);
            }
        };

        loadTracks();
    }, []);

    const handleTrackToggle = (trackId: string) => {
        setSelectedTracks((prev) =>
            prev.includes(trackId)
                ? prev.filter((id) => id !== trackId)
                : [...prev, trackId]
        );
    };

    const handleSaveCourse = async () => {
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch(`/api/admin/courses/${course.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim(),
                    trackIds: selectedTracks,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: "success", text: "Course updated successfully!" });
                onUpdated();
            } else {
                setMessage({
                    type: "error",
                    text: data.message || data.error || "Failed to update course",
                });
            }
        } catch (error: any) {
            setMessage({
                type: "error",
                text: error.message || "An error occurred while updating the course",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCourse = async () => {
        if (!confirm(`Are you sure you want to delete "${course.name}"? This will delete all labs and student data associated with this course! This action cannot be undone.`)) {
            return;
        }

        setDeleting(true);
        try {
            const response = await fetch(`/api/admin/courses/${course.id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (response.ok) {
                if (onDeleted) {
                    onDeleted();
                } else {
                    onBack();
                }
            } else {
                const data = await response.json();
                setMessage({
                    type: "error",
                    text: data.error || data.message || "Failed to delete course",
                });
            }
        } catch (error: any) {
            setMessage({
                type: "error",
                text: "An error occurred while deleting the course",
            });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
                Back to Courses
            </button>

            {/* Course Details */}
            <div className="border border-border/50 p-4 sm:p-6 rounded-xl shadow-modern backdrop-blur-sm bg-gradient-card">
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">
                    Edit Course Details
                </h2>

                <div className="space-y-4 max-w-2xl">
                    <div>
                        <Label htmlFor="edit-course-name" className="text-sm font-semibold text-foreground">
                            Course Name
                        </Label>
                        <Input
                            id="edit-course-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <Label htmlFor="edit-course-description" className="text-sm font-semibold text-foreground">
                            Description
                        </Label>
                        <Textarea
                            id="edit-course-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-2 min-h-[100px]"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-semibold text-foreground">Assigned Tracks</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {allTracks.map((track) => (
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
                        </div>
                    </div>

                    {message && (
                        <div
                            className={`p-4 rounded-lg border ${message.type === "success"
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-red-50 border-red-200 text-red-800"
                                }`}
                        >
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    )}

                    <div className="flex items-center gap-4 pt-2">
                        <Button
                            onClick={handleSaveCourse}
                            disabled={submitting || !name.trim()}
                            className="gradient-primary text-primary-foreground hover:gradient-primary-hover flex-1 md:flex-none md:min-w-[120px]"
                        >
                            {submitting ? "Saving..." : "Save Changes"}
                        </Button>

                        <div className="flex-1"></div>

                        <Button
                            onClick={handleDeleteCourse}
                            disabled={deleting}
                            variant="destructive"
                            className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300"
                        >
                            {deleting ? "Deleting..." : "Delete Course"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Labs Section - Delegated */}
            <CourseLabsEditor courseId={course.id} />
        </div>
    );
}

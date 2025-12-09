"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
 * AddCourseForm component for adding new courses to the platform.
 * Allows assigning courses to one or more tracks.
 */
export function AddCourseForm() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
    const [tracks, setTracks] = useState<TrackOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);

    useEffect(() => {
        const loadTracks = async () => {
            try {
                const response = await fetch("/api/tracks", {
                    method: "GET",
                    credentials: "include",
                });

                if (response.ok) {
                    const data = await response.json();
                    setTracks(data.tracks || []);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch("/api/admin/courses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim(),
                    trackIds: selectedTracks,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({
                    type: "success",
                    text: data.message || "Course added successfully!",
                });
                setName("");
                setDescription("");
                setSelectedTracks([]);
            } else {
                setMessage({
                    type: "error",
                    text: data.message || data.error || "Failed to add course",
                });
            }
        } catch (error: any) {
            setMessage({
                type: "error",
                text: error.message || "An error occurred while adding the course",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="border border-border/50 p-4 sm:p-6 rounded-xl shadow-modern backdrop-blur-sm bg-gradient-card max-w-2xl">
            <div className="mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Add Course</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Create a new course and assign it to one or more tracks.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="course-name" className="text-sm font-semibold text-foreground">
                        Course Name
                    </Label>
                    <Input
                        id="course-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="mt-2"
                        placeholder="Enter course name"
                    />
                </div>

                <div>
                    <Label htmlFor="course-description" className="text-sm font-semibold text-foreground">
                        Description
                    </Label>
                    <Textarea
                        id="course-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-2 min-h-[100px]"
                        placeholder="Enter course description (optional)"
                    />
                </div>

                <div>
                    <Label className="text-sm font-semibold text-foreground">
                        Assign to Tracks
                    </Label>
                    <div className="mt-2 flex flex-wrap gap-2">
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
                    </div>
                    {tracks.length === 0 && (
                        <p className="mt-2 text-sm text-muted-foreground">Loading tracks...</p>
                    )}
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

                <Button
                    type="submit"
                    disabled={submitting || !name.trim() || selectedTracks.length === 0}
                    className="w-full py-3 px-6 text-sm sm:text-base font-semibold rounded-lg transition-all duration-300 gradient-primary text-primary-foreground hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] shadow-primary hover:shadow-primary-lg disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100"
                >
                    {submitting ? "Adding..." : "Add Course"}
                </Button>
            </form>
        </div>
    );
}

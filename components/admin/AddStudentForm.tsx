"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
 * AddStudentForm component for adding new students to the platform.
 * Reusable form that can be embedded in the Admin Dashboard.
 */
export function AddStudentForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [trackCode, setTrackCode] = useState("");
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch("/api/admin/students", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    trackCode: trackCode.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({
                    type: "success",
                    text: data.message || "Student added successfully and welcome email sent!",
                });
                setName("");
                setEmail("");
                setTrackCode("");
            } else {
                setMessage({
                    type: "error",
                    text: data.message || data.error || "Failed to add student",
                });
            }
        } catch (error: any) {
            setMessage({
                type: "error",
                text: error.message || "An error occurred while adding the student",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="border border-border/50 p-4 sm:p-6 rounded-xl shadow-modern backdrop-blur-sm bg-gradient-card max-w-2xl">
            <div className="mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Add Student</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Add a new student to the platform. They will receive a welcome email.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="student-name" className="text-sm font-semibold text-foreground">
                        Name
                    </Label>
                    <Input
                        id="student-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="mt-2"
                        placeholder="Enter student name"
                    />
                </div>

                <div>
                    <Label htmlFor="student-email" className="text-sm font-semibold text-foreground">
                        Email
                    </Label>
                    <Input
                        id="student-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-2"
                        placeholder="Enter student email"
                    />
                </div>

                <div>
                    <Label htmlFor="student-track" className="text-sm font-semibold text-foreground">
                        Track
                    </Label>
                    <select
                        id="student-track"
                        value={trackCode}
                        onChange={(e) => setTrackCode(e.target.value)}
                        required
                        className="mt-2 w-full p-3 text-sm sm:text-base border border-border/50 bg-white/80 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 shadow-modern backdrop-blur-sm hover:border-primary/30"
                    >
                        <option value="">Choose a track...</option>
                        {tracks.map((trackOption) => (
                            <option key={trackOption.id} value={trackOption.code}>
                                {trackOption.name} ({trackOption.code})
                            </option>
                        ))}
                    </select>
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
                    disabled={submitting || !name.trim() || !email.trim() || !trackCode.trim()}
                    className="w-full py-3 px-6 text-sm sm:text-base font-semibold rounded-lg transition-all duration-300 gradient-primary text-primary-foreground hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] shadow-primary hover:shadow-primary-lg disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100"
                >
                    {submitting ? "Adding..." : "Add Student"}
                </Button>
            </form>
        </div>
    );
}

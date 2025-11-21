"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

interface TrackOption {
  id: string;
  code: string;
  name: string;
}

export default function AddStudentPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [trackCode, setTrackCode] = useState("");
  const [tracks, setTracks] = useState<TrackOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Feedback messages
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check authentication
        const authResponse = await fetch("/api/auth/status", {
          method: "GET",
          credentials: "include",
        });

        if (!authResponse.ok) {
          router.push("/login");
          return;
        }

        const authData = await authResponse.json();
        if (!authData.authenticated) {
          router.push("/login");
          return;
        }

        // Check admin status
        const adminResponse = await fetch("/api/admin/status", {
          method: "GET",
          credentials: "include",
        });

        if (!adminResponse.ok) {
          router.push("/dashboard");
          return;
        }

        const adminData = await adminResponse.json();
        if (!adminData.isAdmin) {
          router.push("/dashboard");
          return;
        }

        setIsAdmin(true);

        // Load dashboard data for navigation
        const dashboardResponse = await fetch("/api/dashboard", {
          method: "GET",
          credentials: "include",
        });

        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          setStudent(dashboardData.student);
          setTrack(dashboardData.track);
        }

        // Load tracks
        const tracksResponse = await fetch("/api/tracks", {
          method: "GET",
          credentials: "include",
        });

        if (tracksResponse.ok) {
          const tracksData = await tracksResponse.json();
          setTracks(tracksData.tracks || []);
        }
      } catch (err) {
        console.error("Error checking access:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [router]);

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
        // Reset form
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

  if (isAdmin === false) {
    return null; // Will redirect
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-white via-white to-accent/10 animate-fade-in">
      <Navigation student={student} track={track} />

      <div className="flex-1 p-4 sm:p-6 w-full max-w-2xl mx-auto">
        <div className="mb-6 sm:mb-8 px-2 sm:px-4 animate-slide-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Add Student
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Add a new student to the platform
          </p>
        </div>

        <div className="border border-border/50 p-4 sm:p-6 rounded-xl shadow-modern backdrop-blur-sm bg-gradient-card animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2"
                placeholder="Enter student name"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2"
                placeholder="Enter student email"
              />
            </div>

            <div>
              <Label htmlFor="track" className="text-sm font-semibold text-foreground">
                Track
              </Label>
              <select
                id="track"
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
                className={`p-4 rounded-lg border ${
                  message.type === "success"
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
      </div>
    </div>
  );
}


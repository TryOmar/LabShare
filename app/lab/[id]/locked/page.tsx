"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from 'next/navigation';
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

interface Lab {
  id: string;
  course_id: string;
  lab_number: number;
  title: string;
  description: string;
}

export default function LockedLabPage() {
  const [lab, setLab] = useState<Lab | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();
  const params = useParams();
  const labId = params.id as string;

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get student info for navigation
        const authResponse = await fetch("/api/auth/status", {
          method: "GET",
          credentials: "include",
        });

        if (authResponse.ok) {
          const authData = await authResponse.json();
          if (authData.authenticated && authData.student) {
            setStudent(authData.student);
            // Get track info
            const dashboardResponse = await fetch("/api/dashboard", {
              method: "GET",
              credentials: "include",
            });
            if (dashboardResponse.ok) {
              const dashboardData = await dashboardResponse.json();
              setTrack(dashboardData.track);
            }
          }
        }

        // Get lab info - use upload=true to get lab info even if locked
        const labResponse = await fetch(`/api/lab/${labId}?upload=true`, {
          method: "GET",
          credentials: "include",
        });

        if (labResponse.ok) {
          const labData = await labResponse.json();
          setLab(labData.lab);
        } else if (labResponse.status === 403) {
          // If still 403, try to get lab info from labs endpoint
          const labsResponse = await fetch("/api/labs", {
            method: "GET",
            credentials: "include",
          });
          if (labsResponse.ok) {
            const labsData = await labsResponse.json();
            // Find the lab in the labs data
            const allLabs: Lab[] = [];
            Object.values(labsData.labsByCourse || {}).forEach((labs: any) => {
              allLabs.push(...labs);
            });
            const foundLab = allLabs.find((l: Lab) => l.id === labId);
            if (foundLab) {
              setLab(foundLab);
            }
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [labId]);

  const handleContinue = () => {
    // Redirect to lab page with upload parameter
    router.push(`/lab/${labId}?upload=true`);
  };

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

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="border-2 border-gray-300 bg-gray-50 p-8">
          <div className="flex items-center gap-4 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-600"
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
            <h1 className="text-3xl font-bold text-black">
              Lab {lab?.lab_number} — Locked
            </h1>
          </div>

          <div className="mb-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              You must <span className="font-bold">complete</span> this lab and have it <span className="font-bold">reviewed</span> by the <span className="font-bold">instructor</span> before you can access other students' submissions.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mt-3">
              Once you finish and review it, you can upload your work here.
            </p>
          </div>

          <div className="mb-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-5 h-5 border-2 border-black cursor-pointer"
              />
              <span className="text-base text-gray-700">
                I confirm I've <span className="font-bold">completed</span> and <span className="font-bold">reviewed</span> this lab with the <span className="font-bold">instructor</span>.
              </span>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleContinue}
              disabled={!confirmed}
              className={`px-6 py-3 font-semibold transition-colors ${
                confirmed
                  ? "bg-black text-white hover:bg-gray-800"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Continue
            </button>
            <button
              onClick={() => router.push("/labs")}
              className="px-6 py-3 border border-black text-black font-semibold hover:bg-gray-50"
            >
              Back to Labs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LastUpdates from "@/components/last-updates";

export default function LastUpdatesPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const authResponse = await fetch("/api/auth/status", {
          method: "GET",
          credentials: "include",
        });

        if (!authResponse.ok || !(await authResponse.json()).authenticated) {
          // Not authenticated, redirect to login
          router.push("/login");
          return;
        }
      } catch (err) {
        console.error("Error checking auth:", err);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-black">Last Updates</h1>
            <Link
              href="/dashboard"
              className="text-black hover:underline text-sm font-semibold"
            >
              ← Back to Dashboard
            </Link>
          </div>
          <p className="text-gray-600">
            A chronological list of recent features and improvements to LabShare.
          </p>
        </div>

        {/* Updates List */}
        <div className="border border-black p-6 mb-6">
          <LastUpdates showTitle={false} />
        </div>

        {/* Call to Action */}
        <div className="border border-black p-4 bg-gray-50">
          <p className="text-xs text-gray-700 mb-3">
            Want to see your name here? Contribute and get credited in Last Updates.
          </p>
          <div className="flex gap-2">
            <a
              href="https://github.com/TryOmar/LabShare"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-1.5 bg-black text-white text-xs font-semibold text-center hover:bg-gray-800"
            >
              View Repo
            </a>
            <a
              href="https://github.com/TryOmar/LabShare/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-1.5 border border-black text-black text-xs font-semibold text-center hover:bg-gray-100"
            >
              Suggest / Fix
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}


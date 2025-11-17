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
        <div className="border border-black p-6">
          <LastUpdates showTitle={false} />
        </div>
      </div>
    </div>
  );
}


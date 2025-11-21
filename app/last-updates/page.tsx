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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-white via-white to-accent/10 animate-fade-in">
      <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Last Updates</h1>
            <Link
              href="/dashboard"
              className="text-sm sm:text-base text-primary hover:text-primary/80 underline font-semibold whitespace-nowrap transition-colors duration-200"
            >
              ← Back to Dashboard
            </Link>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            A chronological list of recent features and improvements to LabShare.
          </p>
        </div>

        {/* Updates List */}
        <div className="border border-border/50 p-5 sm:p-7 mb-5 sm:mb-6 rounded-xl shadow-modern hover:shadow-modern-lg transition-shadow duration-300 backdrop-blur-sm bg-gradient-card animate-slide-up">
          <LastUpdates showTitle={false} />
        </div>

        {/* Call to Action */}
        <div className="border border-border/50 p-4 sm:p-5 bg-gradient-card rounded-xl shadow-modern hover:shadow-modern-lg transition-shadow duration-300 backdrop-blur-sm animate-slide-up">
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 font-medium">
            Want to see your name here? Contribute and get credited in Last Updates.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <a
              href="https://github.com/TryOmar/LabShare"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2.5 gradient-primary text-primary-foreground text-xs font-semibold text-center rounded-lg hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-primary hover:shadow-primary-lg"
            >
              View Repo
            </a>
            <a
              href="https://github.com/TryOmar/LabShare/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2.5 border border-border/50 text-foreground text-xs font-semibold text-center rounded-lg hover:bg-accent/50 hover:border-primary/40 hover:text-primary transition-all duration-300 shadow-modern hover:shadow-primary/10 backdrop-blur-sm"
            >
              Suggest / Fix
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}


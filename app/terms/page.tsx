"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const acceptedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const authResponse = await fetch("/api/auth/status", {
          method: "GET",
          credentials: "include",
        });

        if (!authResponse.ok) {
          // Not authenticated, redirect to login
          router.push("/login");
          return;
        }

        const authData = await authResponse.json();
        if (!authData.authenticated) {
          // Not authenticated, redirect to login
          router.push("/login");
          return;
        }

        // User is authenticated - show the terms page
        setLoading(false);
      } catch (err) {
        console.error("Error checking auth:", err);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  // Auto-logout if user tries to leave without accepting
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!acceptedRef.current) {
        // User is trying to leave without accepting - logout
        // Use fetch with keepalive for reliable delivery during page unload
        fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
          keepalive: true,
        }).catch(() => {
          // Ignore errors - page is unloading
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleAccept = () => {
    if (!agreed) return;

    // Mark as accepted to prevent logout
    acceptedRef.current = true;

    // Check for post-login redirect
    const storedRedirect = sessionStorage.getItem('postLoginRedirect');
    if (storedRedirect) {
      sessionStorage.removeItem('postLoginRedirect');

      // Validate it's a safe internal redirect
      // Normalize backslashes to forward slashes
      const normalized = storedRedirect.replace(/\\/g, '/');

      // Must start with single / and not contain protocol
      if (
        normalized.startsWith('/') &&
        !normalized.startsWith('//') &&
        !normalized.includes('://') &&
        !normalized.includes('/\\')
      ) {
        router.push(normalized);
        return;
      }
    }

    // Default to dashboard
    router.push("/dashboard");
  };

  // Show loading while checking authentication and terms status
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-white to-accent/20 p-4 sm:p-6 animate-fade-in">
      <div className="w-full max-w-3xl animate-scale-in">
        <div className="border-2 border-border/50 bg-gradient-card p-6 sm:p-8 lg:p-10 rounded-2xl shadow-modern-xl backdrop-blur-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-5 sm:mb-7 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Welcome to LabShare
          </h1>

          <div className="space-y-5 sm:space-y-7 mb-7 sm:mb-9">
            <div className="animate-slide-up">
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Platform Purpose
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                LabShare is designed to improve learning by creating a collaborative environment
                where students can learn from each other and provide constructive feedback.
                This platform encourages peer learning and helps you grow through shared knowledge
                and experiences.
              </p>
            </div>

            <div className="animate-slide-up">
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Your Commitment
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4 sm:mb-5">
                To maintain the integrity of the learning process and ensure everyone benefits
                from this platform, you must agree to the following:
              </p>
              <ul className="list-disc list-inside space-y-2.5 text-sm sm:text-base text-muted-foreground ml-2 sm:ml-4">
                <li>
                  <strong className="text-foreground">Complete and upload your work:</strong> Finish each lab assignment, have it <strong className="text-foreground">reviewed by an instructor</strong>,
                  then upload your solution before accessing other students' submissions.
                </li>
                <li>
                  <strong className="text-foreground">Learn from each other:</strong> Use this platform to learn from your peers'
                  approaches and solutions, not to copy them.
                </li>
                <li>
                  <strong className="text-foreground">Respect everyone:</strong> Maintain a respectful and positive learning environment.
                  Sharing feedback is optional but encouraged.
                </li>
              </ul>
            </div>

            <div className="bg-muted/50 border border-border/30 p-4 sm:p-5 rounded-xl backdrop-blur-sm animate-slide-up">
              <p className="text-sm sm:text-base text-muted-foreground font-medium">
                By proceeding, you acknowledge that you understand and agree to these terms.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground mt-3">
                Want to learn more about LabShare?{" "}
                <a
                  href="/about"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline font-semibold transition-colors duration-300"
                >
                  Read our documentation →
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-7 p-3 rounded-lg hover:bg-accent/30 transition-colors duration-200 animate-slide-up">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-primary rounded cursor-pointer text-primary focus:ring-2 focus:ring-primary/50 transition-all duration-200"
            />
            <label htmlFor="agree" className="text-sm sm:text-base text-foreground font-semibold cursor-pointer">
              I understand and agree to these terms
            </label>
          </div>

          <button
            onClick={handleAccept}
            disabled={!agreed}
            className="w-full px-5 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base gradient-primary text-primary-foreground font-semibold rounded-lg hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-primary hover:shadow-primary-lg animate-slide-up"
          >
            I Agree - Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}


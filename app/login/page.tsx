"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authResponse = await fetch("/api/auth/status", {
          method: "GET",
          credentials: "include",
        });

        if (authResponse.ok) {
          const authData = await authResponse.json();
          if (authData.authenticated) {
            // User is already logged in, redirect to dashboard (no need to show terms)
            router.push("/dashboard");
            return;
          }
        }
      } catch (err) {
        console.error("Error checking auth status:", err);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Request OTP via API (all DB operations happen server-side)
      const response = await fetch("/api/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to request code");
        } else {
          const text = await response.text();
          throw new Error("Failed to request code. Please try again.");
        }
      }

      const responseData = await response.json();
      // Log success without exposing sensitive data
      if (process.env.NODE_ENV === "development") {
        console.log("✅ OTP requested successfully");
      }

      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Verify OTP via API (all DB operations happen server-side)
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Invalid or expired code");
        } else {
          throw new Error("Failed to verify code. Please try again.");
        }
      }

      const responseData = await response.json();
      // Log success without exposing sensitive data (studentId, email)
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Code verified successfully");
      }

      // Cookies are set by the server (httpOnly, secure, 7 days expiration)
      // No need to store in localStorage - the cookie persists across sessions
      // Redirect to terms page first (will redirect to dashboard if already accepted)
      router.push("/terms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (checkingAuth) {
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
      <div className="w-full max-w-md animate-scale-in">
        <div className="bg-gradient-card border border-border/50 p-6 sm:p-8 lg:p-10 rounded-2xl shadow-modern-xl backdrop-blur-sm">
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <div className="h-16 w-16 sm:h-20 sm:w-20 mb-4 flex items-center justify-center">
              <img
                src="/icon.png"
                alt="Lab Sharing Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  // Fallback to PNG if SVG fails
                  const target = e.target as HTMLImageElement;
                  target.src = "/android-chrome-192x192.png";
                }}
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Lab Sharing
            </h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
            A collaborative learning platform where students share lab
            solutions, learn from each other, and provide constructive feedback.
            Complete your labs, review with your instructor, then explore peer
            solutions to enhance your understanding.
          </p>

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit}>
              <div className="mb-4 sm:mb-5">
                <label className="block text-sm sm:text-base text-foreground font-semibold mb-2.5">
                  ITI Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@iti.edu.eg"
                  className="w-full px-3 py-2 text-sm sm:text-base border border-border/50 bg-white/80 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-modern transition-all duration-300 backdrop-blur-sm hover:border-primary/30"
                  required
                />
              </div>
              {error && (
                <div className="mb-4 sm:mb-5 animate-slide-up">
                  <p className="text-xs sm:text-sm text-destructive mb-3 font-medium">
                    {error}
                  </p>
                  {error === "Email not found in student database" && (
                    <div className="bg-muted/50 border border-border/30 p-4 sm:p-5 text-xs sm:text-sm text-muted-foreground rounded-xl backdrop-blur-sm">
                      <p className="mb-3 sm:mb-4 leading-relaxed">
                        Email not registered. Submit your ITI email through our
                        form to request access.
                      </p>
                      <a
                        href="https://forms.gle/yUSfPU1Vo4aHQKud7"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 underline font-semibold break-words transition-colors duration-300"
                      >
                        Submit Email Registration Form →
                      </a>
                    </div>
                  )}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-primary-foreground font-semibold py-3 sm:py-3.5 text-sm sm:text-base rounded-lg hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-primary hover:shadow-primary-lg"
              >
                {loading ? "Sending code..." : "Send Login Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit}>
              <div className="mb-4 sm:mb-5">
                <label className="block text-sm sm:text-base text-foreground font-semibold mb-2.5">
                  Enter Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-border/50 bg-white/80 text-foreground text-center text-2xl sm:text-3xl tracking-[0.5em] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-modern transition-all duration-300 backdrop-blur-sm hover:border-primary/30"
                  required
                />
              </div>
              {error && (
                <p className="text-xs sm:text-sm text-destructive mb-4 sm:mb-5 animate-slide-up font-medium">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full gradient-primary text-primary-foreground font-semibold py-3 sm:py-3.5 text-sm sm:text-base rounded-lg hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-primary hover:shadow-primary-lg"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
                className="w-full mt-3 text-sm sm:text-base text-muted-foreground hover:text-primary underline transition-colors duration-300 font-medium"
              >
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

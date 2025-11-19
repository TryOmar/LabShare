"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

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
            // User is authenticated, check if terms are accepted
            const termsResponse = await fetch("/api/auth/check-terms", {
              method: "GET",
              credentials: "include",
            });

            if (termsResponse.ok) {
              const termsData = await termsResponse.json();
              if (termsData.termsAccepted) {
                // Both authenticated and terms accepted, go directly to dashboard
                router.push("/dashboard");
                return;
              } else {
                // Authenticated but terms not accepted, go to terms
                router.push("/terms");
                return;
              }
            }
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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-black">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-white p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="bg-white border border-black p-4 sm:p-6 lg:p-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-black">
            Lab Sharing
          </h1>
          <p className="text-xs sm:text-sm text-gray-700 mb-4 sm:mb-6 leading-relaxed">
            A collaborative learning platform where students share lab solutions, learn from each other, 
            and provide constructive feedback. Complete your labs, review with your instructor, then 
            explore peer solutions to enhance your understanding.
          </p>

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit}>
              <div className="mb-3 sm:mb-4">
                <label className="block text-sm sm:text-base text-black font-semibold mb-2">
                  ITI Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email you used to register in the ITI"
                  className="w-full px-3 py-2 text-sm sm:text-base border border-black bg-white text-black"
                  required
                />
              </div>
              {error && (
                <div className="mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-red-600 mb-2">{error}</p>
                  {error === "Email not found in student database" && (
                    <div className="bg-gray-50 border border-gray-300 p-3 sm:p-4 text-xs sm:text-sm text-gray-700">
                      <p className="mb-2 sm:mb-3">
                        Email not registered. Submit your ITI email through our form to request access.
                      </p>
                      <a
                        href="https://forms.gle/yUSfPU1Vo4aHQKud7"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-semibold break-words"
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
                className="w-full bg-black text-white font-semibold py-2 sm:py-2.5 text-sm sm:text-base hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? "Sending code..." : "Send Login Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit}>
              <div className="mb-3 sm:mb-4">
                <label className="block text-sm sm:text-base text-black font-semibold mb-2">
                  Enter Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-black bg-white text-black text-center text-xl sm:text-2xl tracking-widest"
                  required
                />
              </div>
              {error && <p className="text-xs sm:text-sm text-red-600 mb-3 sm:mb-4">{error}</p>}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-black text-white font-semibold py-2 sm:py-2.5 text-sm sm:text-base hover:bg-gray-800 disabled:opacity-50"
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
                className="w-full mt-2 text-sm sm:text-base text-black underline"
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

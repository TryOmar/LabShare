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
        const response = await fetch("/api/auth/status", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            // User is already logged in, redirect to terms (will redirect to dashboard if already accepted)
            router.push("/terms");
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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-black">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md">
        <div className="bg-white border border-black p-8">
          <h1 className="text-2xl font-bold mb-6 text-black">
            ITI Share Solutions
          </h1>

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit}>
              <div className="mb-4">
                <label className="block text-black font-semibold mb-2">
                  ITI Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@iti.edu.eg"
                  className="w-full px-3 py-2 border border-black bg-white text-black"
                  required
                />
              </div>
              {error && (
                <div className="mb-4">
                  <p className="text-red-600 mb-2">{error}</p>
                  {error === "Email not found in student database" && (
                    <div className="bg-gray-50 border border-gray-300 p-4 text-sm text-gray-700">
                      <p className="mb-3">
                        Email not registered. Submit your ITI email through our form to request access.
                      </p>
                      <a
                        href="https://forms.gle/yUSfPU1Vo4aHQKud7"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-semibold"
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
                className="w-full bg-black text-white font-semibold py-2 hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? "Sending code..." : "Send Login Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit}>
              <div className="mb-4">
                <label className="block text-black font-semibold mb-2">
                  Enter Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-black bg-white text-black text-center text-2xl tracking-widest"
                  required
                />
              </div>
              {error && <p className="text-red-600 mb-4">{error}</p>}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-black text-white font-semibold py-2 hover:bg-gray-800 disabled:opacity-50"
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
                className="w-full mt-2 text-black underline"
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

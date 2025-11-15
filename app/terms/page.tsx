"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated and if terms are already accepted
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

        // Check if terms are already accepted
        const termsResponse = await fetch("/api/auth/check-terms", {
          method: "GET",
          credentials: "include",
        });

        if (termsResponse.ok) {
          const termsData = await termsResponse.json();
          if (termsData.termsAccepted) {
            // Terms already accepted, redirect to dashboard
            router.push("/dashboard");
          }
        }
      } catch (err) {
        console.error("Error checking auth:", err);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const handleAccept = async () => {
    if (!agreed) return;

    setLoading(true);
    try {
      // Set a cookie to remember they've accepted the terms
      await fetch("/api/auth/accept-terms", {
        method: "POST",
        credentials: "include",
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Error accepting terms:", err);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white p-6">
      <div className="w-full max-w-3xl">
        <div className="border-2 border-black p-8">
          <h1 className="text-3xl font-bold text-black mb-6">
            Welcome to LabShare
          </h1>

          <div className="space-y-6 mb-8">
            <div>
              <h2 className="text-xl font-bold text-black mb-3">
                Platform Purpose
              </h2>
              <p className="text-gray-700 leading-relaxed">
                LabShare is designed to improve learning by creating a collaborative environment 
                where students can learn from each other and provide constructive feedback. 
                This platform encourages peer learning and helps you grow through shared knowledge 
                and experiences.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-black mb-3">
                Your Commitment
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To maintain the integrity of the learning process and ensure everyone benefits 
                from this platform, you must agree to the following:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  <strong>Complete your lab work first:</strong> You must finish each lab assignment 
                  and have it reviewed by an instructor before accessing other students' submissions.
                </li>
                <li>
                  <strong>Upload your work:</strong> After completing and reviewing with your instructor, 
                  upload your solution to gain access to other students' work.
                </li>
                <li>
                  <strong>Learn from each other:</strong> Use this platform to learn from your peers' 
                  approaches and solutions, not to copy them.
                </li>
                <li>
                  <strong>Provide constructive feedback:</strong> When viewing others' work, offer 
                  helpful feedback that contributes to everyone's learning experience.
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-300 p-4">
              <p className="text-gray-700 font-medium">
                By proceeding, you acknowledge that you understand and agree to these terms. 
                You commit to completing your labs and reviewing them with an instructor before 
                accessing other students' submissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 border-black"
            />
            <label htmlFor="agree" className="text-black font-semibold cursor-pointer">
              I understand and agree to these terms
            </label>
          </div>

          <button
            onClick={handleAccept}
            disabled={!agreed || loading}
            className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "I Agree - Continue to Dashboard"}
          </button>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Check authentication
        const authResponse = await fetch("/api/auth/status", {
          method: "GET",
          credentials: "include",
        });

        if (authResponse.ok) {
          const authData = await authResponse.json();
          if (authData.authenticated) {
            // User is already logged in, redirect to dashboard
            router.push("/dashboard");
            return;
          }
        }
        // Not authenticated, go to login
        router.push("/login");
      } catch (err) {
        console.error("Error checking auth:", err);
        router.push("/login");
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-white to-accent/20 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="spinner h-5 w-5"></div>
        <p className="text-foreground font-medium">Loading...</p>
      </div>
    </div>
  );
}

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
            // User is authenticated, check terms
            const termsResponse = await fetch("/api/auth/check-terms", {
              method: "GET",
              credentials: "include",
            });

            if (termsResponse.ok) {
              const termsData = await termsResponse.json();
              if (termsData.termsAccepted) {
                // Both authenticated and terms accepted, go to dashboard
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
    <div className="flex items-center justify-center min-h-screen bg-white">
      <p className="text-black">Loading...</p>
    </div>
  );
}

"use client";

import { useRouter } from 'next/navigation';

interface NavigationProps {
  student: any;
  track: any;
}

export default function Navigation({ student, track }: NavigationProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookies
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Error logging out:", err);
    } finally {
      // Redirect to login page
      router.push("/login");
    }
  };

  return (
    <nav className="border-b border-black bg-white">
      <div className="px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-black">
            ITI Share Solutions
          </h1>
          <p className="text-xs text-gray-600">
            {track?.code} • {student?.name}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 text-black font-semibold border border-black hover:bg-gray-100"
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push("/labs")}
            className="px-4 py-2 text-black font-semibold border border-black hover:bg-gray-100"
          >
            Labs
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-black text-white font-semibold hover:bg-gray-800"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

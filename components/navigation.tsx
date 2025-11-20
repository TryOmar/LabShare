"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NavigationProps {
  student: any;
  track: any;
}

export default function Navigation({ student, track }: NavigationProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-black truncate">
            Lab Sharing
          </h1>
          <p className="text-xs text-gray-600 truncate">
            {track?.code} • {student?.name}
          </p>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-2 lg:gap-4 flex-shrink-0">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-3 lg:px-4 py-2 text-sm lg:text-base text-black font-semibold border border-black hover:bg-gray-100 whitespace-nowrap"
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push("/labs")}
            className="px-3 lg:px-4 py-2 text-sm lg:text-base text-black font-semibold border border-black hover:bg-gray-100 whitespace-nowrap"
          >
            Labs
          </button>
          <button
            onClick={handleLogout}
            className="px-3 lg:px-4 py-2 text-sm lg:text-base bg-black text-white font-semibold hover:bg-gray-800 whitespace-nowrap"
          >
            Logout
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-black border border-black hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-black bg-white">
          <div className="flex flex-col">
            <button
              onClick={() => {
                router.push("/dashboard");
                setMobileMenuOpen(false);
              }}
              className="px-6 py-3 text-left text-black font-semibold border-b border-gray-200 hover:bg-gray-50"
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                router.push("/labs");
                setMobileMenuOpen(false);
              }}
              className="px-6 py-3 text-left text-black font-semibold border-b border-gray-200 hover:bg-gray-50"
            >
              Labs
            </button>
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="px-6 py-3 text-left bg-black text-white font-semibold hover:bg-gray-800"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

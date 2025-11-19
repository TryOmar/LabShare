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
    <nav className="sticky top-0 z-50 border-b border-border/50 glass shadow-modern">
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-foreground truncate transition-colors bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            Lab Sharing
          </h1>
          <p className="text-xs text-muted-foreground truncate font-medium">
            {track?.code} • {student?.name}
          </p>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-2 lg:gap-3 flex-shrink-0">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 lg:px-5 py-2 text-sm lg:text-base text-foreground font-medium border border-border/50 rounded-lg hover:bg-accent/50 hover:border-primary/30 hover:text-primary backdrop-blur-sm transition-all duration-300 whitespace-nowrap shadow-modern hover:shadow-primary/10"
            aria-label="Go to dashboard"
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push("/labs")}
            className="px-4 lg:px-5 py-2 text-sm lg:text-base text-foreground font-medium border border-border/50 rounded-lg hover:bg-accent/50 hover:border-primary/30 hover:text-primary backdrop-blur-sm transition-all duration-300 whitespace-nowrap shadow-modern hover:shadow-primary/10"
            aria-label="Go to labs"
          >
            Labs
          </button>
          <button
            onClick={handleLogout}
            className="px-4 lg:px-5 py-2 text-sm lg:text-base gradient-primary text-primary-foreground font-semibold rounded-lg hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] shadow-primary hover:shadow-primary-lg transition-all duration-300 whitespace-nowrap"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2.5 text-foreground border border-border/50 rounded-lg hover:bg-accent/50 backdrop-blur-sm transition-all duration-300 shadow-modern"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <svg
            className={`h-5 w-5 transition-transform duration-300 ${mobileMenuOpen ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden border-t border-border/50 glass overflow-hidden transition-all duration-500 ease-out ${
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex flex-col animate-slide-up">
          <button
            onClick={() => {
              router.push("/dashboard");
              setMobileMenuOpen(false);
            }}
            className="px-6 py-4 text-left text-foreground font-medium border-b border-border/30 hover:bg-accent/50 hover:text-primary transition-all duration-300"
            aria-label="Go to dashboard"
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              router.push("/labs");
              setMobileMenuOpen(false);
            }}
            className="px-6 py-4 text-left text-foreground font-medium border-b border-border/30 hover:bg-accent/50 hover:text-primary transition-all duration-300"
            aria-label="Go to labs"
          >
            Labs
          </button>
          <button
            onClick={() => {
              handleLogout();
              setMobileMenuOpen(false);
            }}
            className="px-6 py-4 text-left gradient-primary text-primary-foreground font-semibold hover:gradient-primary-hover transition-all duration-300"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

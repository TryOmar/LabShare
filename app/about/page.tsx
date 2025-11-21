"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Student {
  id: string;
  name: string;
  email: string;
  track_id: string;
}

interface Track {
  id: string;
  code: string;
  name: string;
}

export default function AboutPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check authentication (optional - page is public)
        const authResponse = await fetch("/api/auth/status", {
          method: "GET",
          credentials: "include",
        });

        if (authResponse.ok) {
          const authData = await authResponse.json();
          if (authData.authenticated) {
            // Fetch user data if authenticated
            const response = await fetch("/api/dashboard", {
              method: "GET",
              credentials: "include",
            });

            if (response.ok) {
              const data = await response.json();
              setStudent(data.student);
              setTrack(data.track);
            }
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
        // Don't redirect on error - allow public access
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-white via-white to-accent/10 animate-fade-in">
      <Navigation student={student} track={track} />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            LabShare Documentation
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Complete guide to understanding LabShare — your collaborative learning platform
          </p>
        </div>

        {/* Table of Contents */}
        <Card className="mb-8 border border-border/50 bg-gradient-card shadow-modern backdrop-blur-sm animate-slide-up">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Table of Contents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
              <a href="#introduction" className="text-primary hover:underline">1. Introduction</a>
              <a href="#mission" className="text-primary hover:underline">2. Mission</a>
              <a href="#how-it-works" className="text-primary hover:underline">3. How It Works</a>
              <a href="#access-control" className="text-primary hover:underline">4. Access Control</a>
              <a href="#admin-role" className="text-primary hover:underline">5. Admin Role</a>
              <a href="#features" className="text-primary hover:underline">6. Features</a>
              <a href="#screenshots" className="text-primary hover:underline">7. Platform Screenshots</a>
              <a href="#privacy" className="text-primary hover:underline">8. Privacy & Security</a>
              <a href="#technology" className="text-primary hover:underline">9. Technology Stack</a>
              <a href="#contribution" className="text-primary hover:underline">10. Contribution</a>
              <a href="#contact" className="text-primary hover:underline">11. Contact & Support</a>
              <a href="#terms" className="text-primary hover:underline">12. Terms of Use</a>
              <a href="#privacy-policy" className="text-primary hover:underline">13. Privacy Policy</a>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-6">
          {/* 1. Introduction */}
          <Card id="introduction" className="border border-border/50 bg-gradient-card shadow-modern backdrop-blur-sm animate-slide-up">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                1. Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                LabShare is an open-source educational platform designed exclusively for students of the Information Technology Institute (ITI) Training Program.
              </p>
              <div className="bg-muted/50 border border-border/30 p-4 rounded-lg">
                <p className="text-sm font-semibold text-foreground mb-3">The Problem We Solve:</p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>Students complete labs and get them reviewed by instructors, but they rarely get the chance to see how others solved the same problem.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>This prevents idea sharing, exposure to different thinking styles, and peer learning.</span>
                  </li>
                </ul>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                LabShare solves this by enabling students to share their solutions after instructor review, helping everyone learn from each other in a safe, structured, and fair way.
              </p>
            </CardContent>
          </Card>

          {/* 2. Mission */}
          <Card id="mission" className="border border-border/50 bg-gradient-card shadow-modern backdrop-blur-sm animate-slide-up">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                2. Project Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Our mission is to:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                  </span>
                  <span className="text-muted-foreground">Encourage collaboration and learning among ITI students.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                  </span>
                  <span className="text-muted-foreground">Provide a safe place to share solutions without cheating.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                  </span>
                  <span className="text-muted-foreground">Build a central hub for labs, accessible only to verified ITI students.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                  </span>
                  <span className="text-muted-foreground">Allow students to review others' solutions only after uploading their own, ensuring fairness.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                  </span>
                  <span className="text-muted-foreground">Keep the platform transparent, secure, and student-driven.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 3. How It Works */}
          <Card id="how-it-works" className="border border-border/50 bg-gradient-card shadow-modern backdrop-blur-sm animate-slide-up">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                3. How LabShare Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Step-by-Step User Flow</h3>
                <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
                  <li>Student solves the lab individually.</li>
                  <li>Student reviews the lab with the instructor and receives feedback/score.</li>
                  <li>Only after instructor review, the student can upload the lab to LabShare.</li>
                  <li>Once submitted, other students' solutions for the same lab unlock.</li>
                </ol>
              </div>
              <div className="bg-muted/50 border border-border/30 p-4 rounded-lg">
                <p className="text-sm font-semibold text-foreground mb-3">Students can then:</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>View solutions</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>Compare approaches</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>Learn alternative techniques</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>Comment (anonymously or with their name)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>Edit their submission anytime</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 4. Access Control */}
          <Card id="access-control" className="border border-border/50 bg-gradient-card shadow-modern backdrop-blur-sm animate-slide-up">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                4. Access Control & Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Who Can Access LabShare?</h3>
                <p className="text-muted-foreground">
                  Only verified ITI students registered in the official Google Sheet provided by ITI.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Authentication Rules</h3>
                <ul className="space-y-2.5 text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>Login is allowed only using ITI-registered student emails.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>These emails are stored in a database table called <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">students</code>.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>If a user enters an email NOT in the database, access is denied.</span>
                  </li>
                </ul>
              </div>
              <div className="bg-muted/50 border border-border/30 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-foreground mb-2">What if a student's email is missing?</h3>
                <p className="text-sm text-muted-foreground mb-3">If your email is not in the system:</p>
                <ol className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <span className="font-semibold text-primary flex-shrink-0">1.</span>
                    <span>A form appears asking for: Full Name, Track, and ITI email. You can also submit your email directly using our <a href="https://forms.gle/yUSfPU1Vo4aHQKud7" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Email Registration Form</a>.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-semibold text-primary flex-shrink-0">2.</span>
                    <span>This information is sent to an admin for verification.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-semibold text-primary flex-shrink-0">3.</span>
                    <span>Once approved, you receive an email confirming that you were added to the student database.</span>
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* 5. Admin Role */}
          <Card id="admin-role" className="border border-border/50 bg-gradient-card shadow-modern backdrop-blur-sm animate-slide-up">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                5. Admin Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Admins are trusted ITI students who help maintain the system.
              </p>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">What admins can do:</h3>
                <ul className="space-y-2.5 text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>Add new student emails to the official database</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>Review and approve join requests</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>Verify users who were missing from the Google Sheet</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span className="line-through text-muted-foreground/60">Monitor anonymous submissions in case of abuse (admins cannot modify or delete any student submission)</span>
                    <span className="ml-2 px-2 py-0.5 text-xs bg-muted border border-border/50 rounded text-muted-foreground">Coming Soon</span>
                  </li>
                </ul>
              </div>
              <div className="bg-muted/50 border border-border/30 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-foreground mb-2">Admin restrictions:</h3>
                <p className="text-sm text-muted-foreground">
                  ITI student emails cannot be admins. Admins use separate, dedicated accounts so daily usage doesn't happen on admin privileges.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 6. Features */}
          <Card id="features" className="border border-border/50 bg-gradient-card shadow-modern backdrop-blur-sm animate-slide-up">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                6. Website Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="dashboard">
                  <AccordionTrigger className="text-foreground font-semibold">Dashboard</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    After logging in, users see:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Latest uploads</li>
                      <li>List of courses</li>
                      <li>List of labs (initially locked)</li>
                      <li>Recent activity</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="locking">
                  <AccordionTrigger className="text-foreground font-semibold">Lab Locking System</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <ul className="space-y-2">
                      <li>• All labs are locked by default.</li>
                      <li>• You can only unlock a lab by submitting your own solution.</li>
                      <li>• Unlocking gives access to others' submissions.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="upload">
                  <AccordionTrigger className="text-foreground font-semibold">File Upload System</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Users can:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Upload multiple files</li>
                      <li>Upload folders (with subfolders)</li>
                      <li>Upload code files or attachments</li>
                      <li>Edit code files</li>
                      <li>Delete or rename files</li>
                      <li>Change code language</li>
                      <li>Add new code/attachments</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="anonymous">
                  <AccordionTrigger className="text-foreground font-semibold">Anonymous Mode</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    You can:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Submit anonymously</li>
                      <li>Write comments anonymously</li>
                      <li>Protect your identity while still contributing</li>
                    </ul>
                    <p className="mt-2 text-sm">
                      <span className="line-through text-muted-foreground/60">Admins can see anonymous submissions only for safety reasons, not for grading.</span>
                      <span className="ml-2 px-2 py-0.5 text-xs bg-muted border border-border/50 rounded text-muted-foreground">Coming Soon</span>
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* 7. Platform Screenshots */}
          <Card id="screenshots" className="border border-border/50 bg-gradient-card shadow-modern backdrop-blur-sm animate-slide-up">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                7. Platform Screenshots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Get a visual preview of LabShare's interface and features.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="aspect-video bg-muted/50 border border-border/30 rounded-lg flex items-center justify-center overflow-hidden">
                    <p className="text-sm text-muted-foreground">Dashboard Screenshot</p>
                    {/* Placeholder for screenshot - replace with actual image */}
                    {/* <img src="/screenshots/dashboard.png" alt="Dashboard" className="w-full h-full object-cover" /> */}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Dashboard Overview</p>
                </div>
                <div className="space-y-2">
                  <div className="aspect-video bg-muted/50 border border-border/30 rounded-lg flex items-center justify-center overflow-hidden">
                    <p className="text-sm text-muted-foreground">Lab Submission View</p>
                    {/* Placeholder for screenshot - replace with actual image */}
                    {/* <img src="/screenshots/submission.png" alt="Submission View" className="w-full h-full object-cover" /> */}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Submission Interface</p>
                </div>
                <div className="space-y-2">
                  <div className="aspect-video bg-muted/50 border border-border/30 rounded-lg flex items-center justify-center overflow-hidden">
                    <p className="text-sm text-muted-foreground">Code Editor</p>
                    {/* Placeholder for screenshot - replace with actual image */}
                    {/* <img src="/screenshots/editor.png" alt="Code Editor" className="w-full h-full object-cover" /> */}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Code Viewing & Editing</p>
                </div>
                <div className="space-y-2">
                  <div className="aspect-video bg-muted/50 border border-border/30 rounded-lg flex items-center justify-center overflow-hidden">
                    <p className="text-sm text-muted-foreground">Labs List</p>
                    {/* Placeholder for screenshot - replace with actual image */}
                    {/* <img src="/screenshots/labs.png" alt="Labs List" className="w-full h-full object-cover" /> */}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Available Labs</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted/50 border border-border/30 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  Screenshots coming soon. Add your platform screenshots to the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">public/screenshots</code> directory.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 8. Privacy & Security */}
          <Card id="privacy" className="border border-border/50 bg-gradient-card shadow-modern backdrop-blur-sm animate-slide-up">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                7. Data Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">What user data do we collect?</h3>
                <p className="text-muted-foreground mb-2">Only the following:</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>Full name</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>ITI email</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>Track name</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">What we DO NOT collect:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>No phone numbers</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>No passwords (we use secure OTP)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>No personal files outside the lab context</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>No location or analytics tracking</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>No behavioral tracking</span>
                  </li>
                </ul>
              </div>
              <div className="bg-muted/50 border border-border/30 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-foreground mb-2">Why your data is safe:</h3>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>LabShare is open source, so you can inspect everything.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>Database is managed through Supabase, which provides Row-Level Security (RLS), secure authentication, and role isolation.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>All uploads belong strictly to their owner, and no one can modify them.</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 9. Technology Stack */}
          <Card id="technology" className="border border-border/50 bg-gradient-card shadow-modern backdrop-blur-sm animate-slide-up">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                9. Project Technology Stack
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/30">
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
                  <span className="text-muted-foreground">Next.js — Frontend</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/30">
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
                  <span className="text-muted-foreground">Supabase — Database, Authentication, Storage</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/30">
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
                  <span className="text-muted-foreground">Vercel — Deployment</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/30">
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
                  <span className="text-muted-foreground">GitHub — Source Control, Issues, Discussions</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/30">
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
                  <span className="text-muted-foreground">Highlight.js — Code syntax detection</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/30">
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
                  <span className="text-muted-foreground">ShadCN + TailwindCSS — UI</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 10. Contribution */}
          <Card id="contribution" className="border border-border/50 bg-gradient-card shadow-modern backdrop-blur-sm animate-slide-up">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                10. Open Source & Contribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                LabShare is fully open source on GitHub.
              </p>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Current Core Developers</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1.5 bg-muted/50 rounded-lg text-sm text-muted-foreground">Omar</span>
                  <span className="px-3 py-1.5 bg-muted/50 rounded-lg text-sm text-muted-foreground">Amr</span>
                  <span className="px-3 py-1.5 bg-muted/50 rounded-lg text-sm text-muted-foreground">Deiaa</span>
                  <span className="px-3 py-1.5 bg-muted/50 rounded-lg text-sm text-muted-foreground">open-source contributors</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">How to contribute:</h3>
                <ol className="space-y-2.5 text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <span className="font-semibold text-primary flex-shrink-0">1.</span>
                    <span>Open an issue on <a href="https://github.com/TryOmar/LabShare/issues" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">GitHub Issues</a> or <a href="https://github.com/TryOmar/LabShare/issues/new" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">create a new issue</a></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-semibold text-primary flex-shrink-0">2.</span>
                    <span>Suggest your idea</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-semibold text-primary flex-shrink-0">3.</span>
                    <span>Discuss it with the team</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-semibold text-primary flex-shrink-0">4.</span>
                    <span>If accepted, develop it</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-semibold text-primary flex-shrink-0">5.</span>
                    <span>Open a Pull Request</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-semibold text-primary flex-shrink-0">6.</span>
                    <span>Your name will appear in Last Updates and the contributors list</span>
                  </li>
                </ol>
              </div>
              <div className="bg-muted/50 border border-border/30 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-foreground mb-3">How we brainstorm:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>Shared ChatGPT project</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>GitHub Issues</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>GitHub Discussions for announcements and community discussions</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 11. Contact & Support */}
          <Card id="contact" className="border border-border/50 bg-gradient-card shadow-modern backdrop-blur-sm animate-slide-up">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                11. Contact & Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If you face:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                  <span>Login problems</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                  <span>Missing email</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                  <span>Bugs</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                  <span>Feature suggestions</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                  <span>UI issues</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                  <span>Confusion about labs</span>
                </li>
              </ul>
              <div className="bg-muted/50 border border-border/30 p-4 rounded-lg space-y-3">
                <p className="text-sm font-semibold text-foreground mb-3">You can reach us via:</p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <div className="flex-1">
                      <span className="text-sm text-muted-foreground">GitHub Discussions: </span>
                      <a href="https://github.com/TryOmar/LabShare/discussions" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium">Join Discussions</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <div className="flex-1">
                      <span className="text-sm text-muted-foreground">GitHub Issues: </span>
                      <a href="https://github.com/TryOmar/LabShare/issues" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium">View Issues</a>
                      <span className="text-sm text-muted-foreground"> or </span>
                      <a href="https://github.com/TryOmar/LabShare/issues/new" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium">Create New Issue</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <div className="flex-1">
                      <span className="text-sm text-muted-foreground">Suggestions & Bug Reports: </span>
                      <a href="https://forms.gle/25mEvcjTPrhA6THf9" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium">Submit Report Form</a>
                      <span className="text-[10px] text-muted-foreground/70"> (can be anonymous)</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <div className="flex-1">
                      <span className="text-sm text-muted-foreground">Email Registration: </span>
                      <a href="https://forms.gle/yUSfPU1Vo4aHQKud7" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium">Email Registration Form</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <div className="flex-1">
                      <span className="text-sm text-muted-foreground">Repository: </span>
                      <a href="https://github.com/TryOmar/LabShare" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium">View on GitHub</a>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 12. Terms of Use */}
          <Card id="terms" className="border border-border/50 bg-gradient-card shadow-modern backdrop-blur-sm animate-slide-up">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                12. Terms of Use
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                  </span>
                  <span>You must only upload labs you have personally solved.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                  </span>
                  <span>You must only upload labs after instructor review.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                  </span>
                  <span>You must not upload: Random unrelated files, Other students' work, Harmful or inappropriate content.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                  </span>
                  <span>You must respect anonymity and privacy of others.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                  </span>
                  <span>Misuse of the platform may result in your account being removed.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 13. Privacy Policy */}
          <Card id="privacy-policy" className="border border-border/50 bg-gradient-card shadow-modern backdrop-blur-sm animate-slide-up">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                13. Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                  <span>We only store your: name, ITI email, track, and submissions.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                  <span>We do not share your data with any third party.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                  <span>Anonymous submissions hide your identity publicly.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                  <span>Admins may access anonymous data only if abuse is suspected.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                  <span>All data is protected with Supabase RLS and secure storage policies.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="border border-border/50 bg-gradient-card shadow-modern-lg backdrop-blur-sm animate-slide-up">
            <CardContent className="p-6 sm:p-8 text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Ready to Get Started?
              </h3>
              <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                Explore labs, share your solutions, and learn from your peers.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {student ? (
                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="gradient-primary text-primary-foreground hover:gradient-primary-hover shadow-primary hover:shadow-primary-lg px-6"
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <Button
                    onClick={() => router.push("/login")}
                    className="gradient-primary text-primary-foreground hover:gradient-primary-hover shadow-primary hover:shadow-primary-lg px-6"
                  >
                    Login to Get Started
                  </Button>
                )}
                <Button
                  onClick={() => window.open("https://github.com/TryOmar/LabShare", "_blank")}
                  variant="outline"
                  className="border-border/50 hover:bg-accent/50 hover:border-primary/30 px-6"
                >
                  View on GitHub
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


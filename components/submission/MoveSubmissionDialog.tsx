"use client";

import React, { useState, useEffect } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Course {
    id: string;
    name: string;
    description?: string;
}

interface Lab {
    id: string;
    lab_number: number;
    title: string;
    course_id: string;
    hasSubmission?: boolean;
}

interface MoveSubmissionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onMove: (targetLabId: string) => Promise<boolean>;
    currentLabId: string;
    currentCourseId: string;
    isMoving: boolean;
}

/**
 * Dialog component for moving a submission to a different lab.
 * Uses two dropdowns: Course selection and Lab selection.
 * Labs where the user already has a submission are shown but disabled.
 */
export function MoveSubmissionDialog({
    isOpen,
    onClose,
    onMove,
    currentLabId,
    currentCourseId,
    isMoving,
}: MoveSubmissionDialogProps) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [labsByCourse, setLabsByCourse] = useState<Record<string, Lab[]>>({});
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [selectedLabId, setSelectedLabId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get labs for selected course
    const availableLabs = selectedCourseId ? (labsByCourse[selectedCourseId] || []) : [];

    // Fetch courses and labs when dialog opens
    useEffect(() => {
        if (isOpen) {
            fetchCoursesAndLabs();
        }
    }, [isOpen]);

    // Set default course when data is loaded
    useEffect(() => {
        if (courses.length > 0 && currentCourseId && !selectedCourseId) {
            setSelectedCourseId(currentCourseId);
        }
    }, [courses, currentCourseId, selectedCourseId]);

    // Reset lab selection when course changes
    useEffect(() => {
        setSelectedLabId("");
    }, [selectedCourseId]);

    const fetchCoursesAndLabs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/labs", {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch courses and labs");
            }

            const data = await response.json();
            const { courses: fetchedCourses, labsByCourse: fetchedLabsByCourse } = data;

            setCourses(fetchedCourses || []);
            setLabsByCourse(fetchedLabsByCourse || {});
        } catch (err) {
            console.error("Error fetching courses and labs:", err);
            setError(err instanceof Error ? err.message : "Failed to load courses");
        } finally {
            setIsLoading(false);
        }
    };

    const handleMove = async () => {
        if (!selectedLabId) {
            setError("Please select a target lab");
            return;
        }

        const success = await onMove(selectedLabId);
        if (success) {
            resetState();
            onClose();
        }
    };

    const resetState = () => {
        setSelectedCourseId("");
        setSelectedLabId("");
        setError(null);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetState();
            onClose();
        }
    };

    // Check if selected lab is valid (not current lab and not already submitted)
    const selectedLab = availableLabs.find((lab) => lab.id === selectedLabId);
    const isValidSelection = selectedLabId &&
        selectedLabId !== currentLabId &&
        selectedLab &&
        !selectedLab.hasSubmission;

    return (
        <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="bg-white dark:bg-gray-900 border border-border/50 rounded-xl shadow-xl p-6 sm:p-6 backdrop-blur-none sm:max-w-[450px]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground text-xl font-semibold">
                        Move Submission
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground text-sm mt-2">
                        Select the course and lab you want to move this submission to.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="spinner h-6 w-6"></div>
                        </div>
                    ) : error && courses.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-destructive text-sm">{error}</p>
                            <button
                                onClick={fetchCoursesAndLabs}
                                className="mt-3 px-4 py-2 text-sm border border-border/50 text-foreground hover:bg-accent/50 hover:border-primary/40 rounded-lg transition-all duration-200"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Course Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="course-select" className="text-sm font-medium text-foreground">
                                    Course
                                </Label>
                                <Select
                                    value={selectedCourseId}
                                    onValueChange={setSelectedCourseId}
                                >
                                    <SelectTrigger
                                        id="course-select"
                                        className="w-full border border-border/50 bg-white/80 text-foreground rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                                    >
                                        <SelectValue placeholder="Select a course" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-border/50 rounded-lg shadow-lg">
                                        {courses.map((course) => (
                                            <SelectItem
                                                key={course.id}
                                                value={course.id}
                                                className="hover:bg-accent/50 cursor-pointer"
                                            >
                                                {course.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Lab Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="lab-select" className="text-sm font-medium text-foreground">
                                    Lab
                                </Label>
                                <Select
                                    value={selectedLabId}
                                    onValueChange={setSelectedLabId}
                                    disabled={!selectedCourseId}
                                >
                                    <SelectTrigger
                                        id="lab-select"
                                        className="w-full border border-border/50 bg-white/80 text-foreground rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <SelectValue placeholder={selectedCourseId ? "Select a lab" : "Select a course first"} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-border/50 rounded-lg shadow-lg">
                                        {availableLabs.length === 0 && selectedCourseId ? (
                                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                                No labs in this course
                                            </div>
                                        ) : (
                                            availableLabs.map((lab) => {
                                                const isCurrentLab = lab.id === currentLabId;
                                                const isDisabled = isCurrentLab || lab.hasSubmission;

                                                return (
                                                    <SelectItem
                                                        key={lab.id}
                                                        value={lab.id}
                                                        disabled={isDisabled}
                                                        className={`cursor-pointer ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-accent/50"}`}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <span>Lab {lab.lab_number}: {lab.title}</span>
                                                            {isCurrentLab && (
                                                                <span className="text-xs text-primary font-medium">(current)</span>
                                                            )}
                                                            {lab.hasSubmission && !isCurrentLab && (
                                                                <span className="text-xs text-amber-600">(submitted)</span>
                                                            )}
                                                        </span>
                                                    </SelectItem>
                                                );
                                            })
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Warning message for invalid selection */}
                            {selectedLabId && selectedLab?.hasSubmission && !selectedLab?.id.includes(currentLabId) && (
                                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                    ⚠️ You already have a submission in this lab. Choose a different lab.
                                </p>
                            )}
                        </>
                    )}
                </div>

                <AlertDialogFooter className="gap-2 sm:gap-3 mt-2">
                    <AlertDialogCancel
                        onClick={() => handleOpenChange(false)}
                        className="border border-border/50 text-foreground hover:bg-accent/50 hover:border-primary/40 rounded-lg transition-all duration-200 px-4 py-2"
                        disabled={isMoving}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleMove}
                        disabled={!isValidSelection || isMoving || isLoading}
                        className="gradient-primary text-primary-foreground hover:gradient-primary-hover rounded-lg transition-all duration-200 shadow-primary hover:shadow-primary-lg disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2"
                    >
                        {isMoving ? (
                            <span className="flex items-center gap-2">
                                <div className="spinner h-4 w-4"></div>
                                Moving...
                            </span>
                        ) : (
                            "Move Submission"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

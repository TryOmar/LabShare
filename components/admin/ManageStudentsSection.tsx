"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface TrackOption {
    id: string;
    code: string;
    name: string;
}

interface Student {
    id: string;
    name: string;
    email: string;
    track_id: string;
    created_at: string;
    isAdmin: boolean;
    tracks: TrackOption | null;
}

interface Message {
    type: "success" | "error";
    text: string;
}

/**
 * ManageStudentsSection component for managing students and admins.
 * Allows viewing, adding, editing student details, editing admin status, and deleting students.
 */
export function ManageStudentsSection() {
    const [students, setStudents] = useState<Student[]>([]);
    const [tracks, setTracks] = useState<TrackOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [message, setMessage] = useState<Message | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [trackCode, setTrackCode] = useState("");
    const [makeAdmin, setMakeAdmin] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Filter state
    const [filterAdmin, setFilterAdmin] = useState<"all" | "admin" | "student">("all");

    const loadStudents = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/admin/students", {
                method: "GET",
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                setStudents(data.students || []);
            }
        } catch (err) {
            console.error("Error loading students:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadTracks = async () => {
        try {
            const response = await fetch("/api/tracks", {
                method: "GET",
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                setTracks(data.tracks || []);
            }
        } catch (err) {
            console.error("Error loading tracks:", err);
        }
    };

    useEffect(() => {
        loadStudents();
        loadTracks();
    }, []);

    const filteredStudents = students.filter((student) => {
        const matchesSearch =
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter =
            filterAdmin === "all" ||
            (filterAdmin === "admin" && student.isAdmin) ||
            (filterAdmin === "student" && !student.isAdmin);

        return matchesSearch && matchesFilter;
    });

    const resetForm = () => {
        setName("");
        setEmail("");
        setTrackCode("");
        setMakeAdmin(false);
        setEditingStudentId(null);
        setShowForm(false);
        setMessage(null);
    };

    const handleEditStudent = (student: Student) => {
        setName(student.name);
        setEmail(student.email);
        setTrackCode(student.tracks?.code || "");
        setMakeAdmin(student.isAdmin);
        setEditingStudentId(student.id);
        setShowForm(true);
        setMessage(null);

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            const isEdit = !!editingStudentId;
            const url = "/api/admin/students";
            const method = isEdit ? "PATCH" : "POST";

            const body: any = {
                name: name.trim(),
                email: email.trim(),
                trackCode: trackCode.trim(),
            };

            if (isEdit) {
                body.targetStudentId = editingStudentId;
                // Note: Admin status is typically managed via the list checkboxes,
                // but we could include it here if we wanted deeper integration.
                // For now, the backend PATCH supports separate or combined updates.
            } else {
                body.makeAdmin = makeAdmin;
            }

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({
                    type: "success",
                    text: data.message || (isEdit ? "Student updated successfully!" : "Student added successfully!"),
                });
                resetForm();
                loadStudents();
            } else {
                setMessage({
                    type: "error",
                    text: data.message || data.error || (isEdit ? "Failed to update student" : "Failed to add student"),
                });
            }
        } catch (error: any) {
            setMessage({
                type: "error",
                text: error.message || "An error occurred",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleAdmin = async (student: Student) => {
        try {
            const response = await fetch("/api/admin/students", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    targetStudentId: student.id,
                    isAdmin: !student.isAdmin,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({
                    type: "success",
                    text: data.message || "Admin status updated!",
                });
                // Update local state
                setStudents((prev) =>
                    prev.map((s) =>
                        s.id === student.id ? { ...s, isAdmin: !s.isAdmin } : s
                    )
                );
            } else {
                setMessage({
                    type: "error",
                    text: data.message || data.error || "Failed to update admin status",
                });
            }
        } catch (error: any) {
            setMessage({
                type: "error",
                text: error.message || "An error occurred",
            });
        }
    };

    const handleDeleteStudent = async (student: Student) => {
        if (!confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/students?id=${student.id}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({
                    type: "success",
                    text: data.message || "Student deleted successfully!",
                });
                setStudents((prev) => prev.filter((s) => s.id !== student.id));
            } else {
                setMessage({
                    type: "error",
                    text: data.message || data.error || "Failed to delete student",
                });
            }
        } catch (error: any) {
            setMessage({
                type: "error",
                text: error.message || "An error occurred",
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* Header with Add Button */}
            <div className="border border-border/50 p-4 sm:p-6 rounded-xl shadow-modern backdrop-blur-sm bg-gradient-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-foreground">
                            Manage Students
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            View, add, edit, and manage students and admin privileges.
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            if (showForm) {
                                resetForm();
                            } else {
                                setShowForm(true);
                            }
                        }}
                        className={showForm
                            ? "border-red-300 text-red-600 bg-red-50 hover:bg-red-100"
                            : "gradient-primary text-primary-foreground hover:gradient-primary-hover"}
                        variant={showForm ? "outline" : "default"}
                    >
                        {showForm ? "Cancel" : "+ Add Student"}
                    </Button>
                </div>

                {/* Add/Edit Student Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-accent/30 rounded-lg border border-border/50">
                        <h3 className="text-base font-semibold text-foreground mb-4">
                            {editingStudentId ? "Edit Student" : "Add New Student"}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="student-name" className="text-sm font-semibold">
                                    Name
                                </Label>
                                <Input
                                    id="student-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="mt-1"
                                    placeholder="Enter name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="student-email" className="text-sm font-semibold">
                                    Email
                                </Label>
                                <Input
                                    id="student-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="mt-1"
                                    placeholder="Enter email"
                                />
                            </div>
                            <div>
                                <Label htmlFor="student-track" className="text-sm font-semibold">
                                    Track
                                </Label>
                                <select
                                    id="student-track"
                                    value={trackCode}
                                    onChange={(e) => setTrackCode(e.target.value)}
                                    required
                                    className="mt-1 w-full p-2.5 text-sm border border-border/50 bg-white/80 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                >
                                    <option value="">Select track...</option>
                                    {tracks.map((track) => (
                                        <option key={track.id} value={track.code}>
                                            {track.name} ({track.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {!editingStudentId && (
                                <div className="flex items-center gap-3 pt-6">
                                    <Checkbox
                                        id="student-admin"
                                        checked={makeAdmin}
                                        onCheckedChange={(checked) => setMakeAdmin(checked === true)}
                                    />
                                    <Label htmlFor="student-admin" className="text-sm font-medium cursor-pointer">
                                        Grant admin privileges
                                    </Label>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button
                                type="submit"
                                disabled={submitting || !name.trim() || !email.trim() || !trackCode.trim()}
                                className="gradient-primary text-primary-foreground"
                            >
                                {submitting ? (editingStudentId ? "Updating..." : "Adding...") : (editingStudentId ? "Update Student" : "Add Student")}
                            </Button>
                        </div>
                    </form>
                )}

                {/* Message */}
                {message && (
                    <div
                        className={`mb-4 p-4 rounded-lg border ${message.type === "success"
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-red-50 border-red-200 text-red-800"
                            }`}
                    >
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="flex-1">
                        <Input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterAdmin("all")}
                            className={`px-3 py-2 text-sm rounded-lg border transition-all ${filterAdmin === "all"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-white/80 text-foreground border-border/50 hover:border-primary/30"
                                }`}
                        >
                            All ({students.length})
                        </button>
                        <button
                            onClick={() => setFilterAdmin("admin")}
                            className={`px-3 py-2 text-sm rounded-lg border transition-all ${filterAdmin === "admin"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-white/80 text-foreground border-border/50 hover:border-primary/30"
                                }`}
                        >
                            Admins ({students.filter((s) => s.isAdmin).length})
                        </button>
                        <button
                            onClick={() => setFilterAdmin("student")}
                            className={`px-3 py-2 text-sm rounded-lg border transition-all ${filterAdmin === "student"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-white/80 text-foreground border-border/50 hover:border-primary/30"
                                }`}
                        >
                            Students ({students.filter((s) => !s.isAdmin).length})
                        </button>
                    </div>
                </div>

                {/* Students Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="spinner h-5 w-5"></div>
                        <span className="ml-2 text-muted-foreground">Loading students...</span>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {searchQuery || filterAdmin !== "all"
                            ? "No students match your search/filter."
                            : "No students found."}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border/50">
                                    <th className="text-left p-3 text-sm font-semibold text-foreground">Name</th>
                                    <th className="text-left p-3 text-sm font-semibold text-foreground hidden sm:table-cell">Email</th>
                                    <th className="text-left p-3 text-sm font-semibold text-foreground hidden md:table-cell">Track</th>
                                    <th className="text-center p-3 text-sm font-semibold text-foreground">Admin</th>
                                    <th className="text-right p-3 text-sm font-semibold text-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student) => (
                                    <tr
                                        key={student.id}
                                        className="border-b border-border/30 hover:bg-accent/30 transition-colors"
                                    >
                                        <td className="p-3">
                                            <div>
                                                <p className="font-medium text-foreground">{student.name}</p>
                                                <p className="text-xs text-muted-foreground sm:hidden">{student.email}</p>
                                            </div>
                                        </td>
                                        <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">
                                            {student.email}
                                        </td>
                                        <td className="p-3 hidden md:table-cell">
                                            {student.tracks && (
                                                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                                                    {student.tracks.code}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            <Checkbox
                                                checked={student.isAdmin}
                                                onCheckedChange={() => handleToggleAdmin(student)}
                                                aria-label={`Toggle admin for ${student.name}`}
                                            />
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    onClick={() => handleEditStudent(student)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary hover:text-primary-hover hover:bg-primary/5"
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeleteStudent(student)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Summary */}
                <div className="mt-4 pt-4 border-t border-border/30 text-sm text-muted-foreground">
                    Showing {filteredStudents.length} of {students.length} students
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Lab {
    id: string;
    lab_number: number;
    title: string;
    description: string;
}

interface Message {
    type: "success" | "error";
    text: string;
}

interface CourseLabsEditorProps {
    courseId: string;
}

export function CourseLabsEditor({ courseId }: CourseLabsEditorProps) {
    const [labs, setLabs] = useState<Lab[]>([]);
    const [loadingLabs, setLoadingLabs] = useState(true);
    const [message, setMessage] = useState<Message | null>(null);

    // New lab form
    const [showAddLab, setShowAddLab] = useState(false);
    const [newLabTitle, setNewLabTitle] = useState("");
    const [newLabDescription, setNewLabDescription] = useState("");
    const [addingLab, setAddingLab] = useState(false);

    // Edit lab state
    const [editingLab, setEditingLab] = useState<Lab | null>(null);
    const [editLabTitle, setEditLabTitle] = useState("");
    const [editLabDescription, setEditLabDescription] = useState("");
    const [savingLab, setSavingLab] = useState(false);

    useEffect(() => {
        const loadLabs = async () => {
            setLoadingLabs(true);
            try {
                const response = await fetch(`/api/admin/courses/${courseId}/labs`, {
                    method: "GET",
                    credentials: "include",
                });

                if (response.ok) {
                    const data = await response.json();
                    setLabs(data.labs || []);
                }
            } catch (err) {
                console.error("Error loading labs:", err);
            } finally {
                setLoadingLabs(false);
            }
        };

        if (courseId) {
            loadLabs();
        }
    }, [courseId]);

    const handleAddLab = async () => {
        if (!newLabTitle.trim()) return;

        setAddingLab(true);
        setMessage(null);
        try {
            const response = await fetch(`/api/admin/courses/${courseId}/labs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    title: newLabTitle.trim(),
                    description: newLabDescription.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setLabs((prev) => [...prev, data.lab]);
                setNewLabTitle("");
                setNewLabDescription("");
                setShowAddLab(false);
                setMessage({ type: "success", text: "Lab added successfully!" });
            } else {
                setMessage({
                    type: "error",
                    text: data.message || data.error || "Failed to add lab",
                });
            }
        } catch (error: any) {
            setMessage({
                type: "error",
                text: error.message || "An error occurred while adding the lab",
            });
        } finally {
            setAddingLab(false);
        }
    };

    const handleEditLabStart = (lab: Lab) => {
        setEditingLab(lab);
        setEditLabTitle(lab.title);
        setEditLabDescription(lab.description || "");
        setMessage(null);
    };

    const handleSaveLab = async () => {
        if (!editingLab || !editLabTitle.trim()) return;

        setSavingLab(true);
        setMessage(null);
        try {
            const response = await fetch(
                `/api/admin/courses/${courseId}/labs/${editingLab.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        title: editLabTitle.trim(),
                        description: editLabDescription.trim(),
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                setLabs((prev) =>
                    prev.map((l) =>
                        l.id === editingLab.id
                            ? { ...l, title: editLabTitle.trim(), description: editLabDescription.trim() }
                            : l
                    )
                );
                setEditingLab(null);
                setMessage({ type: "success", text: "Lab updated successfully!" });
            } else {
                setMessage({
                    type: "error",
                    text: data.message || data.error || "Failed to update lab",
                });
            }
        } catch (error: any) {
            setMessage({
                type: "error",
                text: error.message || "An error occurred while updating the lab",
            });
        } finally {
            setSavingLab(false);
        }
    };

    const handleDeleteLab = async (labId: string) => {
        if (!confirm("Are you sure you want to delete this lab? This action cannot be undone.")) {
            return;
        }

        setMessage(null);
        try {
            const response = await fetch(
                `/api/admin/courses/${courseId}/labs/${labId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (response.ok) {
                setLabs((prev) => prev.filter((l) => l.id !== labId));
                setMessage({ type: "success", text: "Lab deleted successfully!" });
            } else {
                const data = await response.json();
                setMessage({
                    type: "error",
                    text: data.message || data.error || "Failed to delete lab",
                });
            }
        } catch (error: any) {
            setMessage({
                type: "error",
                text: error.message || "An error occurred while deleting the lab",
            });
        }
    };

    return (
        <div className="border border-border/50 p-4 sm:p-6 rounded-xl shadow-modern backdrop-blur-sm bg-gradient-card">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Course Labs</h2>
                <Button
                    onClick={() => setShowAddLab(!showAddLab)}
                    variant="outline"
                    size="sm"
                    className="border-primary/50 text-primary hover:bg-primary/10"
                >
                    {showAddLab ? "Cancel" : "+ Add Lab"}
                </Button>
            </div>

            {/* Message Area for Labs */}
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

            {/* Add Lab Form */}
            {showAddLab && (
                <div className="mb-4 p-4 bg-accent/30 rounded-lg border border-border/50">
                    <div className="space-y-3 max-w-lg">
                        <div>
                            <Label htmlFor="new-lab-title" className="text-sm font-semibold">
                                Lab Title
                            </Label>
                            <Input
                                id="new-lab-title"
                                type="text"
                                value={newLabTitle}
                                onChange={(e) => setNewLabTitle(e.target.value)}
                                className="mt-1"
                                placeholder="Enter lab title"
                            />
                        </div>
                        <div>
                            <Label htmlFor="new-lab-description" className="text-sm font-semibold">
                                Description (optional)
                            </Label>
                            <Textarea
                                id="new-lab-description"
                                value={newLabDescription}
                                onChange={(e) => setNewLabDescription(e.target.value)}
                                className="mt-1"
                                placeholder="Enter lab description"
                            />
                        </div>
                        <Button
                            onClick={handleAddLab}
                            disabled={addingLab || !newLabTitle.trim()}
                            className="gradient-primary text-primary-foreground"
                        >
                            {addingLab ? "Adding..." : "Add Lab"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Labs List */}
            {loadingLabs ? (
                <div className="flex items-center justify-center py-8">
                    <div className="spinner h-5 w-5"></div>
                    <span className="ml-2 text-muted-foreground">Loading labs...</span>
                </div>
            ) : labs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    No labs in this course yet.
                </div>
            ) : (
                <div className="space-y-2">
                    {labs
                        .sort((a, b) => a.lab_number - b.lab_number)
                        .map((lab) => (
                            <div
                                key={lab.id}
                                className="p-4 bg-white/80 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                            >
                                {editingLab?.id === lab.id ? (
                                    <div className="space-y-3">
                                        <Input
                                            type="text"
                                            value={editLabTitle}
                                            onChange={(e) => setEditLabTitle(e.target.value)}
                                            placeholder="Lab title"
                                        />
                                        <Textarea
                                            value={editLabDescription}
                                            onChange={(e) => setEditLabDescription(e.target.value)}
                                            placeholder="Lab description"
                                            className="min-h-[60px]"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleSaveLab}
                                                disabled={savingLab || !editLabTitle.trim()}
                                                size="sm"
                                                className="gradient-primary text-primary-foreground"
                                            >
                                                {savingLab ? "Saving..." : "Save"}
                                            </Button>
                                            <Button
                                                onClick={() => setEditingLab(null)}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                                                    Lab {lab.lab_number}
                                                </span>
                                                <h3 className="font-medium text-foreground truncate">
                                                    {lab.title}
                                                </h3>
                                            </div>
                                            {lab.description && (
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                    {lab.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <Button
                                                onClick={() => handleEditLabStart(lab)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                onClick={() => handleDeleteLab(lab.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}

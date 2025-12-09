"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Message {
    type: "success" | "error";
    text: string;
}

/**
 * AddAdminForm component for adding new admins to the platform.
 * Only existing admins can add new admins.
 * The admins table only stores email addresses for privilege checking.
 */
export function AddAdminForm() {
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch("/api/admin/admins", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    email: email.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({
                    type: "success",
                    text: data.message || "Admin added successfully!",
                });
                setEmail("");
            } else {
                setMessage({
                    type: "error",
                    text: data.message || data.error || "Failed to add admin",
                });
            }
        } catch (error: any) {
            setMessage({
                type: "error",
                text: error.message || "An error occurred while adding the admin",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="border border-border/50 p-4 sm:p-6 rounded-xl shadow-modern backdrop-blur-sm bg-gradient-card max-w-2xl">
            <div className="mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Add Admin</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Grant admin privileges to a user by adding their email address.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="admin-email" className="text-sm font-semibold text-foreground">
                        Email Address
                    </Label>
                    <Input
                        id="admin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-2"
                        placeholder="Enter the email address of the new admin"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        The user will have admin privileges on their next login.
                    </p>
                </div>

                {message && (
                    <div
                        className={`p-4 rounded-lg border ${message.type === "success"
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-red-50 border-red-200 text-red-800"
                            }`}
                    >
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={submitting || !email.trim()}
                    className="w-full py-3 px-6 text-sm sm:text-base font-semibold rounded-lg transition-all duration-300 gradient-primary text-primary-foreground hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] shadow-primary hover:shadow-primary-lg disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100"
                >
                    {submitting ? "Adding..." : "Add Admin"}
                </Button>
            </form>
        </div>
    );
}

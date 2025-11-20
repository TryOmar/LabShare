export interface LastUpdate {
  feature: string;
  suggestedBy: string | string[];
  implementedBy: string | string[];
  date: string;
}

/**
 * Last Updates / Changelog
 * Ordered from newest (top) to oldest (bottom)
 */
export const lastUpdates: LastUpdate[] = [
  {
    feature: "Anonymous Lab Submission and Anonymous Comments",
    suggestedBy: ["@Mahmoud0-0Salah", "@deiaamohamed"],
    implementedBy: ["@TryOmar"],
    date: "17 Nov 2025",
  },
  {
    feature: "Support for code uploads and file attachments in submissions",
    suggestedBy: ["@TryOmar"],
    implementedBy: ["@TryOmar"],
    date: "17 Nov 2025",
  },
  {
    feature: "Contribution Panel / Last-Update Tracker",
    suggestedBy: ["@TryOmar"],
    implementedBy: ["@TryOmar"],
    date: "17 Nov 2025",
  },
  {
    feature: "Code Highlighter",
    suggestedBy: ["@DeiaaMohamed", "@KarimMohamed"],
    implementedBy: ["@DeiaaMohamed"],
    date: "16 Nov 2025",
  },
  {
    feature: "Extra Language Support (HTML, CSS, JS, SQL)",
    suggestedBy: ["@DeiaaMohamed"],
    implementedBy: ["@DeiaaMohamed"],
    date: "15–17 Nov 2025",
  },
  {
    feature: "Terms Acceptance Flow",
    suggestedBy: ["@TryOmar"],
    implementedBy: ["@DeiaaMohamed"],
    date: "15 Nov 2025",
  },
  {
    feature: "Help Section with Issue Reporting",
    suggestedBy: ["@TryOmar"],
    implementedBy: ["@TryOmar"],
    date: "15 Nov 2025",
  },
];


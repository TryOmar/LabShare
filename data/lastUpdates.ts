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
    feature: "Censor utility with bad words list and detection/censoring functions",
    suggestedBy: ["@Deiaamohamed","KeroRaed"],
    implementedBy: ["@DeiaaMohamed"],
    date: "28 Nov 2025",
  },
  {
    feature: "UI improvements: Simplified submit section, updated student name color to match brand, and improved header clarity",
    suggestedBy: ["@AhmedLotfi"],
    implementedBy: ["@AhmedLotfi"],
    date: "25 Nov 2025",
  },
  {
    feature: "Secured authentication system with session-based and token-based authentication",
    suggestedBy: ["@Abbas49", "@TryOmar", "@m10090"],
    implementedBy: ["@KariMuhammad"],
    date: "25 Nov 2025",
  },
  {
    feature: "Updated like button color from red to blue in the submission page",
    suggestedBy: ["@Omar-Ezzat-AbdAlmoaz"],
    implementedBy: ["@Omar-Ezzat-AbdAlmoaz"],
    date: "22 Nov 2025",
  },
  {
    feature: "Image/HTML preview and C++ code execution: Preview images and HTML files, test C++ code with real-time results",
    suggestedBy: ["@m10090", "@TryOmar", "@omartaha15"],
    implementedBy: ["@TryOmar", "@m10090"],
    date: "22 Nov 2025",
  },
  {
    feature: "Upvote system for submissions with upvote counts and status tracking",
    suggestedBy: ["@omartaha15"],
    implementedBy: ["@KariMuhammad"],
    date: "21 Nov 2025",
  },
  {
    feature: "Performance optimization: Move all transformation logic to SQL queries",
    suggestedBy: ["@KarimMohamed", "@DeiaaMohamed"],
    implementedBy: ["@m10090"],
    date: "21 Nov 2025",
  },
  {
    feature: "UI improvements with animations, LabShare logo, and modern design",
    suggestedBy: ["@deiaamohamed"],
    implementedBy: ["@deiaamohamed"],
    date: "18 Nov 2025",
  },
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


import type { Attachment } from "./types";

export const languageColors: Record<string, string> = {
  javascript: "bg-yellow-100 text-yellow-800",
  typescript: "bg-blue-100 text-blue-800",
  python: "bg-blue-100 text-blue-800",
  cpp: "bg-purple-100 text-purple-800",
  c: "bg-gray-100 text-gray-800",
  java: "bg-orange-100 text-orange-800",
  csharp: "bg-green-100 text-green-800",
  php: "bg-indigo-100 text-indigo-800",
  ruby: "bg-red-100 text-red-800",
  go: "bg-cyan-100 text-cyan-800",
  rust: "bg-red-100 text-red-800",
  text: "bg-gray-100 text-gray-800",
  SQL: "bg-blue-100 text-white-800",
  HTML: "bg-orange-100 text-red-800",
  CSS: "bg-blue-100 text-blue-800",
};

/**
 * Map incoming language strings (from API) to Prism language identifiers
 */
export const mapLanguageToPrism = (lang?: string): string => {
  if (!lang) return "text";
  const l = lang.toLowerCase();
  if (l === "c++" || l === "cpp") return "cpp";
  if (l === "c#" || l === "csharp") return "csharp";
  if (l === "ts" || l === "tsx" || l === "typescript") return "typescript";
  if (l === "js" || l === "jsx" || l === "javascript") return "javascript";
  if (l === "py" || l === "python") return "python";
  if (l === "sql") return "sql";
  if (l === "html") return "html";
  if (l === "java") return "java";
  if (l === "php") return "php";
  if (l === "ruby") return "ruby";
  if (l === "go") return "go";
  if (l === "rust") return "rust";
  if (l === "text" || l === "plain") return "text";
  return l; // fallback: try the provided value
};

/**
 * Check if attachment is an image based on mime type
 */
export const isImageAttachment = (attachment: Attachment): boolean => {
  const mimeType = attachment.mime_type.toLowerCase();
  return mimeType.startsWith("image/");
};

/**
 * Format file size in bytes to human-readable string
 */
export const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Language detection mapping for file extensions
 */
export const detectedLanguages: Record<string, string> = {
  ".js": "javascript",
  ".ts": "typescript",
  ".py": "python",
  ".cpp": "cpp",
  ".c": "c",
  ".java": "java",
  ".cs": "csharp",
  ".php": "php",
  ".rb": "ruby",
  ".go": "go",
  ".rs": "rust",
  ".txt": "text",
  ".sql": "SQL",
  ".html": "HTML",
  ".css": "CSS",
};

/**
 * Code file extensions
 */
export const codeExtensions = [
  ".js",
  ".ts",
  ".py",
  ".cpp",
  ".c",
  ".java",
  ".cs",
  ".php",
  ".rb",
  ".go",
  ".rs",
  ".txt",
  ".sql",
  ".html",
  ".css",
];

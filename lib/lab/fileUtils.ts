/**
 * Language detection mapping from file extensions
 */
export const DETECTED_LANGUAGES: Record<string, string> = {
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
 * Code file extensions that should be treated as code files
 */
export const CODE_EXTENSIONS = [
  '.js', '.ts', '.py', '.cpp', '.c', '.java', '.cs', 
  '.php', '.rb', '.go', '.rs', '.txt', '.sql', '.html', '.css'
];

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length < 2) return "";
  return "." + parts.pop()?.toLowerCase();
}

/**
 * Check if a file is a code file based on its extension
 */
export function isCodeFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return CODE_EXTENSIONS.includes(ext);
}

/**
 * Get language from file extension
 */
export function getLanguageFromExtension(filename: string): string {
  const ext = getFileExtension(filename);
  return DETECTED_LANGUAGES[ext] || "text";
}

/**
 * Convert file to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Check for duplicate filenames (case-insensitive)
 */
export function findDuplicateFilenames(filenames: string[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  
  for (const filename of filenames) {
    const lower = filename.toLowerCase();
    if (seen.has(lower)) {
      duplicates.push(filename);
    } else {
      seen.add(lower);
    }
  }
  
  return duplicates;
}


import { detectLanguage } from "@/lib/language-detection";
import { 
  getFileExtension, 
  isCodeFile, 
  getLanguageFromExtension, 
  fileToBase64,
  CODE_EXTENSIONS 
} from "./fileUtils";
import type { PastedCodeFile, UploadFile } from "./types";

/**
 * Random solution name variations
 */
export const RANDOM_SOLUTION_NAMES = [
  "Solution", "Approach", "Submission", "Lab", "Task", "Assignment",
  "Implementation", "Method", "Answer", "Response", "Attempt", "Draft",
  "Work", "Result", "Entry", "Try", "Effort", "Take", "Way", "Path",
  "Plan", "Idea", "Fix", "Reply", "Turn", "Shot", "Go", "Run", "Pass",
  "Hit", "Crack", "Break", "Win", "Nail", "Smash", "Crush", "Rock",
  "Boss", "Beast", "Fire", "Wave", "Vibe", "Move", "Flex", "Show"
];

/**
 * Get a random solution name
 */
export function getRandomSolutionName(): string {
  return RANDOM_SOLUTION_NAMES[
    Math.floor(Math.random() * RANDOM_SOLUTION_NAMES.length)
  ];
}

/**
 * Process files for upload - converts File objects to UploadFile format
 */
export async function processFilesForUpload(
  files: File[]
): Promise<UploadFile[]> {
  const uploadFiles: UploadFile[] = [];

  for (const file of files) {
    const ext = getFileExtension(file.name);
    
    if (CODE_EXTENSIONS.includes(ext)) {
      // Parse as code file
      const content = await file.text();
      const detectedLang = getLanguageFromExtension(file.name);

      uploadFiles.push({
        filename: file.name,
        language: detectedLang,
        content,
      });
    } else {
      // Convert to base64 for attachment
      const base64 = await fileToBase64(file);
      uploadFiles.push({
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64: base64,
      });
    }
  }

  return uploadFiles;
}

/**
 * Auto-detect language from pasted content
 */
export function detectLanguageFromContent(content: string): string {
  if (content.trim().length > 10) {
    return detectLanguage(content);
  }
  return "text";
}

/**
 * Validate upload files for duplicates
 */
export function validateUploadFiles(files: UploadFile[]): {
  isValid: boolean;
  duplicates: string[];
} {
  const filenames = files.map(f => f.filename);
  const duplicates: string[] = [];
  const seen = new Set<string>();
  
  for (const filename of filenames) {
    const lower = filename.toLowerCase();
    if (seen.has(lower)) {
      duplicates.push(filename);
    } else {
      seen.add(lower);
    }
  }
  
  return {
    isValid: duplicates.length === 0,
    duplicates,
  };
}


// Import highlight.js - works in both server and client environments
import hljs from 'highlight.js';

/**
 * Maps highlight.js language names to Prism/react-syntax-highlighter language names
 */
const languageMap: Record<string, string> = {
  'javascript': 'javascript',
  'typescript': 'typescript',
  'python': 'python',
  'java': 'java',
  'c': 'c',
  'cpp': 'cpp',
  'csharp': 'csharp',
  'c#': 'csharp',
  'php': 'php',
  'ruby': 'ruby',
  'go': 'go',
  'rust': 'rust',
  'html': 'HTML',
  'xml': 'HTML',
  'css': 'CSS',
  'sql': 'SQL',
  'bash': 'text',
  'shell': 'text',
  'plaintext': 'text',
  'text': 'text',
};

/**
 * Auto-detects programming language from code content using highlight.js.
 * highlight.js has built-in language detection that is more accurate than pattern matching.
 * Returns a language identifier that matches the syntax highlighter's expected format.
 * 
 * @param code - The code content to analyze
 * @returns Language identifier (e.g., "javascript", "python", "text", etc.)
 */
export function detectLanguage(code: string): string {
  if (!code || code.trim().length === 0) return "text";
  
  // Use highlight.js's built-in auto-detection (more accurate than pattern matching)
  try {
    if (hljs && typeof hljs.highlightAuto === 'function') {
      // Use highlight.js's built-in auto-detection
      const result = hljs.highlightAuto(code, [
        'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp', 
        'php', 'ruby', 'go', 'rust', 'html', 'xml', 'css', 'sql'
      ]);
      
      const detectedLang = result.language || result.secondBest?.language;
      
      if (detectedLang) {
        // Map highlight.js language name to our format
        const mapped = languageMap[detectedLang.toLowerCase()];
        if (mapped) {
          return mapped;
        }
        
        // If not in map, try to use it directly (might work for Prism)
        return detectedLang.toLowerCase();
      }
    }
  } catch (error) {
    // Fallback to pattern matching if highlight.js fails or is not available
    // This is expected in some environments
  }
  
  // Fallback to pattern matching for edge cases or when highlight.js is unavailable
  return detectLanguageFallback(code);
}

/**
 * Fallback pattern-based detection for cases where highlight.js doesn't work
 */
function detectLanguageFallback(code: string): string {
  const trimmedCode = code.trim();
  const lines = trimmedCode.split('\n');
  const firstLine = lines[0] || '';
  
  // C/C++ patterns - check first since C++ code might not be detected properly
  if (
    /^#include\s*[<"]/.test(trimmedCode) ||
    /^#define\s+\w+/.test(trimmedCode) ||
    /int\s+main\s*\(/.test(trimmedCode) ||
    /std::(cout|cin|endl)/.test(trimmedCode) ||
    /using\s+namespace\s+std/.test(trimmedCode)
  ) {
    // Distinguish C++ from C
    if (
      /std::|using\s+namespace|class\s+\w+|template\s*</.test(trimmedCode) ||
      /cout|cin|endl/.test(trimmedCode) ||
      /#include\s*<iostream>/.test(trimmedCode) ||
      /#include\s*<windows\.h>/.test(trimmedCode)
    ) {
      return "cpp";
    }
    return "c";
  }
  
  // JavaScript/TypeScript patterns
  if (
    /^(import|export|const|let|var|function|class|interface|type|enum)\s/.test(trimmedCode) ||
    /=>\s*\{/.test(trimmedCode) ||
    /console\.(log|error|warn)/.test(trimmedCode) ||
    /require\(|module\.exports/.test(trimmedCode) ||
    /\.(js|jsx|ts|tsx)['"]/.test(trimmedCode)
  ) {
    // Distinguish TypeScript from JavaScript
    if (
      /:\s*(string|number|boolean|any|void|object|Array<|Promise<)/.test(trimmedCode) ||
      /interface\s+\w+|type\s+\w+\s*=/.test(trimmedCode) ||
      /enum\s+\w+/.test(trimmedCode)
    ) {
      return "typescript";
    }
    return "javascript";
  }
  
  // Python patterns
  if (
    /^(def|class|import|from|if __name__|print\(|lambda\s)/.test(trimmedCode) ||
    /:\s*$/.test(firstLine) && /^\s{4}/.test(lines[1] || '') ||
    /#.*python|\#!\/usr\/bin\/env python/.test(firstLine) ||
    (trimmedCode.includes('f"') || trimmedCode.includes("f'")) && /\{[^}]+\}/.test(trimmedCode)
  ) {
    return "python";
  }
  
  // HTML patterns
  if (
    /^<!DOCTYPE\s+html/i.test(trimmedCode) ||
    /^<html/i.test(trimmedCode) ||
    /<[a-z][\s\S]*>/.test(trimmedCode) && /<\/[a-z]+>/.test(trimmedCode) ||
    /<(div|span|p|a|button|input|form|script|style)/i.test(trimmedCode)
  ) {
    return "HTML";
  }
  
  // CSS patterns
  if (
    /^[\w\-]+\s*\{/.test(trimmedCode) ||
    /:\s*[^;]+;/.test(trimmedCode) && /\{[\s\S]*\}/.test(trimmedCode) ||
    /@(media|keyframes|import|font-face)/.test(trimmedCode)
  ) {
    return "CSS";
  }
  
  // SQL patterns
  if (
    /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\s/i.test(trimmedCode) ||
    /FROM\s+\w+|WHERE\s+\w+|JOIN\s+\w+/i.test(trimmedCode) ||
    /GROUP\s+BY|ORDER\s+BY|HAVING/i.test(trimmedCode)
  ) {
    return "SQL";
  }
  
  // Java patterns
  if (
    /^(public|private|protected)\s+(class|interface|enum)/.test(trimmedCode) ||
    /public\s+static\s+void\s+main\s*\(/.test(trimmedCode) ||
    /@Override|@Deprecated|import\s+java\./.test(trimmedCode) ||
    /System\.(out|err)\.print/.test(trimmedCode)
  ) {
    return "java";
  }
  
  // C# patterns
  if (
    /^using\s+System/.test(trimmedCode) ||
    /namespace\s+\w+/.test(trimmedCode) ||
    /\[(Attribute|Obsolete|Serializable)\]/.test(trimmedCode) ||
    /Console\.(WriteLine|ReadLine)/.test(trimmedCode) ||
    /public\s+class\s+\w+\s*:/.test(trimmedCode)
  ) {
    return "csharp";
  }
  
  // PHP patterns
  if (
    /^<\?php/.test(trimmedCode) ||
    /^\$[a-zA-Z_][a-zA-Z0-9_]*\s*=/.test(trimmedCode) ||
    /echo\s+|print\s+|function\s+\w+\s*\(/.test(trimmedCode) ||
    /->\w+\s*\(/.test(trimmedCode)
  ) {
    return "php";
  }
  
  // Ruby patterns
  if (
    /^def\s+\w+\s*$/.test(trimmedCode) ||
    /^class\s+\w+/.test(trimmedCode) ||
    /puts\s+|require\s+['"]/.test(trimmedCode) ||
    /@\w+|@@\w+/.test(trimmedCode) ||
    /end\s*$/.test(trimmedCode)
  ) {
    return "ruby";
  }
  
  // Go patterns
  if (
    /^package\s+\w+/.test(trimmedCode) ||
    /^import\s+\(/.test(trimmedCode) ||
    /func\s+\w+\s*\(/.test(trimmedCode) ||
    /fmt\.(Print|Scan)/.test(trimmedCode) ||
    /:=/.test(trimmedCode)
  ) {
    return "go";
  }
  
  // Rust patterns
  if (
    /^fn\s+\w+\s*\(/.test(trimmedCode) ||
    /^use\s+\w+::/.test(trimmedCode) ||
    /let\s+(mut\s+)?\w+/.test(trimmedCode) ||
    /println!\s*\(|println!/.test(trimmedCode) ||
    /->\s*[A-Z]\w+/.test(trimmedCode)
  ) {
    return "rust";
  }
  
  // Default to text if no patterns match
  return "text";
}


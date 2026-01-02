/**
 * Code obfuscation utilities for public submission previews.
 * Preserves structure while removing semantic meaning.
 */

/**
 * List of common programming keywords to preserve for structure recognition.
 * These remain visible so viewers can see it's real code.
 */
const PRESERVED_KEYWORDS = new Set([
    // JavaScript/TypeScript
    'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'do',
    'switch', 'case', 'break', 'continue', 'return', 'try', 'catch', 'finally',
    'throw', 'class', 'extends', 'new', 'this', 'super', 'import', 'export',
    'default', 'from', 'async', 'await', 'yield', 'typeof', 'instanceof',
    'in', 'of', 'true', 'false', 'null', 'undefined', 'void',
    // Python
    'def', 'elif', 'except', 'lambda', 'pass', 'raise', 'with', 'as',
    'global', 'nonlocal', 'assert', 'is', 'not', 'and', 'or', 'None',
    'True', 'False', 'print', 'range', 'len', 'input', 'self',
    // C/C++/Java/Rust
    'int', 'float', 'double', 'char', 'bool', 'void', 'long', 'short',
    'unsigned', 'signed', 'static', 'public', 'private', 'protected',
    'virtual', 'override', 'abstract', 'interface', 'implements',
    'package', 'include', 'define', 'struct', 'enum', 'union', 'typedef',
    'sizeof', 'main', 'printf', 'scanf', 'cout', 'cin', 'endl',
    'namespace', 'using', 'template', 'typename', 'const_cast', 'dynamic_cast',
    'reinterpret_cast', 'static_cast', 'nullptr', 'delete', 'explicit',
    'friend', 'inline', 'mutable', 'operator', 'register', 'volatile',
    'fn', 'let', 'mut', 'impl', 'trait', 'mod', 'use', 'pub', 'crate',
    'where', 'unsafe', 'move', 'ref', 'match', 'loop', 'Self',
    // Common types and functions
    'string', 'boolean', 'number', 'array', 'object', 'any', 'type',
    'std', 'vector', 'map', 'set', 'list', 'queue', 'stack', 'pair',
    'Node', 'Tree', 'Graph', 'String', 'Integer', 'Boolean', 'Object',
    'NULL', 'nullptr', 'true', 'false',
]);

/**
 * Obfuscates code while preserving structure.
 * - Keeps indentation, brackets, and block flow
 * - Preserves keywords for readability
 * - Replaces identifiers with underscores
 * - Replaces numbers with placeholders
 * - Replaces string contents
 * 
 * @param code - The source code to obfuscate
 * @returns Obfuscated code with same structure but no semantic meaning
 */
export function obfuscateCode(code: string): string {
    // Process line by line to preserve structure
    return code
        // Replace string literals first (to avoid processing their contents)
        .replace(/"(?:[^"\\]|\\.)*"/g, '""')
        .replace(/'(?:[^'\\]|\\.)*'/g, "''")
        .replace(/`(?:[^`\\]|\\.)*`/g, '``')
        // Replace numbers
        .replace(/\b\d+\.?\d*\b/g, '__')
        // Replace identifiers (but preserve keywords)
        .replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, (match) => {
            if (PRESERVED_KEYWORDS.has(match.toLowerCase()) || PRESERVED_KEYWORDS.has(match)) {
                return match;
            }
            return '___';
        });
}

/**
 * Checks if content appears to be code (vs plain text).
 */
export function isLikelyCode(content: string): boolean {
    const codeIndicators = [
        /[{}\[\]();]/,           // Brackets/semicolons
        /\b(function|def|class|const|let|var|int|void)\b/,  // Keywords
        /[=!<>]{2,}/,            // Operators
        /^\s*(\/\/|#|\/\*)/m,    // Comments
    ];

    return codeIndicators.some(pattern => pattern.test(content));
}

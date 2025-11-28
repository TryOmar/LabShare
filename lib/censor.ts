/**
 * Censoring utility for filtering inappropriate content from comments.
 */

// Bad words list (case-insensitive matching)
// Organized by root forms and variations to catch multiple forms
const BAD_WORDS = [
  // Arabic root insults (will catch variations)
  "احا", "أحا", "خول", "عرص", "قحب", "شرمط", "زبي", "زنا", "وسخ", "وسخة",
  "معرص", "متناك", "منيك",  "وضيع", "حقير", "سافل", "بايظ", "مسحولين", "مجرم",
  "وسخان", "سيس", "سيساوي", "هلفوت", "منحط",
  "بضان", "بضانو", "بضاني", "بضنت", "بضنتني", "بضين", "اتبضن", "اتبضنت",
  "خرا", "شخر", "علقة", "كسين", "طيزك", "زبك",
  "شرموط", "شرموطة", "شرموطه", "ِشرموطه", "الشرموط", "العرص", "القحبة",
  "المتناكه", "المنيوك", "النيك", "معرصين",
  
  // Arabic phrases and compound insults
  "ابن الكلب", "يابن الكلب", "يا كلب", "يا حمار", "امك", "اختك", "ابوك",
  "عيلة بايظة", "وسختك", "ولاد وسخه", "يا عرص", "يعرصك",
  "يخرب بيتك", "يلعن شكلك", "اقلع", "انقلع", "غور", "غور بقى",
  "قلة ادب", "قلة ذوق", "عديم الكرامة",
  "المتهاك", "المتهاكة", "المتهاكه", "امك عندى", "عندي امك",
  "دبري", "ذبري", "ذبي", "ذوبر", "زاني", "زوبر", "زوبري",
  "سيسى", "سيسي", "شراميط", "كسم", "كسمك", "كسمين", "كسمن",
  "كوسم", "كوسمك", "كوس امك", "كس امك", "متناكه", "منايك",
  "منيوك", "منيوكه", "ميتين امك", "نيك", "نيكك", "نيكه",
  "و علق", "يعرصك سمك",
  "ابن العاهره", "ابن المره", "ابن الوخسة", "ابن الوسخه",
  "ابن متناكة", "ابن وسخة", "بنت المتناكه", "بنت متناكة",
  "اين متناكة", "بيعرصو", "تتشرمط", "تنيك", "تنيكك",
  "دين امك", "عيل معرص", "قلع اللباس", "كسختك",
  "ناكو ليه", "هتنيك", "هفشخها",
  
  // Arabic transliterated (root forms)
  "a7a", "a7ba", "ga7ba", "labwa", "kos", "KOSM", "ksm", "qosm", "somk", "tnak",
  "mnik", "mnyk", "mnayk", "manyak", "zob", "zbr", "zobr",
  "2rs", "3rs", "4rs", "5rs", "m3rs", "ma3rs", "5awl", "khwl", "khwel", "khoool",
  "mtna", "mtnak", "kosmk", "ksmk", "qosmk", "hnekk", "hneko", "ksomen",
  "omak", "omk", "pitnak", "anek", "betnak", "bitnak", "bytnak",
  "sharmot", "sharmota", "sharmt", "zbory", "zobrey", "zobry",
  "nek", "YL3AN DEN", "بينينق",
  
  // Arabic transliterated with obfuscation
  "3r$", "3r5", "m3r$", "m3r5", "5@wl", "5@w1", "5@wll", "5*w*l",
  "mtn@k", "mtn@q", "mtna*",
  
  // Arabic transliterated with spaces (to bypass filters)
  "ك س م", "م ن ي ك", "م ت ن ا ك", "ع ر ص", "خ و ل", "و س خ",
  "3 r s", "m 3 r s", "5 a w l", "m t n a k",
  
  // Extended variations (repeated letters to bypass filters)
  "احاا", "ااحا", "اااحا", "خووول", "خوول", "خوووول",
  "عرصص", "عرصسس", "قححب", "قححبب", "شرمطط", "شرمططط",
  "وسخخ", "وسخخخ", "mtnakkk", "mtnnaak", "mtnakkkk",
  "5awlll", "5awwwl", "3rsss", "3rrrs", "m3rrs", "m3rss",
  
  // English root insults
  "fuck", "fuk", "shit", "sh1t", "shet",
  "bitch", "b!tch", "dick", "d1ck", "cock", "c0ck", "pussy",
  "porn", "pornhub", "xxx", "xnxx", "anus",
];

// Precompute sorted bad words array (longest first) for performance
// This is computed once at module load time instead of on every function call
const SORTED_BAD_WORDS = [...BAD_WORDS].sort((a, b) => b.length - a.length);

/**
 * Creates a regex pattern for a bad word, handling Arabic vs English/transliterated differently.
 * 
 * @param badWord - The bad word to create a regex for
 * @returns A regex pattern for matching the bad word
 */
function createBadWordRegex(badWord: string): RegExp {
  // Escape special regex characters in the bad word
  const escapedWord = badWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Check if the word contains Arabic characters
  const hasArabic = /[\u0600-\u06FF]/.test(badWord);
  
  // For Arabic words/phrases, match directly (no word boundaries needed)
  // For English/transliterated words, use word boundaries to avoid partial matches
  if (hasArabic) {
    // Arabic: match as-is, case-insensitive flag doesn't affect Arabic
    return new RegExp(escapedWord, 'gi');
  } else {
    // English/transliterated: use word boundaries to match whole words only
    return new RegExp(`\\b${escapedWord}\\b`, 'gi');
  }
}

// Precompute regex patterns for all bad words at module load time
// This significantly improves performance by avoiding regex creation in loops
const SORTED_BAD_WORD_REGEXES = SORTED_BAD_WORDS.map(word => ({
  word,
  regex: createBadWordRegex(word),
}));

/**
 * Normalizes text by:
 * - Normalizing Unicode characters (handles different Arabic representations)
 * - Removing zero-width characters that could bypass filters
 * 
 * @param text - The text to normalize
 * @returns Normalized text
 */
function normalizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Unicode normalization (handles Arabic text variations)
  // NFKC: Compatibility Decomposition, followed by Canonical Composition
  let normalized = text.normalize('NFKC');
  
  // Remove zero-width characters that could bypass filters
  // U+200B: zero-width space, U+200C: zero-width non-joiner, U+200D: zero-width joiner
  // U+FEFF: zero-width no-break space, U+2060: word joiner
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '');
  
  // Remove other potentially problematic invisible characters
  // U+200E: left-to-right mark, U+200F: right-to-left mark
  normalized = normalized.replace(/[\u200E\u200F]/g, '');
  
  return normalized;
}

/**
 * Replaces a word with asterisks while preserving its length.
 */
function replaceWithAsterisks(word: string): string {
  return "*".repeat(word.length);
}

/**
 * Checks if the given text contains any bad words.
 * 
 * @param text - The text to check
 * @returns true if bad words are found, false otherwise
 */
export function containsBadWords(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Normalize text to handle Unicode variations and zero-width characters
  const normalizedText = normalizeText(text);

  // Use precomputed regex patterns (longest first)
  // This ensures phrases are matched before individual words
  for (const { regex } of SORTED_BAD_WORD_REGEXES) {
    // Use search() instead of test() to avoid regex state issues with global flag
    // search() returns -1 if no match, or index if found (no state maintained)
    if (normalizedText.search(regex) !== -1) {
      return true;
    }
  }

  return false;
}

/**
 * Censors bad words in the given text.
 * Replaces bad words with asterisks while preserving word length.
 * Censors ALL content including code blocks to maintain consistent filtering.
 * 
 * @param text - The text to censor
 * @returns The censored text with bad words replaced by asterisks
 */
export function censorText(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Normalize text to handle Unicode variations and zero-width characters
  let censoredText = normalizeText(text);

  // Use precomputed regex patterns (longest first)
  // This ensures phrases are matched before individual words
  for (const { regex } of SORTED_BAD_WORD_REGEXES) {
    censoredText = censoredText.replace(regex, (match: string) => {
      return replaceWithAsterisks(match);
    });
  }

  return censoredText;
}

/**
 * Processes a comment by censoring its content on-the-fly.
 * This function takes a comment object with a content field, censors the content,
 * and returns a new object with the censored content and an is_censored flag.
 * 
 * @param comment - Comment object with content field
 * @returns Comment with censored content and is_censored flag
 */
export function processCommentCensoring<T extends { content: string }>(
  comment: T
): T & { is_censored: boolean } {
  const originalContent = comment.content;
  
  // Normalize original content first to ensure accurate comparison
  // This prevents false positives when normalization changes text structure
  const normalizedOriginal = normalizeText(originalContent);
  const censoredContent = censorText(originalContent);
  
  // Compare normalized versions to check if actual censoring occurred
  // (not just normalization changes)
  const isCensored = censoredContent !== normalizedOriginal;
  
  return {
    ...comment,
    content: censoredContent,
    is_censored: isCensored, // Always calculated fresh from content
  };
}

/**
 * Processes an array of comments by censoring their content on-the-fly.
 * 
 * @param comments - Array of comment objects with content field
 * @returns Array of comments with censored content and is_censored flags
 */
export function processCommentsCensoring<T extends { content: string }>(
  comments: T[]
): Array<T & { is_censored: boolean }> {
  return comments.map(processCommentCensoring);
}

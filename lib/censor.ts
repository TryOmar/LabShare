/**
 * Censoring utility for filtering inappropriate content from comments.
 */

// Bad words list (case-insensitive matching)
const BAD_WORDS = [
  // Arabic/transliterated words
  "kosmk", "ksmk", "somk", "tnak", "احا", "المتهاك", "دبري", "ذبري", "ذبي", 
  "ذوبر", "زاني", "زوبر", "سيسى", "سيسي", "شرمط", "عرص", "قحب", "كسمك", 
  "كسمين", "كوسم", "كوسمك", "متناك", "نيك", "وسخة", "وسخه",
  
  // English/transliterated words
  "anek", "betnak", "bitnak", "bytnak", "cock", "dick", "disck", "fuck", 
  "ga7ba", "hnekk", "hneko", "ksomen", "labwa", "mnik", "omak", "omk", 
  "pitnak", "pornhub", "pussy", "qosmk", "sharmot", "sharmota", "sharmt", 
  "zbory", "zobrey", "zobry", "zobrعرص", "المتهاكة", "المتهاكه", "امك عندى", 
  "خول", "دوبري", "ذبري", "ذبي", "زاني", "زبي", "زنا", "زوبري", "سيسي", 
  "شراميط", "شرمط", "عندي امك", "قحبه", "كس امك", "كسم", "كسمك", "كسمن", 
  "كسمين", "كوس امك", "متناكه", "معرص", "منايك", "منيك", "منيوك", "منيوكه", 
  "ميتين امك", "نيكك", "نيكه", "و علق", "ولاد وسخه", "يعرصك سمك"
];

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

  // Sort bad words by length (longest first) to handle overlapping words correctly
  const sortedBadWords = [...BAD_WORDS].sort((a, b) => b.length - a.length);

  // Check each bad word
  for (const badWord of sortedBadWords) {
    // Escape special regex characters in the bad word
    const escapedWord = badWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Check if the word contains Arabic characters
    const hasArabic = /[\u0600-\u06FF]/.test(badWord);
    
    // For Arabic words/phrases, match directly (no word boundaries needed)
    // For English/transliterated words, use word boundaries to avoid partial matches
    let regex: RegExp;
    
    if (hasArabic) {
      // Arabic: match as-is, case-insensitive flag doesn't affect Arabic
      regex = new RegExp(escapedWord, 'gi');
    } else {
      // English/transliterated: use word boundaries to match whole words only
      regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    }
    
    // If we find a match, return true immediately
    if (regex.test(text)) {
      return true;
    }
  }

  return false;
}

/**
 * Censors bad words in the given text.
 * Replaces bad words with asterisks while preserving word length.
 * 
 * @param text - The text to censor
 * @returns The censored text with bad words replaced by asterisks
 */
export function censorText(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let censoredText = text;

  // Sort bad words by length (longest first) to handle overlapping words correctly
  // This ensures phrases are matched before individual words
  const sortedBadWords = [...BAD_WORDS].sort((a, b) => b.length - a.length);

  // Replace each bad word (case-insensitive for English words)
  sortedBadWords.forEach(badWord => {
    // Escape special regex characters in the bad word
    const escapedWord = badWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Check if the word contains Arabic characters
    const hasArabic = /[\u0600-\u06FF]/.test(badWord);
    
    // For Arabic words/phrases, match directly (no word boundaries needed)
    // For English/transliterated words, use word boundaries to avoid partial matches
    let regex: RegExp;
    
    if (hasArabic) {
      // Arabic: match as-is, case-insensitive flag doesn't affect Arabic
      regex = new RegExp(escapedWord, 'gi');
    } else {
      // English/transliterated: use word boundaries to match whole words only
      regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    }
    
    censoredText = censoredText.replace(regex, (match) => {
      return replaceWithAsterisks(match);
    });
  });

  return censoredText;
}


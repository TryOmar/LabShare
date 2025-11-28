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
  "خرا", "خخ", "شخر", "علقة", "كس", "كسين", "طيزك", "زبك",
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
  "mnik", "mnyk", "mnayk", "manyak", "zob", "zb", "zbr", "zobr",
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
  "fuck", "fuk", "fk", "shit", "sh1t", "shet",
  "bitch", "b!tch", "dick", "d1ck", "dic", "cock", "c0ck", "pussy",
  "trash", "loser", "idiot", "stupid", "moron",
  "porn", "pornhub", "xxx", "xnxx", "disck", "anus",
  "test", "test2"
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


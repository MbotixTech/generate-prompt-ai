const axios = require('axios');
const querystring = require('querystring');

// Common Indonesian words that should not be treated as proper nouns
const commonIndonesianWords = {
  'wanita': 'woman',
  'pria': 'man',
  'laki': 'male',
  'perempuan': 'female',
  'gadis': 'girl',
  'lelaki': 'man',
  'orang': 'person',
  'anak': 'child',
  // Add more common words as needed
};

/**
 * Check if a word is a common Indonesian word that might be mistakenly treated as a proper noun
 * @param {string} text - Text to check
 * @returns {string|null} - English translation if it's a common word, null otherwise
 */
const checkCommonWords = (text) => {
  const lowerCaseText = text.toLowerCase().trim();
  return commonIndonesianWords[lowerCaseText] || null;
};

/**
 * Translate text from one language to another using Google Translate API
 * @param {string} text - Text to translate
 * @param {string} from - Source language code (e.g., 'id' for Indonesian)
 * @param {string} to - Target language code (e.g., 'en' for English)
 * @returns {Promise<string>} - Translated text
 */
exports.translateText = async (text, from, to) => {
  try {
    if (!text) return '';

    // Check for common Indonesian words that should not be treated as proper nouns
    if (from === 'id' && to === 'en') {
      // Special case handling for standalone subject field which might be a common word
      const commonWord = checkCommonWords(text);
      if (commonWord) {
        return commonWord;
      }
    }

    // URL for unofficial Google Translate API
    const url = 'https://translate.googleapis.com/translate_a/single';
    
    const params = {
      client: 'gtx',
      sl: from,
      tl: to,
      dt: 't',
      q: text
    };
    
    const requestUrl = `${url}?${querystring.stringify(params)}`;
    
    const response = await axios.get(requestUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0'
      }
    });
    
    // The response has a complex structure, we need to extract the translated text
    if (response.data && Array.isArray(response.data) && response.data[0] && Array.isArray(response.data[0])) {
      let translatedText = '';
      
      // Concatenate all translated parts
      response.data[0].forEach(part => {
        if (part[0]) {
          translatedText += part[0];
        }
      });
      
      // Post-process the translation for quality improvement
      translatedText = postProcessTranslation(text, translatedText, from, to);
      
      return translatedText;
    }
    
    throw new Error('Unexpected response format from translation API');
  } catch (error) {
    console.error('Translation error:', error.message);
    console.error('Failed to translate text:', text);
    // Return original text if translation fails
    return text;
  }
};

/**
 * Post-process translation to fix common issues
 * @param {string} original - Original text
 * @param {string} translated - Translated text
 * @param {string} from - Source language
 * @param {string} to - Target language
 * @returns {string} - Improved translation
 */
function postProcessTranslation(original, translated, from, to) {
  if (from === 'id' && to === 'en') {
    // Fix common Indonesian-to-English translation issues
    
    // Fix "ahegao pose" translation issues
    if (original.toLowerCase().includes('ahegao')) {
      translated = translated.replace(/looked up to the black and lost the ahegao pose/i, 
        'with eyes rolled up in an ahegao expression');
      translated = translated.replace(/black and lost the ahegao pose/i, 
        'in an ahegao expression');
    }
    
    // Fix "tongue" related translation issues
    if (original.toLowerCase().includes('lidah') || original.toLowerCase().includes('melet')) {
      translated = translated.replace(/tongue erupted out/i, 'tongue sticking out');
      translated = translated.replace(/tongue out/i, 'tongue sticking out');
    }
    
    // Handle common Indonesian words that might be treated as names
    for (const [indo, eng] of Object.entries(commonIndonesianWords)) {
      // Replace "a person named Word" with "a Word" when Word is a common noun
      const pattern = new RegExp(`a\\s+\\w+\\s+named\\s+${indo}\\b`, 'i');
      if (pattern.test(translated)) {
        translated = translated.replace(pattern, `a ${eng}`);
      }
      
      // Also handle capitalized versions at the beginning of sentences
      const capitalized = indo.charAt(0).toUpperCase() + indo.slice(1);
      if (translated.startsWith(capitalized)) {
        const startsWithPattern = new RegExp(`^${capitalized}\\b`);
        translated = translated.replace(startsWithPattern, eng.charAt(0).toUpperCase() + eng.slice(1));
      }
    }
  }
  
  return translated;
}

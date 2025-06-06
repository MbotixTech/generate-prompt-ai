import axios from 'axios';

/**
 * Translate text from Indonesian to English using Google Translate API
 * @param {string} text - Text to translate
 * @returns {Promise<string>} - Translated text
 */
export async function translateText(text) {
  if (!text) return '';
  
  try {
    // Use unofficial Google Translate API
    const url = 'https://translate.googleapis.com/translate_a/single';
    
    const params = {
      client: 'gtx',
      sl: 'id', // Source: Indonesian
      tl: 'en', // Target: English
      dt: 't',
      q: text
    };
    
    // Convert params to query string
    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const response = await axios.get(`${url}?${queryString}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36'
      }
    });
    
    // Extract the translated text from the response
    if (response.data && Array.isArray(response.data[0])) {
      let translatedText = '';
      
      // Concatenate all translated parts
      response.data[0].forEach(part => {
        if (part[0]) {
          translatedText += part[0];
        }
      });
      
      return translatedText;
    }
    
    return text; // Return original text if translation fails
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
}

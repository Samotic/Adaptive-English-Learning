import gtts from 'google-tts-api';

/**
 * Generate high-quality TTS audio URLs using Google Translate API
 * This uses the proper google-tts-api library for better quality
 */
export async function generateHighQualityTTSUrl(text, language = 'en') {
  try {
    // Ensure text is a string and not too long
    const textStr = String(text || '').trim();
    if (!textStr) return null;
    
    // google-tts-api returns array of audio URLs (splits long text)
    const urls = await gtts.getAudioUrl({
      text: textStr,
      lang: language,
      slow: false,
      host: 'https://translate.google.com',
    });
    
    // Return the first URL (usually single URL for short text)
    return urls && urls.length > 0 ? urls[0] : null;
  } catch (e) {
    console.error('TTS generation error:', e.message);
    return null;
  }
}

export default { generateHighQualityTTSUrl };

import CryptoJS from 'crypto-js';
import { AudioQuality } from './types';

const JIOSAAVN_SECRET_KEY = CryptoJS.enc.Utf8.parse('38346591');

/**
 * Decrypts JioSaavn's DES-ECB encrypted media URL directly in the browser.
 * Yields direct streaming URL from aac.saavncdn.com with user-selected bitrate.
 */
export function decryptMediaUrl(
  encryptedMediaUrl: string,
  quality: AudioQuality = '320kbps'
): string | null {
  if (!encryptedMediaUrl) return null;

  try {
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encryptedMediaUrl),
    });

    const decrypted = CryptoJS.DES.decrypt(cipherParams, JIOSAAVN_SECRET_KEY, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });

    let streamUrl = decrypted.toString(CryptoJS.enc.Utf8);
    if (!streamUrl || !streamUrl.startsWith('http')) {
      return null;
    }

    // Adjust quality suffix (_96.mp4, _160.mp4, _320.mp4)
    const bitrateNumber = quality === '96kbps' ? '96' : quality === '160kbps' ? '160' : '320';
    streamUrl = streamUrl.replace(/_[0-9]+(\.[a-z0-9]+)$/i, `_${bitrateNumber}$1`);
    
    // Ensure HTTPS
    return streamUrl.replace(/^http:\/\//i, 'https://');
  } catch (error) {
    console.error('Failed to decrypt audio stream URL:', error);
    return null;
  }
}

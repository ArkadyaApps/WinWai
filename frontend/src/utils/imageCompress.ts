import { Platform } from 'react-native';

// Photos straight from a phone are thousands of pixels wide, but the app shows
// them at card/hero size. Images are stored inline (base64) and sent in list
// responses, so shrinking them at upload keeps Home light. Web only (uses a
// canvas); native returns the image unchanged.
export async function compressImageDataUri(dataUri: string, maxSide = 900, quality = 0.7): Promise<string> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return dataUri;

  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUri);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        // Never make an already-small image bigger.
        resolve(compressed.length < dataUri.length ? compressed : dataUri);
      } catch {
        resolve(dataUri);
      }
    };
    img.onerror = () => resolve(dataUri);
    img.src = dataUri;
  });
}

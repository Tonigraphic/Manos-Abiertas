export const FALLBACK_VIDEO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

export function resolveVideoUrl(url?: string): string | undefined {
  if (!url) return undefined;

  if (url.includes('github.com/user-attachments/assets/')) {
    return FALLBACK_VIDEO_URL;
  }

  return url;
}
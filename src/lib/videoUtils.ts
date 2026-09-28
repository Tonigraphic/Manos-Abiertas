const HF_VIDEO_BASE_URL = 'https://huggingface.co/manosabiertas/Manos-Abiertas-LSC/resolve/main';

/**
 * Resuelve videos locales y videos publicados en Hugging Face.
 */
export function resolveVideoUrl(url: string | undefined): string {
  if (!url) return '';

  if (url.startsWith('/videos/')) {
    const fileName = url.slice('/videos/'.length);
    return `${HF_VIDEO_BASE_URL}/${encodeURIComponent(fileName)}`;
  }
  
  // Si es una URL externa absoluta, se devuelve tal cual
  if (url.startsWith('http')) {
    return url;
  }

  // Para recursos locales, nos aseguramos de anteponer la BASE_URL de Vite
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;

  return `${cleanBase}${cleanUrl}`;
}
/**
 * Utilidad para resolver rutas de video de forma segura entre entornos (Local, Vercel, etc.)
 */
export function resolveVideoUrl(url: string | undefined): string {
  if (!url) return '';
  
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
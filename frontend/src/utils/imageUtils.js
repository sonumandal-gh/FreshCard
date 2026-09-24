export const DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60";

/**
 * Normalizes and builds a proper display URL for product images.
 * Fixes mixed content issues (http vs https), relative /uploads paths,
 * and localhost URLs in production environments.
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return DEFAULT_FALLBACK_IMAGE;

  // Data URLs or Blob URLs (from instant client file input preview)
  if (typeof imagePath === 'string' && (imagePath.startsWith('data:') || imagePath.startsWith('blob:'))) {
    return imagePath;
  }

  const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://api.sonumandal.in/api' : 'http://localhost:5002/api');
  const backendOrigin = apiBase.replace(/\/api\/?$/, '');

  // Relative upload paths starting with /uploads/ or uploads/
  if (typeof imagePath === 'string' && (imagePath.startsWith('/uploads/') || imagePath.startsWith('uploads/'))) {
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${backendOrigin}${cleanPath}`;
  }

  // Absolute URLs
  if (typeof imagePath === 'string' && imagePath.startsWith('http')) {
    // If the frontend is loaded over HTTPS
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      // If DB has localhost/127.0.0.1 saved, map it to the production backend origin
      if (imagePath.includes('localhost') || imagePath.includes('127.0.0.1')) {
        const pathParts = imagePath.split('/uploads/');
        if (pathParts.length > 1) {
          return `${backendOrigin}/uploads/${pathParts[1]}`;
        }
      }
      // Convert http:// to https:// to avoid mixed content errors
      return imagePath.replace('http://', 'https://');
    }
  }

  return imagePath;
};

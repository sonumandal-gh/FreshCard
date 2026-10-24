export const DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80";

// High-resolution grocery images mapped to common item names & categories
export const PRODUCT_FALLBACK_MAP = {
  // Specific Products
  'onion': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
  'potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
  'carrot': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80',
  'brinjal': 'https://images.unsplash.com/photo-1659261046522-83ff53d08593?w=600&auto=format&fit=crop&q=80',
  'eggplant': 'https://images.unsplash.com/photo-1659261046522-83ff53d08593?w=600&auto=format&fit=crop&q=80',
  'curd': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
  'yogurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
  'paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
  'cheese': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
  'milk': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
  'apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80',
  'watermelon': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80',
  'musk melon': 'https://images.unsplash.com/photo-1598025362874-49480e049c76?w=600&auto=format&fit=crop&q=80',
  'melon': 'https://images.unsplash.com/photo-1598025362874-49480e049c76?w=600&auto=format&fit=crop&q=80',
  'noodle': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
  'crax': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
  'bhujia': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80',
  'bikaji': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80',
  'tedhe medhe': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
  'kurkure': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
  'tomato': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
  'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
  'mango': 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80',
  'bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
  'butter': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80',
  'egg': 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600&auto=format&fit=crop&q=80',
  'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',

  // Categories
  'vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
  'fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80',
  'dairy': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80',
  'snacks': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
  'beverages': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&auto=format&fit=crop&q=80'
};

/**
 * Returns a high quality grocery image based on product name or category
 */
export const getProductFallbackImage = (name = '', category = '') => {
  const cleanName = (name || '').toLowerCase();
  const cleanCat = (category || '').toLowerCase();

  for (const [key, url] of Object.entries(PRODUCT_FALLBACK_MAP)) {
    if (cleanName.includes(key)) {
      return url;
    }
  }

  for (const [key, url] of Object.entries(PRODUCT_FALLBACK_MAP)) {
    if (cleanCat.includes(key)) {
      return url;
    }
  }

  return DEFAULT_FALLBACK_IMAGE;
};

/**
 * Normalizes and builds a proper display URL for product images.
 * Fixes mixed content issues (http vs https), relative /uploads paths,
 * localhost URLs in production, and provides graceful contextual fallbacks.
 */
export const getImageUrl = (imagePath, name = '', category = '') => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return getProductFallbackImage(name, category);
  }

  // Data URLs or Blob URLs (from instant client file input preview)
  if (imagePath.startsWith('data:') || imagePath.startsWith('blob:')) {
    return imagePath;
  }

  const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://api.sonumandal.in/api' : 'http://localhost:5002/api');
  const backendOrigin = apiBase.replace(/\/api\/?$/, '');

  // Any path containing /uploads/ (relative or absolute with localhost/production)
  if (imagePath.includes('/uploads/')) {
    const pathParts = imagePath.split('/uploads/');
    const relativeFilename = pathParts[pathParts.length - 1];
    return `${backendOrigin}/uploads/${relativeFilename}`;
  }

  // Pure filename without path (e.g. 12345.png)
  if (!imagePath.startsWith('http') && !imagePath.startsWith('/')) {
    return `${backendOrigin}/uploads/${imagePath}`;
  }

  // External absolute URLs (e.g. Cloudinary, Unsplash)
  if (imagePath.startsWith('http')) {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && imagePath.startsWith('http://')) {
      return imagePath.replace('http://', 'https://');
    }
    return imagePath;
  }

  return imagePath;
};

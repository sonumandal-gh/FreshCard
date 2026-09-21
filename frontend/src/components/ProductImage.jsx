import React, { useState } from 'react';
import { Package } from 'lucide-react';

const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60";

export const ProductImage = ({ src, alt, style, className, ...props }) => {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justify: 'center', 
          background: 'rgba(255, 255, 255, 0.05)', 
          borderRadius: style?.borderRadius || '8px',
          overflow: 'hidden',
          ...style 
        }} 
        className={className}
      >
        <img 
          src={DEFAULT_FALLBACK} 
          alt={alt || "Product"} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || "Product"}
      style={style}
      className={className}
      onError={() => setImgError(true)}
      {...props}
    />
  );
};

export default ProductImage;

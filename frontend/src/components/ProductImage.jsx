import React, { useState } from 'react';
import { getImageUrl, DEFAULT_FALLBACK_IMAGE } from '../utils/imageUtils';

export const ProductImage = ({ src, alt, style, className, ...props }) => {
  const [imgError, setImgError] = useState(false);
  const resolvedSrc = getImageUrl(src);

  if (!src || imgError) {
    return (
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'rgba(255, 255, 255, 0.05)', 
          borderRadius: style?.borderRadius || '8px',
          overflow: 'hidden',
          ...style 
        }} 
        className={className}
      >
        <img 
          src={DEFAULT_FALLBACK_IMAGE} 
          alt={alt || "Product"} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt || "Product"}
      style={style}
      className={className}
      onError={() => setImgError(true)}
      {...props}
    />
  );
};

export default ProductImage;


import React, { useState } from 'react';
import { getImageUrl, getProductFallbackImage } from '../utils/imageUtils';

export const ProductImage = ({ src, alt, category, style, className, ...props }) => {
  const [imgError, setImgError] = useState(false);
  const resolvedSrc = imgError 
    ? getProductFallbackImage(alt, category) 
    : getImageUrl(src, alt, category);

  return (
    <img
      src={resolvedSrc}
      alt={alt || "Product"}
      style={style}
      className={className}
      onError={() => {
        if (!imgError) setImgError(true);
      }}
      loading="lazy"
      {...props}
    />
  );
};

export default ProductImage;

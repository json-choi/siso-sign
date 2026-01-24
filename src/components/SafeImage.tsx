'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackClassName?: string;
}

export default function SafeImage({ 
  src, 
  alt, 
  className,
  fallbackClassName,
  ...props 
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError || !src) {
    return (
      <div 
        className={fallbackClassName || className || 'bg-white/5 flex items-center justify-center'}
        style={props.fill ? { position: 'absolute', inset: 0 } : undefined}
      >
        <span className="text-gray-600 text-sm">No Image</span>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div 
          className={fallbackClassName || className || 'bg-white/5 animate-pulse'}
          style={props.fill ? { position: 'absolute', inset: 0 } : undefined}
        />
      )}
      <Image
        src={src}
        alt={alt}
        className={className}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
        {...props}
      />
    </>
  );
}

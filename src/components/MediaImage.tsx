'use client';

import Image from 'next/image';
import { MEDIA_WIDTHS, isMediaUrl, mediaUrl } from '@/lib/media';
import { cn } from '@/lib/cn';
import type { ImageProps } from 'next/image';

/**
 * next/image replacement for R2 media. The media route resizes on request, so
 * this renders an <img> whose srcset lists every resize width and lets the
 * browser download the smallest one that fills the box. Other sources fall
 * back to next/image.
 */
export default function MediaImage({ alt, ...props }: ImageProps) {
  const { src, fill, sizes, className, priority, width, height, style, draggable } = props;
  if (!isMediaUrl(src)) return <Image alt={alt} {...props} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- srcset points at the media resizer directly.
    <img
      src={mediaUrl(src, 1280)}
      srcSet={MEDIA_WIDTHS.map((w) => `${mediaUrl(src, w)} ${w}w`).join(', ')}
      sizes={sizes ?? (fill ? '100vw' : `${Number(width) || 1280}px`)}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      draggable={draggable}
      className={cn(fill && 'absolute inset-0 h-full w-full', className)}
      style={style}
    />
  );
}

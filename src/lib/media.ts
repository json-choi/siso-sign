/** Widths the media route will resize to; anything else is rounded up to one of these. */
export const MEDIA_WIDTHS = [256, 384, 640, 960, 1280, 1920] as const;

export function isMediaUrl(src: unknown): src is string {
  return typeof src === 'string' && src.startsWith('/media/');
}

export function mediaWidth(requested: number): number {
  return MEDIA_WIDTHS.find((width) => width >= requested) ?? MEDIA_WIDTHS[MEDIA_WIDTHS.length - 1];
}

/** URL of an R2 media image resized for a rendered width. */
export function mediaUrl(src: string, width: number): string {
  return `${src}${src.includes('?') ? '&' : '?'}w=${mediaWidth(width)}`;
}

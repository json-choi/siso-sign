import type { CSSProperties } from 'react';

/** How one photo is framed wherever it is cropped: the point kept in view (percent) and zoom. */
export interface ImageCrop {
  x: number;
  y: number;
  zoom: number;
}

export type ImageSettings = Record<string, ImageCrop>;

/** Aspect ratio of the photos on a project's detail page. 'original' shows each photo uncropped. */
export const DISPLAY_RATIOS = ['4:3', '1:1', '3:4', '16:9', 'original'] as const;
export type DisplayRatio = (typeof DISPLAY_RATIOS)[number];

export const DISPLAY_RATIO_LABELS: Record<DisplayRatio, string> = {
  '4:3': '가로 4:3',
  '1:1': '정사각 1:1',
  '3:4': '세로 3:4',
  '16:9': '와이드 16:9',
  original: '원본 비율',
};

export const DEFAULT_CROP: ImageCrop = { x: 50, y: 50, zoom: 1 };
export const MAX_ZOOM = 2.5;

export function isDisplayRatio(value: unknown): value is DisplayRatio {
  return typeof value === 'string' && (DISPLAY_RATIOS as readonly string[]).includes(value);
}

export function toDisplayRatio(value: unknown): DisplayRatio {
  return isDisplayRatio(value) ? value : '4:3';
}

/** CSS aspect-ratio for a display ratio, or undefined for original. */
export function aspectRatioOf(ratio: DisplayRatio): string | undefined {
  return ratio === 'original' ? undefined : ratio.replace(':', ' / ');
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, number));
}

/** Validates stored or submitted settings, dropping anything malformed. */
export function parseImageSettings(value: unknown): ImageSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const settings: ImageSettings = {};
  for (const [url, crop] of Object.entries(value)) {
    if (typeof url !== 'string' || !url || !crop || typeof crop !== 'object') continue;
    const raw = crop as Record<string, unknown>;
    settings[url] = {
      x: Math.round(clamp(raw.x, 0, 100, 50) * 10) / 10,
      y: Math.round(clamp(raw.y, 0, 100, 50) * 10) / 10,
      zoom: Math.round(clamp(raw.zoom, 1, MAX_ZOOM, 1) * 100) / 100,
    };
  }
  return settings;
}

export function cropFor(settings: unknown, url: string | null | undefined): ImageCrop {
  if (!url) return DEFAULT_CROP;
  return parseImageSettings(settings)[url] ?? DEFAULT_CROP;
}

export function isDefaultCrop(crop: ImageCrop): boolean {
  return crop.x === 50 && crop.y === 50 && crop.zoom === 1;
}

/**
 * Style for an object-fit: cover image so the chosen point stays in view at
 * any frame shape, and zoom grows around that point.
 */
export function cropStyle(crop: ImageCrop): CSSProperties {
  return {
    objectPosition: `${crop.x}% ${crop.y}%`,
    transformOrigin: `${crop.x}% ${crop.y}%`,
    transform: crop.zoom === 1 ? undefined : `scale(${crop.zoom})`,
  };
}

import { EmotionDefinition, EntryComputedColor } from '../types';

/**
 * Calculates luminance to determine if text on this color should be dark or light
 */
export function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return 0.5;

  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Determines whether text should be dark (#201D1A) or light (#FFFFFF)
 */
export function getOptimalTextColor(hex: string): string {
  const lum = getLuminance(hex);
  return lum > 0.45 ? '#201D1A' : '#FAF8F5';
}

/**
 * Computes the color representation from selected emotion IDs and optional override
 */
export function computeEntryColor(
  emotionIds: string[],
  palette: EmotionDefinition[],
  customOverride?: string | null
): EntryComputedColor {
  if (customOverride && isValidHex(customOverride)) {
    return {
      isGradient: false,
      color1: customOverride,
      cssBackground: customOverride,
    };
  }

  if (emotionIds.length === 0) {
    return {
      isGradient: false,
      color1: '#E8E3DA',
      cssBackground: '#E8E3DA',
    };
  }

  const colorMap = new Map(palette.map((e) => [e.id, e.color]));
  const color1 = colorMap.get(emotionIds[0]) || '#F2CB85';

  if (emotionIds.length === 1) {
    return {
      isGradient: false,
      color1,
      cssBackground: color1,
    };
  }

  const color2 = colorMap.get(emotionIds[1]) || '#A6C4B7';
  return {
    isGradient: true,
    color1,
    color2,
    cssBackground: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
  };
}

export function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

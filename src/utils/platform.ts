import { Platform } from 'react-native';
import * as Device from 'expo-device';

export type GlassVariant = 'standard' | 'liquid';

/** iOS 26+ uses Apple's Liquid Glass design language */
export function getIOSMajorVersion(): number | null {
  if (Platform.OS !== 'ios') return null;
  const version = Platform.Version;
  if (typeof version === 'string') {
    const major = parseInt(version.split('.')[0], 10);
    return Number.isNaN(major) ? null : major;
  }
  return version;
}

export function supportsLiquidGlass(): boolean {
  const major = getIOSMajorVersion();
  return major !== null && major >= 26;
}

/** Web + iOS 26 use full liquid material; other native uses standard glass. */
export function getGlassVariant(): GlassVariant {
  if (Platform.OS === 'web' || supportsLiquidGlass()) return 'liquid';
  return 'standard';
}

export function getDeviceLabel(): string {
  if (Platform.OS === 'ios') {
    const major = getIOSMajorVersion();
    if (major && major >= 26) return `iOS ${Platform.Version} · Liquid Glass`;
    if (major) return `iOS ${Platform.Version}`;
    return 'iOS';
  }
  if (Platform.OS === 'android') {
    return `Android ${Platform.Version}`;
  }
  return Device.modelName ?? Platform.OS;
}

export function getBlurIntensity(variant: GlassVariant, isDark: boolean): number {
  if (variant === 'liquid') {
    return isDark ? 48 : 40;
  }
  return isDark ? 36 : 32;
}

export function getGlassOpacity(variant: GlassVariant, isDark: boolean): number {
  if (variant === 'liquid') {
    return isDark ? 0.35 : 0.55;
  }
  return isDark ? 0.45 : 0.65;
}

export function getGlassBorderOpacity(variant: GlassVariant): number {
  return variant === 'liquid' ? 0.55 : 0.35;
}

import { Platform, useWindowDimensions } from 'react-native';
import { LAYOUT } from '../constants/layout';

/** Shared spacing + width tokens for phone, tablet, and desktop web. */
export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isCompact = width < 380;
  const isTablet = width >= 768;
  const isDesktopWeb = isWeb && width >= LAYOUT.desktopBreakpoint;

  const contentMaxWidth = isDesktopWeb
    ? LAYOUT.maxFrameWidth - 48
    : isTablet
      ? 560
      : LAYOUT.maxContentWidth;

  const screenPaddingH = isCompact ? 16 : isDesktopWeb ? 20 : LAYOUT.screenPaddingH;
  const sectionGap = isDesktopWeb ? 20 : LAYOUT.sectionGap;
  const blockGap = isDesktopWeb ? 12 : LAYOUT.blockGap;

  return {
    width,
    isWeb,
    isCompact,
    isTablet,
    isDesktopWeb,
    contentMaxWidth,
    screenPaddingH,
    sectionGap,
    blockGap,
  };
}

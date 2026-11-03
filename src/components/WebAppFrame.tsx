import React, { ReactNode, useEffect } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { VILATECH_CANVAS, VILATECH_STORY, GLASS } from '../constants/glass';
import { LAYOUT } from '../constants/layout';
import { BRAND } from '../constants/theme';
import { webOnlyStyle } from '../utils/webStyles';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface WebAppFrameProps {
  children: ReactNode;
}

/**
 * Desktop web: phone-scale work surface on the same VILATECH story canvas
 * as the native app — so the website build matches the product chrome.
 */
export function WebAppFrame({ children }: WebAppFrameProps) {
  const { width, height } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= LAYOUT.desktopBreakpoint;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.body.style.backgroundColor = VILATECH_CANVAS.background;

    const root = document.getElementById('root');
    if (root) {
      root.style.height = '100%';
      root.style.display = 'flex';
      root.style.flexDirection = 'column';
    }

    const id = 'meeting-pro-web-frame-keyframes';
    if (!document.getElementById(id)) {
      const styleEl = document.createElement('style');
      styleEl.id = id;
      styleEl.textContent = `
        @keyframes meeting-pro-frame-ambient {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(3%, 2%, 0) scale(1.04); }
          100% { transform: translate3d(-2%, 3.5%, 0) scale(1.02); }
        }
        @media (prefers-reduced-motion: reduce) {
          .meeting-pro-frame-ambient { animation: none !important; }
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, []);

  if (!isDesktopWeb) {
    return <View style={styles.appRoot}>{children}</View>;
  }

  const frameHeight = Math.min(height - 40, LAYOUT.maxFrameHeight);
  const frameWidth = Math.min(width - 32, width >= 1024 ? 480 : LAYOUT.maxFrameWidth);

  return (
    <View style={styles.desktopCanvas}>
      <View
        pointerEvents="none"
        style={[
          styles.ambient,
          webOnlyStyle({
            background: VILATECH_STORY.dark.css,
            animation: reduceMotion
              ? 'none'
              : 'meeting-pro-frame-ambient 36s ease-in-out infinite alternate',
            willChange: reduceMotion ? 'auto' : 'transform',
          }),
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.grain,
          webOnlyStyle({
            opacity: VILATECH_STORY.grainOpacity.dark,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }),
        ]}
      />

      <View
        style={[
          styles.frame,
          {
            width: frameWidth,
            height: frameHeight,
            maxHeight: frameHeight,
            borderColor: GLASS.border.rim,
          },
          webOnlyStyle({
            backdropFilter: `blur(2px)`,
            boxShadow: GLASS.shadow.frame,
          }),
        ]}
      >
        <View
          pointerEvents="none"
          style={[
            styles.frameSheen,
            webOnlyStyle({
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 28%)',
            }),
          ]}
        />
        <View style={styles.appRoot}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    zIndex: 1,
  },
  desktopCanvas: {
    flex: 1,
    minHeight: '100vh' as unknown as number,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: BRAND.black,
    overflow: 'hidden',
    position: 'relative',
  },
  ambient: {
    position: 'absolute',
    top: '-15%',
    left: '-15%',
    right: '-15%',
    bottom: '-15%',
  },
  grain: {
    ...StyleSheet.absoluteFill,
  },
  frame: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    backgroundColor: BRAND.gray950,
    position: 'relative',
    zIndex: 1,
  },
  frameSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 72,
    zIndex: 2,
  },
});

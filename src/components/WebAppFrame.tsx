import React, { ReactNode, useEffect } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { VILATECH_CANVAS } from '../constants/glass';
import { LAYOUT } from '../constants/layout';
import { BRAND } from '../constants/theme';
import { webOnlyStyle } from '../utils/webStyles';

interface WebAppFrameProps {
  children: ReactNode;
}

/**
 * Desktop web: centered work surface on black. Content panes stay corporate;
 * liquid glass is reserved for the bottom tab bar inside the app.
 */
export function WebAppFrame({ children }: WebAppFrameProps) {
  const { width, height } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= LAYOUT.desktopBreakpoint;

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
  }, []);

  if (!isDesktopWeb) {
    return <View style={styles.appRoot}>{children}</View>;
  }

  const frameHeight = Math.min(height - 40, LAYOUT.maxFrameHeight);
  const frameWidth = Math.min(width - 32, width >= 1024 ? 480 : LAYOUT.maxFrameWidth);

  return (
    <View style={styles.desktopCanvas}>
      <View
        style={[
          styles.frame,
          {
            width: frameWidth,
            height: frameHeight,
            maxHeight: frameHeight,
          },
        ]}
      >
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
  },
  frame: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: BRAND.gray950,
    ...webOnlyStyle({
      boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
    }),
  },
});

/** Consistent layout rhythm across all screens */
export const LAYOUT = {
  /** Viewports at or above this width use the centered desktop web frame */
  desktopBreakpoint: 640,
  /** Centered app panel on desktop web */
  maxFrameWidth: 440,
  maxFrameHeight: 920,
  /** Main app column on web — matches VILATECH / BookSmart convention */
  maxContentWidth: 720,
  /** Sign-in and narrow forms */
  maxFormWidth: 400,
  /** Floating tab bar cap on wide viewports */
  maxTabBarWidth: 400,
  screenPaddingH: 22,
  screenPaddingTop: 8,
  sectionGap: 28,
  blockGap: 16,
  itemGap: 12,
  cardGap: 14,
  /** Space reserved above the floating tab bar (bar + margins). */
  tabBarClearance: 132,
  /** Extra breathing room after last scroll item. */
  scrollExtraBottom: 20,
  /** Stack screens without tab bar. */
  stackBottomClearance: 40,
  headerBottom: 20,
};

export const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LAYOUT } from '../constants/layout';

/** Bottom padding for tab screens (floating glass tab bar + safe area). */
export function useTabScreenBottomInset(): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + LAYOUT.tabBarClearance + LAYOUT.scrollExtraBottom;
}

/** Bottom padding for stack/modal screens (no tab bar). */
export function useStackScreenBottomInset(): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + LAYOUT.scrollExtraBottom + LAYOUT.stackBottomClearance;
}

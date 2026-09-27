import { useEffect } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Bookmark, Zap } from 'lucide-react-native';

import { WELCOME_COLORS } from '@/lib/colors';

const HERO = require('@/assets/smartsave-welcome-hero.png');
const SPLASH_DURATION_MS = 1550;

type LaunchScreenProps = {
  onFinish: () => void;
};

/** Branded in-app splash shown after the native launch screen releases. */
export function LaunchScreen({ onFinish }: LaunchScreenProps) {
  const { width, height } = useWindowDimensions();
  const artworkOpacity = useSharedValue(0);
  const artworkScale = useSharedValue(0.94);
  const markOpacity = useSharedValue(0);
  const markScale = useSharedValue(0.72);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    artworkOpacity.value = withTiming(0.42, { duration: 650 });
    artworkScale.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
    markOpacity.value = withTiming(1, { duration: 380 });
    markScale.value = withSequence(
      withTiming(1.08, { duration: 500, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 260 }),
    );
    screenOpacity.value = withDelay(
      1220,
      withTiming(0, { duration: 330 }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
  }, [artworkOpacity, artworkScale, markOpacity, markScale, onFinish, screenOpacity]);

  const artworkStyle = useAnimatedStyle(() => ({
    opacity: artworkOpacity.value,
    transform: [{ scale: artworkScale.value }],
  }));
  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value }],
  }));
  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));

  return (
    <Animated.View accessibilityLabel="SmartSave is opening" style={[styles.screen, screenStyle]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, artworkStyle]}>
        <Image
          source={HERO}
          resizeMode="cover"
          style={{ width, height }}
          accessibilityIgnoresInvertColors
        />
      </Animated.View>

      <Animated.View style={[styles.mark, markStyle]}>
        <Bookmark color={WELCOME_COLORS.white} size={32} strokeWidth={2.4} />
        <View style={styles.boltBadge}>
          <Zap color={WELCOME_COLORS.navy} fill={WELCOME_COLORS.navy} size={12} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export { SPLASH_DURATION_MS };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WELCOME_COLORS.navy,
  },
  mark: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: WELCOME_COLORS.violet,
    shadowColor: WELCOME_COLORS.violetGlow,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  boltBadge: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    width: 27,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: WELCOME_COLORS.white,
  },
});

import { useEffect } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { WELCOME_COLORS } from '@/lib/colors';

const CARDS_FRAME = require('@/assets/smartsave-splash-cards.png');
const FINAL_FRAME = require('@/assets/smartsave-splash-final.png');
const FRAME_ASPECT_RATIO = 384 / 800;
const MAX_FRAME_WIDTH = 430;
const SPLASH_DURATION_MS = 3200;

type LaunchScreenProps = {
  onFinish: () => void;
};

/** Animates the loose saved cards into the organized folder. */
export function LaunchScreen({ onFinish }: LaunchScreenProps) {
  const { width, height } = useWindowDimensions();
  const frameWidth = Math.min(width, height * FRAME_ASPECT_RATIO, MAX_FRAME_WIDTH);
  const frameHeight = frameWidth / FRAME_ASPECT_RATIO;
  const cardsOpacity = useSharedValue(1);
  const cardsTranslateY = useSharedValue(0);
  const cardsScale = useSharedValue(1);
  const finalOpacity = useSharedValue(0);
  const finalScale = useSharedValue(0.985);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    cardsTranslateY.value = withDelay(
      650,
      withTiming(44, { duration: 1050, easing: Easing.inOut(Easing.cubic) }),
    );
    cardsScale.value = withDelay(
      650,
      withTiming(0.97, { duration: 1050, easing: Easing.inOut(Easing.cubic) }),
    );
    cardsOpacity.value = withDelay(1120, withTiming(0, { duration: 620 }));
    finalOpacity.value = withDelay(1080, withTiming(1, { duration: 720 }));
    finalScale.value = withDelay(
      1080,
      withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) }),
    );
    screenOpacity.value = withDelay(
      2860,
      withTiming(0, { duration: 340 }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
  }, [
    cardsOpacity,
    cardsScale,
    cardsTranslateY,
    finalOpacity,
    finalScale,
    onFinish,
    screenOpacity,
  ]);

  const cardsStyle = useAnimatedStyle(() => ({
    opacity: cardsOpacity.value,
    transform: [{ translateY: cardsTranslateY.value }, { scale: cardsScale.value }],
  }));
  const finalStyle = useAnimatedStyle(() => ({
    opacity: finalOpacity.value,
    transform: [{ scale: finalScale.value }],
  }));
  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));
  const frameStyle = { width: frameWidth, height: frameHeight };

  return (
    <Animated.View
      accessibilityLabel="Smart Save is organizing your saved cards"
      style={[styles.screen, screenStyle]}
    >
      <View style={[styles.frame, frameStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, cardsStyle]}>
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={CARDS_FRAME}
            style={{ width: frameWidth, height: frameHeight }}
          />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, finalStyle]}>
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={FINAL_FRAME}
            style={{ width: frameWidth, height: frameHeight }}
          />
        </Animated.View>
      </View>
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
  frame: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: WELCOME_COLORS.navy,
  },
});

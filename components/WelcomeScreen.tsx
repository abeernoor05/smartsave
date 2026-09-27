import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { WELCOME_COLORS } from '@/lib/colors';

const WELCOME_FRAME = require('@/assets/smartsave-welcome-reference.png');
const FRAME_ASPECT_RATIO = 409 / 920;
const MAX_FRAME_WIDTH = 460;

type WelcomeScreenProps = {
  onGetStarted: () => void;
  onSignIn: () => void;
};

/** Exact supplied welcome artwork with accessible native interaction regions. */
export function WelcomeScreen({ onGetStarted, onSignIn }: WelcomeScreenProps) {
  const { width, height } = useWindowDimensions();
  const frameWidth = Math.min(width, height * FRAME_ASPECT_RATIO, MAX_FRAME_WIDTH);
  const frameHeight = frameWidth / FRAME_ASPECT_RATIO;

  return (
    <View style={styles.screen}>
      <View style={[styles.frame, { width: frameWidth, height: frameHeight }]}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={WELCOME_FRAME}
          style={{ width: frameWidth, height: frameHeight }}
        />
        <Pressable
          accessibilityHint="Continue to create or access your Smart Save account"
          accessibilityLabel="Get Started - It's Free"
          accessibilityRole="button"
          onPress={onGetStarted}
          style={({ pressed }) => [styles.getStartedHitArea, pressed && styles.pressed]}
        />
        <Pressable
          accessibilityHint="Continue to email sign in"
          accessibilityLabel="I already have an account"
          accessibilityRole="button"
          onPress={onSignIn}
          style={({ pressed }) => [styles.signInHitArea, pressed && styles.pressed]}
        />
      </View>
    </View>
  );
}

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
  },
  getStartedHitArea: {
    position: 'absolute',
    top: '83.35%',
    left: '5.85%',
    width: '88.3%',
    height: '6.3%',
    borderRadius: 999,
  },
  signInHitArea: {
    position: 'absolute',
    top: '90.9%',
    left: '5.85%',
    width: '88.3%',
    height: '5.8%',
    borderRadius: 999,
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
});

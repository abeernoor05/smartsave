import { useEffect } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Button, Typography } from 'heroui-native';
import { Zap } from 'lucide-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { WELCOME_COLORS } from '@/lib/colors';

const HERO = require('@/assets/smartsave-welcome-hero.png');
const MAX_CONTENT_WIDTH = 520;

type WelcomeScreenProps = {
  onGetStarted: () => void;
  onSignIn: () => void;
};

/** First signed-out screen, matching the supplied dark Figma welcome design. */
export function WelcomeScreen({ onGetStarted, onSignIn }: WelcomeScreenProps) {
  const { width, height } = useWindowDimensions();
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const heroHeight = Math.max(390, Math.min(height * 0.64, 640));
  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(18);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 650 });
    heroTranslateY.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) });
    contentOpacity.value = withDelay(180, withTiming(1, { duration: 520 }));
    contentTranslateY.value = withDelay(
      180,
      withTiming(0, { duration: 560, easing: Easing.out(Easing.cubic) }),
    );
  }, [contentOpacity, contentTranslateY, heroOpacity, heroTranslateY]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslateY.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={[styles.content, { width: contentWidth }]}>
          <Animated.View style={[styles.hero, { height: heroHeight }, heroStyle]}>
            <Image
              source={HERO}
              resizeMode="cover"
              style={{ width: contentWidth, height: heroHeight }}
              accessibilityLabel="Folders and saved content organized with AI"
              accessibilityIgnoresInvertColors
            />
            <LinearGradient
              pointerEvents="none"
              colors={[WELCOME_COLORS.transparentNavy, WELCOME_COLORS.navy]}
              style={styles.heroFade}
            />
          </Animated.View>

          <Animated.View style={[styles.actions, contentStyle]}>
            <Typography.Heading type="h1" align="center" weight="bold" style={styles.title}>
              Smart Save
            </Typography.Heading>

            <View style={styles.buttonGroup}>
              <Button
                accessibilityHint="Continue to create or access your SmartSave account"
                className="h-14 rounded-full bg-white"
                onPress={onGetStarted}
              >
                <Zap color={WELCOME_COLORS.violet} fill={WELCOME_COLORS.violet} size={19} />
                <Button.Label className="text-base font-semibold text-[#17112f]">
                  Get Started - It&apos;s Free
                </Button.Label>
              </Button>

              <Button
                accessibilityHint="Continue to email sign in"
                className="h-14 rounded-full border border-[#60606b] bg-[#1b1b22]"
                variant="outline"
                onPress={onSignIn}
              >
                <Button.Label className="text-base font-medium text-[#e8e8ed]">
                  I already have an account
                </Button.Label>
              </Button>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: WELCOME_COLORS.navy,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  hero: {
    overflow: 'hidden',
  },
  heroFade: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: 86,
    backgroundColor: WELCOME_COLORS.navyFade,
  },
  actions: {
    gap: 38,
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  title: {
    color: WELCOME_COLORS.white,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -1.4,
  },
  buttonGroup: {
    gap: 13,
  },
});

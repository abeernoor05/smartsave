import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Zap } from 'lucide-react-native';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { WELCOME_COLORS } from '@/lib/colors';

const WELCOME_HERO = require('@/assets/smartsave-welcome-hero.png');

type WelcomeScreenProps = {
  onGetStarted: () => void;
  onSignIn: () => void;
};

/** Native welcome layout with artwork fading directly into the screen canvas. */
export function WelcomeScreen({ onGetStarted, onSignIn }: WelcomeScreenProps) {
  const { width, height } = useWindowDimensions();
  const heroHeight = Math.min(Math.max(height * 0.58, 390), 610);
  const heroWidth = Math.min(Math.max(width, heroHeight * (2 / 3)), 560);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.heroRegion, { height: heroHeight }]}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          source={WELCOME_HERO}
          style={[styles.hero, { width: heroWidth, height: heroHeight }]}
        />
        <LinearGradient
          colors={[WELCOME_COLORS.transparentNavy, WELCOME_COLORS.navyFade, WELCOME_COLORS.navy]}
          locations={[0, 0.62, 1]}
          pointerEvents="none"
          style={styles.heroFade}
        />
      </View>

      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          Smart Save
        </Text>

        <View style={styles.actions}>
          <Pressable
            accessibilityHint="Continue to create or access your Smart Save account"
            accessibilityLabel="Get Started - It's Free"
            accessibilityRole="button"
            onPress={onGetStarted}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}
          >
            <Zap color="#24134F" fill="#24134F" size={20} strokeWidth={2.2} />
            <Text style={styles.primaryLabel}>Get Started - It&apos;s Free</Text>
          </Pressable>

          <Pressable
            accessibilityHint="Continue to email sign in"
            accessibilityLabel="I already have an account"
            accessibilityRole="button"
            onPress={onSignIn}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryPressed]}
          >
            <Text style={styles.secondaryLabel}>I already have an account</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: WELCOME_COLORS.navy,
    overflow: 'hidden',
  },
  heroRegion: {
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden',
  },
  hero: {
    position: 'absolute',
    top: 0,
  },
  heroFade: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 26,
    marginTop: -28,
  },
  title: {
    color: WELCOME_COLORS.white,
    fontFamily: 'Inter_700Bold',
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 22,
  },
  primaryPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  primaryLabel: {
    color: '#24134F',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  secondaryPressed: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  secondaryLabel: {
    color: '#F0EFF5',
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
});

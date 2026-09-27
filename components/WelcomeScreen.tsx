import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Zap } from 'lucide-react-native';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { WELCOME_COLORS } from '@/lib/colors';

const WELCOME_REFERENCE = require('@/assets/smartsave-welcome-reference.png');
const REFERENCE_ASPECT_RATIO = 914 / 412;
const WELCOME_CANVAS = '#080810';
const TRANSPARENT_CANVAS = 'rgba(8, 8, 16, 0)';

type WelcomeScreenProps = {
  onGetStarted: () => void;
  onSignIn: () => void;
};

/** Recreates the Figma welcome composition with native title and actions. */
export function WelcomeScreen({ onGetStarted, onSignIn }: WelcomeScreenProps) {
  const { width, height } = useWindowDimensions();
  const isCompact = height < 740;
  const sceneWidth = Math.min(width, isCompact ? height * 0.48 : 500);
  const sceneHeight = sceneWidth * REFERENCE_ASPECT_RATIO;
  const heroHeight = isCompact
    ? Math.min(Math.max(height * 0.67, 430), 480)
    : Math.min(Math.max(height * 0.69, 540), 640);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.heroRegion, { height: heroHeight }]}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={WELCOME_REFERENCE}
          style={[styles.hero, { width: sceneWidth, height: sceneHeight }]}
        />
        <LinearGradient
          colors={[TRANSPARENT_CANVAS, 'rgba(8, 8, 16, 0.42)', WELCOME_CANVAS]}
          locations={[0.72, 0.88, 1]}
          pointerEvents="none"
          style={styles.heroFade}
        />
      </View>

      <View style={[styles.content, isCompact && styles.compactContent]}>
        <Text accessibilityRole="header" style={[styles.title, isCompact && styles.compactTitle]}>
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
            <Zap color={WELCOME_COLORS.violet} size={19} strokeWidth={2.5} />
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
    backgroundColor: WELCOME_CANVAS,
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
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -10,
    paddingHorizontal: 24,
    paddingBottom: 62,
  },
  compactContent: {
    marginTop: -6,
    paddingBottom: 50,
  },
  title: {
    color: WELCOME_COLORS.white,
    fontFamily: 'Inter_700Bold',
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: -1.2,
    textAlign: 'center',
  },
  compactTitle: {
    fontSize: 34,
    lineHeight: 41,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 10,
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
    borderRadius: 10,
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

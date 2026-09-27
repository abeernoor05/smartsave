import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { BarChart3, Bookmark, ImageIcon, Link2 } from 'lucide-react-native';

import { WELCOME_COLORS } from '@/lib/colors';

const SPLASH_DURATION_MS = 3200;

type LaunchScreenProps = {
  onFinish: () => void;
};

type FloatingCardProps = {
  progress: SharedValue<number>;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  rotation: number;
  color: string;
  icon: 'image' | 'link' | 'chart' | 'bookmark';
};

const CARD_ICONS = {
  image: ImageIcon,
  link: Link2,
  chart: BarChart3,
  bookmark: Bookmark,
} as const;

function FloatingCard({
  progress,
  startX,
  startY,
  endX,
  endY,
  rotation,
  color,
  icon,
}: FloatingCardProps) {
  const Icon = CARD_ICONS[icon];
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.78, 1], [1, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [startX, endX]) },
      { translateY: interpolate(progress.value, [0, 1], [startY, endY]) },
      { rotate: `${interpolate(progress.value, [0, 1], [rotation, 0])}deg` },
      { scale: interpolate(progress.value, [0, 0.72, 1], [1, 0.96, 0.82]) },
    ],
  }));

  return (
    <Animated.View style={[styles.card, { backgroundColor: color }, animatedStyle]}>
      <Icon color="rgba(255,255,255,0.68)" size={16} strokeWidth={1.8} />
      <View style={styles.cardLines}>
        <View style={styles.cardLineLong} />
        <View style={styles.cardLineShort} />
      </View>
      <View style={styles.cardDot} />
    </Animated.View>
  );
}

/** A native, layered animation of saved cards being filed into one folder. */
export function LaunchScreen({ onFinish }: LaunchScreenProps) {
  const filingProgress = useSharedValue(0);
  const sortedProgress = useSharedValue(0);
  const copyProgress = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    filingProgress.value = withDelay(
      420,
      withTiming(1, { duration: 1450, easing: Easing.inOut(Easing.cubic) }),
    );
    sortedProgress.value = withDelay(
      1570,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
    copyProgress.value = withDelay(1840, withTiming(1, { duration: 430 }));
    screenOpacity.value = withDelay(
      2860,
      withTiming(0, { duration: 340 }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
  }, [copyProgress, filingProgress, onFinish, screenOpacity, sortedProgress]);

  const sortedStyle = useAnimatedStyle(() => ({
    opacity: sortedProgress.value,
    transform: [{ scale: interpolate(sortedProgress.value, [0, 1], [0.82, 1]) }],
  }));
  const copyStyle = useAnimatedStyle(() => ({
    opacity: copyProgress.value,
    transform: [{ translateY: interpolate(copyProgress.value, [0, 1], [10, 0]) }],
  }));
  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));

  return (
    <Animated.View
      accessibilityLabel="Smart Save is organizing your saved cards"
      style={[styles.screen, screenStyle]}
    >
      <View style={styles.artwork}>
        <View style={styles.folderBack}>
          <View style={styles.folderTab} />
        </View>

        <FloatingCard
          color="#45666E"
          endX={-22}
          endY={170}
          icon="image"
          progress={filingProgress}
          rotation={-8}
          startX={-105}
          startY={28}
        />
        <FloatingCard
          color="#4A5277"
          endX={-5}
          endY={165}
          icon="bookmark"
          progress={filingProgress}
          rotation={1}
          startX={-36}
          startY={-24}
        />
        <FloatingCard
          color="#73564E"
          endX={15}
          endY={168}
          icon="link"
          progress={filingProgress}
          rotation={7}
          startX={54}
          startY={-12}
        />
        <FloatingCard
          color="#47597A"
          endX={25}
          endY={172}
          icon="chart"
          progress={filingProgress}
          rotation={6}
          startX={92}
          startY={48}
        />

        <View style={styles.paper}>
          <Bookmark color="#2E3153" size={20} strokeWidth={1.8} />
          <View style={styles.paperLines}>
            <View style={styles.paperLineDark} />
            <View style={styles.paperLineLight} />
          </View>
        </View>
        <View style={styles.folderFront}>
          <View style={styles.folderHighlight} />
          <Animated.View style={[styles.sortedBadge, sortedStyle]}>
            <Text style={styles.sortedSpark}>✦</Text>
            <Text style={styles.sortedText}>AI SORTED</Text>
          </Animated.View>
        </View>
      </View>

      <Animated.View style={[styles.copy, copyStyle]}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <View style={styles.miniFolder} />
          </View>
          <Text style={styles.title}>Smart Save</Text>
        </View>
        <Text style={styles.subtitle}>Organizing the things you want to remember...</Text>
        <View style={styles.progressDots}>
          <View style={styles.progressActive} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
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
    paddingHorizontal: 24,
  },
  artwork: {
    width: 330,
    height: 355,
    position: 'relative',
  },
  folderBack: {
    position: 'absolute',
    zIndex: 1,
    left: 23,
    right: 23,
    top: 150,
    height: 116,
    borderRadius: 22,
    backgroundColor: '#2E555D',
  },
  folderTab: {
    position: 'absolute',
    left: 25,
    top: -28,
    width: 110,
    height: 48,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#315961',
  },
  card: {
    position: 'absolute',
    zIndex: 2,
    top: 34,
    left: 112,
    width: 116,
    height: 72,
    borderRadius: 13,
    padding: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 7,
  },
  cardLines: { gap: 6, marginTop: 12 },
  cardLineLong: {
    width: 66,
    height: 4,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  cardLineShort: {
    width: 44,
    height: 4,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  cardDot: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  paper: {
    position: 'absolute',
    zIndex: 2,
    top: 181,
    left: 82,
    width: 176,
    height: 88,
    borderRadius: 14,
    backgroundColor: '#9698A9',
    padding: 18,
    flexDirection: 'row',
    gap: 18,
    transform: [{ rotate: '-1.5deg' }],
  },
  paperLines: { flex: 1, gap: 10, marginTop: 4 },
  paperLineDark: { height: 7, borderRadius: 4, backgroundColor: '#323447' },
  paperLineLight: {
    width: '70%',
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(50,52,71,0.35)',
  },
  folderFront: {
    position: 'absolute',
    zIndex: 3,
    left: 12,
    right: 12,
    top: 219,
    height: 126,
    borderRadius: 22,
    backgroundColor: '#4B8B88',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.3,
    shadowRadius: 22,
    elevation: 9,
  },
  folderHighlight: {
    position: 'absolute',
    top: 1,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  sortedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#173235',
  },
  sortedSpark: { color: '#A8D1CE', fontSize: 13 },
  sortedText: {
    color: '#C4D8D7',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  copy: { alignItems: 'center', width: '100%', maxWidth: 330, marginTop: 36 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#313541',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniFolder: { width: 17, height: 12, borderRadius: 3, borderWidth: 1.5, borderColor: '#FFFFFF' },
  title: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 34, letterSpacing: -1.2 },
  subtitle: {
    color: '#B8B8C3',
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 16,
  },
  progressDots: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 22 },
  progressActive: { width: 22, height: 4, borderRadius: 3, backgroundColor: '#7D7E88' },
  progressDot: { width: 7, height: 4, borderRadius: 3, backgroundColor: '#34353E' },
});

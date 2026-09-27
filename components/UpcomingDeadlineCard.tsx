import { router } from 'expo-router';
import { Typography } from 'heroui-native';
import { ImageBackground, Pressable, View } from 'react-native';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { CATEGORY_META } from '@/lib/categories';
import { COLORS } from '@/lib/colors';
import {
  formatShortDate,
  relativeDeadlineLabel,
  URGENCY_STYLES,
  urgencyOf,
  type UpcomingDeadline,
} from '@/lib/deadlines';
import { LOCAL_THUMBNAIL_BY_CATEGORY, thumbnailSource } from '@/lib/thumbnails';

interface UpcomingDeadlineCardProps {
  entry: UpcomingDeadline;
}

/** Image-backed card for the pinned "Upcoming deadlines" rail. */
export function UpcomingDeadlineCard({ entry }: UpcomingDeadlineCardProps) {
  const { item, deadline, extraCount } = entry;
  const styles = URGENCY_STYLES[urgencyOf(deadline.date)];
  const Icon = CATEGORY_META[item.category].icon;
  const imageSource =
    thumbnailSource(item.thumbnail_url) ??
    thumbnailSource(LOCAL_THUMBNAIL_BY_CATEGORY[item.category]);

  return (
    <Pressable
      accessibilityRole="button"
      className="w-64"
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <View className="border-border bg-surface min-h-44 overflow-hidden rounded-3xl border">
        <ImageBackground
          source={imageSource ?? undefined}
          resizeMode="cover"
          style={{ width: '100%', height: 176, minHeight: 176 }}
        >
          <LinearGradient
            colors={[COLORS.imageOverlayTop, COLORS.imageOverlayMid, COLORS.imageOverlayBottom]}
            locations={[0, 0.38, 1]}
            className="absolute inset-0"
          />

          <View className="min-h-44 justify-between gap-4 p-4">
            <View className="flex-row items-center justify-between">
              <View className={`rounded-lg px-2.5 py-1 ${styles.bgClass}`}>
                <Typography type="body-xs" weight="semibold" className={styles.textClass}>
                  {relativeDeadlineLabel(deadline.date)}
                </Typography>
              </View>
              <Typography type="body-xs" weight="medium" style={{ color: COLORS.onAccent }}>
                {formatShortDate(deadline.date)}
              </Typography>
            </View>

            <View className="gap-1.5">
              <Typography
                type="body-sm"
                weight="bold"
                numberOfLines={1}
                style={{ color: COLORS.onAccent }}
              >
                {deadline.context}
              </Typography>
              <Typography type="body-xs" numberOfLines={2} style={{ color: COLORS.onImageMuted }}>
                {item.ai_summary}
              </Typography>
            </View>

            <View className="flex-row items-center gap-2">
              <View className="flex-row items-center gap-1 rounded-lg border border-white/20 bg-black/45 px-2 py-1">
                <Icon size={12} color={COLORS.onAccent} />
                <Typography type="body-xs" weight="medium" style={{ color: COLORS.onAccent }}>
                  {item.category}
                </Typography>
              </View>
              {extraCount > 0 ? (
                <Typography
                  type="body-xs"
                  numberOfLines={1}
                  className="flex-1"
                  style={{ color: COLORS.onImageMuted }}
                >
                  {`+${extraCount} more on this item`}
                </Typography>
              ) : null}
            </View>
          </View>
        </ImageBackground>
      </View>
    </Pressable>
  );
}

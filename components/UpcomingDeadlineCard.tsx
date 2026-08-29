import { router } from 'expo-router';
import { Card, Typography } from 'heroui-native';
import { Pressable, View } from 'react-native';

import { CATEGORY_META } from '@/lib/categories';
import {
  formatShortDate,
  relativeDeadlineLabel,
  URGENCY_STYLES,
  urgencyOf,
  type UpcomingDeadline,
} from '@/lib/deadlines';

interface UpcomingDeadlineCardProps {
  entry: UpcomingDeadline;
}

/** Horizontal card for the pinned "Upcoming deadlines" rail. */
export function UpcomingDeadlineCard({ entry }: UpcomingDeadlineCardProps) {
  const { item, deadline, extraCount } = entry;
  const styles = URGENCY_STYLES[urgencyOf(deadline.date)];
  const meta = CATEGORY_META[item.category];
  const Icon = meta.icon;

  return (
    <Pressable
      accessibilityRole="button"
      className="w-64"
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Card className="gap-3 p-4">
        <View className="flex-row items-center justify-between">
          <View className={`rounded-full px-2 py-1 ${styles.bgClass}`}>
            <Typography type="body-xs" weight="semibold" className={styles.textClass}>
              {relativeDeadlineLabel(deadline.date)}
            </Typography>
          </View>
          <Typography type="body-xs" color="muted">
            {formatShortDate(deadline.date)}
          </Typography>
        </View>

        <Typography type="body-sm" weight="semibold" numberOfLines={1}>
          {deadline.context}
        </Typography>
        <Typography type="body-xs" color="muted" numberOfLines={2}>
          {item.ai_summary}
        </Typography>

        <View className="flex-row items-center gap-2">
          <View
            className={`flex-row items-center gap-1 rounded-full px-2 py-1 ${meta.chipBgClass}`}
          >
            <Icon size={12} color={meta.color} />
            <Typography type="body-xs" weight="medium" className={meta.chipTextClass}>
              {item.category}
            </Typography>
          </View>
          {extraCount > 0 ? (
            <Typography type="body-xs" color="muted">
              {`+${extraCount} more on this item`}
            </Typography>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

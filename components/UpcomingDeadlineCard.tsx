import { router } from 'expo-router';
import { ArrowRight, CalendarDays } from 'lucide-react-native';
import { Typography } from 'heroui-native';
import { Pressable, View } from 'react-native';

import { COLORS } from '@/lib/colors';

interface UpcomingDeadlineCardProps {
  count: number;
  dueThisWeek: number;
}

/** Dark dashboard callout that opens the complete deadline list. */
export function UpcomingDeadlineCard({ count, dueThisWeek }: UpcomingDeadlineCardProps) {
  const countLabel = count === 1 ? '1 upcoming deadline' : `${count} upcoming deadlines`;
  const weekLabel =
    dueThisWeek === 0
      ? 'Nothing due in the next 7 days'
      : dueThisWeek === 1
        ? '1 is due in the next 7 days'
        : `${dueThisWeek} are due in the next 7 days`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${countLabel}. View all deadlines`}
      onPress={() => router.push('/deadlines')}
      style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
    >
      <View className="border-border bg-surface/95 overflow-hidden rounded-xl border">
        <View className="bg-accent-soft/70 h-24 items-center justify-end">
          <View className="bg-surface border-border -mb-7 size-16 items-center justify-center rounded-full border">
            <CalendarDays size={28} color={COLORS.accent} />
          </View>
        </View>

        <View className="items-center gap-2 px-5 pt-10 pb-5">
          <Typography type="body" weight="bold" align="center">
            {count > 0 ? countLabel : 'No upcoming deadlines'}
          </Typography>
          <Typography type="body-xs" color="muted" align="center">
            {count > 0 ? weekLabel : 'New dated reminders will appear here.'}
          </Typography>
          <View className="mt-2 flex-row items-center gap-2 rounded-lg bg-white px-4 py-2.5">
            <Typography type="body-sm" weight="semibold" style={{ color: COLORS.focalInk }}>
              View deadlines
            </Typography>
            <ArrowRight size={16} color={COLORS.focalInk} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

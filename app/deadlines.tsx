import { router, Stack } from 'expo-router';
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Typography } from 'heroui-native';
import { FlatList, Pressable, View } from 'react-native';
import { useMemo } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { Thumbnail } from '@/components/Thumbnail';
import { CATEGORY_META } from '@/lib/categories';
import { COLORS } from '@/lib/colors';
import {
  allUpcomingDeadlines,
  formatShortDate,
  relativeDeadlineLabel,
  URGENCY_STYLES,
  urgencyOf,
  type UpcomingDeadline,
} from '@/lib/deadlines';
import { goBackOrReplace } from '@/lib/navigation';
import { useSmartSaveStore } from '@/lib/store';

function DeadlineRow({ entry }: { entry: UpcomingDeadline }) {
  const { deadline, item } = entry;
  const urgency = URGENCY_STYLES[urgencyOf(deadline.date)];
  const CategoryIcon = CATEGORY_META[item.category].icon;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${deadline.context}, ${formatShortDate(deadline.date)}`}
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
      style={({ pressed }) => ({ opacity: pressed ? 0.86 : 1 })}
    >
      <View className="border-border bg-surface/85 flex-row gap-3 rounded-xl border p-3">
        <Thumbnail
          url={item.thumbnail_url}
          category={item.category}
          width={76}
          height={88}
          className="rounded-lg"
        />

        <View className="min-w-0 flex-1 justify-between gap-2 py-0.5">
          <View className="gap-1">
            <View className="flex-row items-start justify-between gap-2">
              <Typography type="body-sm" weight="bold" numberOfLines={2} className="flex-1">
                {deadline.context}
              </Typography>
              <ChevronRight size={17} color={COLORS.muted} />
            </View>
            <Typography type="body-xs" color="muted" numberOfLines={1}>
              {item.ai_summary}
            </Typography>
          </View>

          <View className="flex-row items-center justify-between gap-2">
            <View className={`rounded-md px-2 py-1 ${urgency.bgClass}`}>
              <Typography type="body-xs" weight="semibold" className={urgency.textClass}>
                {relativeDeadlineLabel(deadline.date)}
              </Typography>
            </View>
            <View className="flex-row items-center gap-1.5">
              <CategoryIcon size={13} color={COLORS.muted} />
              <Typography type="body-xs" color="muted">
                {formatShortDate(deadline.date)}
              </Typography>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function DeadlinesScreen() {
  const items = useSmartSaveStore((state) => state.items);
  const deadlines = useMemo(() => allUpcomingDeadlines(items), [items]);

  return (
    <View className="bg-background flex-1">
      <Stack.Screen
        options={{
          title: 'Upcoming deadlines',
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to home"
              className="mr-3 p-1"
              onPress={() => goBackOrReplace('/')}
            >
              <ChevronLeft size={24} color={COLORS.ink} />
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={deadlines}
        keyExtractor={(entry) => entry.deadline.id}
        renderItem={({ item }) => <DeadlineRow entry={item} />}
        contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 12, flexGrow: 1 }}
        ListHeaderComponent={
          deadlines.length > 0 ? (
            <View className="mb-2 gap-1">
              <Typography type="h3" weight="bold">
                Your timeline
              </Typography>
              <Typography type="body-sm" color="muted">
                {deadlines.length === 1
                  ? '1 scheduled deadline'
                  : `${deadlines.length} scheduled deadlines`}
              </Typography>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center">
            <EmptyState
              icon={CalendarCheck}
              title="No upcoming deadlines"
              description="Dated reminders from your saved links will appear here."
              actionLabel="Save a link"
              onAction={() => router.push('/add-link')}
            />
          </View>
        }
      />
    </View>
  );
}

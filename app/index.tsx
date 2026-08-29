import { router } from 'expo-router';
import { CalendarCheck, Plus } from 'lucide-react-native';
import { Card, SearchField, Typography } from 'heroui-native';
import { Pressable, ScrollView, View } from 'react-native';
import { useMemo, useState } from 'react';

import { FolderCard } from '@/components/FolderCard';
import { UpcomingDeadlineCard } from '@/components/UpcomingDeadlineCard';
import { daysUntil, upcomingDeadlines } from '@/lib/deadlines';
import { countsByCategory, useSmartSaveStore } from '@/lib/store';
import { CATEGORIES, type Category } from '@/lib/types';

export default function HomeScreen() {
  const items = useSmartSaveStore((state) => state.items);
  const [query, setQuery] = useState('');

  const counts = useMemo(() => countsByCategory(items), [items]);
  const upcoming = useMemo(() => upcomingDeadlines(items).slice(0, 8), [items]);

  const dueSoonByCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const entry of upcomingDeadlines(items)) {
      if (daysUntil(entry.deadline.date) <= 7) {
        totals[entry.item.category] = (totals[entry.item.category] ?? 0) + 1;
      }
    }
    return totals;
  }, [items]);

  const dueThisWeek = useMemo(
    () => upcoming.filter((entry) => daysUntil(entry.deadline.date) <= 7).length,
    [upcoming],
  );

  const runSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push({ pathname: '/search', params: { q: trimmed } });
  };

  return (
    <View className="bg-background flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View className="pt-safe-offset-4 gap-5 px-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Typography.Heading type="h3">SmartSave</Typography.Heading>
              <Typography type="body-sm" color="muted">
                {`${items.length} saved · ${dueThisWeek} due this week`}
              </Typography>
            </View>
            <Pressable
              accessibilityLabel="Save a link"
              accessibilityRole="button"
              className="bg-accent size-12 items-center justify-center rounded-2xl"
              onPress={() => router.push('/add-link')}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <Plus size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <View className="gap-2">
            <SearchField value={query} onChange={setQuery}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input
                  placeholder="Search summaries, captions, deadlines"
                  returnKeyType="search"
                  onSubmitEditing={runSearch}
                />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            {query.trim().length > 0 ? (
              <Pressable accessibilityRole="button" onPress={runSearch}>
                <Typography type="body-sm" weight="medium" className="text-accent px-1">
                  {`See all results for "${query.trim()}"`}
                </Typography>
              </Pressable>
            ) : null}
          </View>

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Typography type="body" weight="semibold">
                Upcoming deadlines
              </Typography>
              {upcoming.length > 0 ? (
                <Typography type="body-xs" color="muted">
                  {`nearest ${upcoming.length}`}
                </Typography>
              ) : null}
            </View>

            {upcoming.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="-mx-4"
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              >
                {upcoming.map((entry) => (
                  <UpcomingDeadlineCard key={entry.deadline.id} entry={entry} />
                ))}
              </ScrollView>
            ) : (
              <Card className="flex-row items-center gap-3 p-4">
                <View className="bg-surface-secondary size-10 items-center justify-center rounded-xl">
                  <CalendarCheck size={18} color="#6A7080" />
                </View>
                <View className="flex-1">
                  <Typography type="body-sm" weight="medium">
                    Nothing time-sensitive
                  </Typography>
                  <Typography type="body-xs" color="muted">
                    Saved items without a date get a gentle nudge instead.
                  </Typography>
                </View>
              </Card>
            )}
          </View>

          <View className="gap-3">
            <Typography type="body" weight="semibold">
              Folders
            </Typography>
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {CATEGORIES.map((category: Category) => (
                <FolderCard
                  key={category}
                  category={category}
                  count={counts[category] ?? 0}
                  dueSoonCount={dueSoonByCategory[category] ?? 0}
                />
              ))}
            </View>
          </View>

          <Typography type="body-xs" color="muted" align="center">
            Link analysis runs on sample data for now.
          </Typography>
        </View>
      </ScrollView>
    </View>
  );
}

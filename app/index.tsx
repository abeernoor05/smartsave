import { router } from 'expo-router';
import { ArrowRight, CalendarCheck, LogOut, Plus } from 'lucide-react-native';
import { Button, Card, SearchField, Spinner, Typography } from 'heroui-native';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useMemo, useState } from 'react';

import { FolderCard } from '@/components/FolderCard';
import { UpcomingDeadlineCard } from '@/components/UpcomingDeadlineCard';
import { useAuth } from '@/lib/auth';
import { COLORS } from '@/lib/colors';
import { daysUntil, upcomingDeadlines } from '@/lib/deadlines';
import { countsByCategory, useSmartSaveStore } from '@/lib/store';
import { CATEGORIES, type Category } from '@/lib/types';

export default function HomeScreen() {
  const items = useSmartSaveStore((state) => state.items);
  const status = useSmartSaveStore((state) => state.status);
  const storeError = useSmartSaveStore((state) => state.error);
  const loadItems = useSmartSaveStore((state) => state.loadItems);
  const { session, signOut } = useAuth();
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

  const isFirstLoad = status === 'loading' && items.length === 0;
  const trimmedQuery = query.trim();

  const runSearch = () => {
    if (!trimmedQuery) return;
    router.push({ pathname: '/search', params: { q: trimmedQuery } });
  };

  return (
    <View className="bg-background flex-1">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={status === 'loading'} onRefresh={() => void loadItems()} />
        }
      >
        <View className="pt-safe-offset-4 gap-6 px-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Typography.Heading type="h3" weight="bold">
                SmartSave
              </Typography.Heading>
              <Typography type="body-sm" color="muted">
                {`${items.length} saved · ${dueThisWeek} due this week`}
              </Typography>
            </View>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              accessibilityLabel="Sign out"
              onPress={() => void signOut()}
            >
              <LogOut size={18} color={COLORS.muted} />
            </Button>
            <Pressable
              accessibilityLabel="Save a link"
              accessibilityRole="button"
              className="bg-accent size-11 items-center justify-center rounded-2xl"
              onPress={() => router.push('/add-link')}
              style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
            >
              <Plus size={22} color={COLORS.onAccent} />
            </Pressable>
          </View>

          <View className="gap-2">
            <SearchField value={query} onChange={setQuery}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input
                  placeholder="Search summaries, captions, folders"
                  returnKeyType="search"
                  onSubmitEditing={runSearch}
                />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            {trimmedQuery.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                className="flex-row items-center gap-1.5 px-1 py-1"
                onPress={runSearch}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Typography type="body-sm" weight="semibold" className="text-accent">
                  {`Search for "${trimmedQuery}"`}
                </Typography>
                <ArrowRight size={14} color={COLORS.accent} />
              </Pressable>
            ) : null}
          </View>

          {storeError ? (
            <Card className="border-border gap-2 border p-4">
              <Typography type="body-sm" weight="semibold" className="text-urgent">
                {storeError}
              </Typography>
              <Button size="sm" variant="secondary" onPress={() => void loadItems()}>
                <Button.Label>Try again</Button.Label>
              </Button>
            </Card>
          ) : null}

          {isFirstLoad ? (
            <View className="items-center gap-3 py-10">
              <Spinner />
              <Typography type="body-sm" color="muted">
                Loading your saved links…
              </Typography>
            </View>
          ) : (
            <>
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Typography type="body" weight="bold">
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
                  <Card className="border-border flex-row items-center gap-3 border p-4">
                    <View className="bg-surface-secondary size-10 items-center justify-center rounded-xl">
                      <CalendarCheck size={18} color={COLORS.muted} />
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Typography type="body-sm" weight="bold">
                        {items.length === 0 ? 'Nothing saved yet' : 'Nothing time-sensitive'}
                      </Typography>
                      <Typography type="body-xs" color="muted">
                        {items.length === 0
                          ? 'Paste your first link and SmartSave reads it, files it, and watches the dates.'
                          : 'Saved items without a date get a gentle nudge instead.'}
                      </Typography>
                    </View>
                  </Card>
                )}
              </View>

              <View className="gap-3">
                <Typography type="body" weight="bold">
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
            </>
          )}

          <Typography type="body-xs" color="muted" align="center">
            {session?.user.email
              ? `Signed in as ${session.user.email}`
              : 'Your links are private to your account.'}
          </Typography>
        </View>
      </ScrollView>
    </View>
  );
}

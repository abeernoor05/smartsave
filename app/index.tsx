import { router } from 'expo-router';
import { ArrowRight, LogOut, Plus } from 'lucide-react-native';
import { Button, Card, SearchField, Spinner, Typography } from 'heroui-native';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useMemo, useState } from 'react';

import { FolderCard } from '@/components/FolderCard';
import { UpcomingDeadlineCard } from '@/components/UpcomingDeadlineCard';
import { useAuth } from '@/lib/auth';
import { COLORS } from '@/lib/colors';
import { allUpcomingDeadlines, daysUntil, upcomingDeadlines } from '@/lib/deadlines';
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
  const upcoming = useMemo(() => allUpcomingDeadlines(items), [items]);

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
    () =>
      upcoming.filter((entry) => {
        const days = daysUntil(entry.deadline.date);
        return days >= 0 && days <= 7;
      }).length,
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
          <RefreshControl
            refreshing={status === 'loading'}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
            onRefresh={() => void loadItems()}
          />
        }
      >
        <View className="pt-safe-offset-5 gap-7 px-5">
          <View
            className="bg-accent-soft absolute -top-24 -right-28 size-72 rounded-full"
            pointerEvents="none"
          />
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Typography.Heading type="h2" weight="bold">
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
              className="size-11 items-center justify-center rounded-lg bg-white"
              onPress={() => router.push('/add-link')}
              style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
            >
              <Plus size={22} color={COLORS.accent} />
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
              <UpcomingDeadlineCard count={upcoming.length} dueThisWeek={dueThisWeek} />

              <View className="gap-3">
                <Typography type="body" weight="bold">
                  Folders
                </Typography>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={300}
                  contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                >
                  {CATEGORIES.map((category: Category) => (
                    <View key={category} style={{ width: 288 }}>
                      <FolderCard
                        category={category}
                        count={counts[category] ?? 0}
                        dueSoonCount={dueSoonByCategory[category] ?? 0}
                      />
                    </View>
                  ))}
                </ScrollView>
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

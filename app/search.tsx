import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SearchX } from 'lucide-react-native';
import { SearchField, Spinner, Typography } from 'heroui-native';
import { FlatList, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { ItemCard } from '@/components/ItemCard';
import { searchItems, searchItemsInDatabase, useSmartSaveStore } from '@/lib/store';
import type { Item } from '@/lib/types';

const DEBOUNCE_MS = 300;

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const items = useSmartSaveStore((state) => state.items);
  const [query, setQuery] = useState(params.q ?? '');
  const [rows, setRows] = useState<Item[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = query.trim();
  /** Instant matches from the library already in memory, same three fields. */
  const local = useMemo(() => searchItems(items, trimmed), [items, trimmed]);

  // The authoritative search runs against the items table itself.
  useEffect(() => {
    if (trimmed.length === 0) {
      setRows(null);
      setError(null);
      setIsSearching(false);
      return undefined;
    }

    let isCurrent = true;
    setIsSearching(true);

    const timer = setTimeout(() => {
      searchItemsInDatabase(trimmed)
        .then((found) => {
          if (!isCurrent) return;
          setRows(found);
          setError(null);
        })
        .catch((cause: unknown) => {
          if (!isCurrent) return;
          setRows(null);
          setError(cause instanceof Error ? cause.message : 'Could not search your saved links.');
        })
        .finally(() => {
          if (isCurrent) setIsSearching(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [trimmed]);

  const results = rows ?? local;

  return (
    <View className="bg-background flex-1">
      <Stack.Screen options={{ title: 'Search results' }} />

      <View className="px-4 pt-4">
        <SearchField value={query} onChange={setQuery}>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input
              autoFocus={!params.q}
              placeholder="Search summaries, captions, folders"
              returnKeyType="search"
            />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item: Item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          trimmed.length > 0 ? (
            <View className="flex-row items-center gap-2 pb-1">
              <Typography type="body-sm" weight="semibold" className="flex-1" numberOfLines={1}>
                {error
                  ? 'Search failed'
                  : `${results.length === 1 ? '1 match' : `${results.length} matches`} for "${trimmed}"`}
              </Typography>
              {isSearching ? <Spinner size="sm" /> : null}
            </View>
          ) : null
        }
        ListEmptyComponent={
          error ? (
            <EmptyState icon={SearchX} title="Could not run that search" description={error} />
          ) : trimmed.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Search your saved links"
              description="Looks through AI summaries, the original captions, and folder names."
            />
          ) : isSearching ? (
            <View className="items-center py-12">
              <Spinner />
            </View>
          ) : (
            <EmptyState
              icon={SearchX}
              title={`No matches for "${trimmed}"`}
              description="Try a shorter phrase, or browse the folders instead."
              actionLabel="Back to folders"
              onAction={() => router.replace('/')}
            />
          )
        }
        renderItem={({ item }: { item: Item }) => <ItemCard item={item} showCategory />}
      />
    </View>
  );
}

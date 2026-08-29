import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SearchX } from 'lucide-react-native';
import { SearchField, Typography } from 'heroui-native';
import { FlatList, View } from 'react-native';
import { useMemo, useState } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { ItemCard } from '@/components/ItemCard';
import { searchItems, useSmartSaveStore } from '@/lib/store';
import type { Item } from '@/lib/types';

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const items = useSmartSaveStore((state) => state.items);
  const [query, setQuery] = useState(params.q ?? '');

  const results = useMemo(() => searchItems(items, query), [items, query]);
  const trimmed = query.trim();

  return (
    <View className="bg-background flex-1">
      <Stack.Screen options={{ title: 'Search' }} />

      <View className="px-4 pt-4">
        <SearchField value={query} onChange={setQuery}>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input
              autoFocus={!params.q}
              placeholder="Search summaries, captions, deadlines"
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
        ListHeaderComponent={
          trimmed.length > 0 ? (
            <Typography type="body-sm" weight="medium">
              {results.length === 1 ? '1 match' : `${results.length} matches`}
            </Typography>
          ) : null
        }
        ListEmptyComponent={
          trimmed.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Search your saved links"
              description="Look through AI summaries, original captions, text found in images, and deadline notes."
            />
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

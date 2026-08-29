import { Stack, useLocalSearchParams } from 'expo-router';
import { FolderOpen } from 'lucide-react-native';
import { Typography } from 'heroui-native';
import { FlatList, View } from 'react-native';
import { useMemo } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { ItemCard } from '@/components/ItemCard';
import { CATEGORY_META } from '@/lib/categories';
import { COLORS } from '@/lib/colors';
import { itemsInCategory, useSmartSaveStore } from '@/lib/store';
import { CATEGORIES, type Category, type Item } from '@/lib/types';

function isCategory(value: string | undefined): value is Category {
  return CATEGORIES.some((category) => category === value);
}

export default function FolderScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const allItems = useSmartSaveStore((state) => state.items);
  const category = isCategory(params.category) ? params.category : null;

  const items = useMemo(
    () => (category ? itemsInCategory(allItems, category) : []),
    [allItems, category],
  );

  if (!category) {
    return (
      <View className="bg-background flex-1">
        <Stack.Screen options={{ title: 'Folder' }} />
        <EmptyState
          icon={FolderOpen}
          title="Folder not found"
          description="That folder does not exist in SmartSave."
        />
      </View>
    );
  }

  const meta = CATEGORY_META[category];
  const FolderIcon = meta.icon;

  return (
    <View className="bg-background flex-1">
      <Stack.Screen options={{ title: category }} />
      <FlatList
        data={items}
        keyExtractor={(item: Item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
        ListHeaderComponent={
          <View className="flex-row items-center gap-3 pb-1">
            <View className="bg-accent-soft size-10 items-center justify-center rounded-xl">
              <FolderIcon size={19} color={COLORS.accent} />
            </View>
            <View className="flex-1">
              <Typography type="body" weight="bold">
                {items.length === 1 ? '1 saved item' : `${items.length} saved items`}
              </Typography>
              <Typography type="body-xs" color="muted">
                {meta.tagline}
              </Typography>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={meta.icon}
            title={`Nothing in ${category} yet`}
            description="Links you save get filed here automatically once they are analyzed."
          />
        }
        renderItem={({ item }: { item: Item }) => <ItemCard item={item} />}
      />
    </View>
  );
}

import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Card, Typography } from 'heroui-native';
import { Pressable, View } from 'react-native';

import { CATEGORY_META } from '@/lib/categories';
import { COLORS } from '@/lib/colors';
import type { Category } from '@/lib/types';

interface FolderCardProps {
  category: Category;
  count: number;
  dueSoonCount: number;
}

/** Dashboard folder tile with item count. */
export function FolderCard({ category, count, dueSoonCount }: FolderCardProps) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;

  return (
    <Pressable
      accessibilityRole="button"
      className="w-[48%]"
      onPress={() => router.push({ pathname: '/folder/[category]', params: { category } })}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <Card className="border-border gap-3 border p-4">
        <View className="flex-row items-start justify-between">
          <View className="bg-accent-soft size-10 items-center justify-center rounded-xl">
            <Icon size={19} color={COLORS.accent} />
          </View>
          <ChevronRight size={16} color={COLORS.subtle} />
        </View>
        <View className="gap-0.5">
          <Typography type="body" weight="bold">
            {category}
          </Typography>
          <Typography type="body-xs" color="muted">
            {count === 1 ? '1 item' : `${count} items`}
          </Typography>
          {dueSoonCount > 0 ? (
            <Typography type="body-xs" weight="semibold" className="text-urgent">
              {`${dueSoonCount} due soon`}
            </Typography>
          ) : (
            <Typography type="body-xs" color="muted" numberOfLines={1}>
              {meta.tagline}
            </Typography>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

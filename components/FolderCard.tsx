import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Card, Typography } from 'heroui-native';
import { Pressable, View } from 'react-native';

import { CATEGORY_META } from '@/lib/categories';
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
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Card className="gap-3 p-4">
        <View className="flex-row items-start justify-between">
          <View className={`size-10 items-center justify-center rounded-xl ${meta.iconBgClass}`}>
            <Icon size={20} color={meta.color} />
          </View>
          <ChevronRight size={16} color="#9AA0AC" />
        </View>
        <View className="gap-0.5">
          <Typography type="body" weight="semibold">
            {category}
          </Typography>
          <Typography type="body-xs" color="muted">
            {count === 1 ? '1 item' : `${count} items`}
          </Typography>
          {dueSoonCount > 0 ? (
            <Typography type="body-xs" weight="medium" className="text-soon">
              {`${dueSoonCount} due soon`}
            </Typography>
          ) : (
            <Typography type="body-xs" color="muted">
              {meta.tagline}
            </Typography>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

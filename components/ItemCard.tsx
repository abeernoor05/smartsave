import { router } from 'expo-router';
import { Card, Typography } from 'heroui-native';
import { Pressable, View } from 'react-native';

import { DeadlineTag, NudgeTag, UnscheduledTag } from '@/components/DeadlineTag';
import { Thumbnail } from '@/components/Thumbnail';
import { CATEGORY_META, PLATFORM_META } from '@/lib/categories';
import { COLORS } from '@/lib/colors';
import { nearestDeadline, realDeadlines, resurfaceDateFor, savedAgo } from '@/lib/deadlines';
import type { Item } from '@/lib/types';

interface ItemCardProps {
  item: Item;
  /** Show the folder name — useful in search results. */
  showCategory?: boolean;
}

/** Shared card used by folder view and search results. */
export function ItemCard({ item, showCategory = false }: ItemCardProps) {
  const deadline = nearestDeadline(item);
  const deadlineCount = realDeadlines(item).length;
  const platform = PLATFORM_META[item.platform];
  const CategoryIcon = CATEGORY_META[item.category].icon;
  const PlatformIcon = platform.icon;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <Card className="border-border bg-surface/95 rounded-3xl border p-3">
        <View className="flex-row gap-3">
          <Thumbnail
            url={item.thumbnail_url}
            category={item.category}
            width={72}
            height={72}
            className="rounded-xl"
          />
          <View className="flex-1 gap-2">
            <Typography type="body-sm" weight="semibold" numberOfLines={3}>
              {item.ai_summary}
            </Typography>

            <View className="flex-row flex-wrap items-center gap-1.5">
              {deadline ? (
                <DeadlineTag date={deadline.date} extraCount={deadlineCount - 1} />
              ) : deadlineCount > 0 ? (
                <UnscheduledTag extraCount={deadlineCount - 1} />
              ) : (
                <NudgeTag date={resurfaceDateFor(item)} />
              )}
            </View>

            <View className="flex-row items-center gap-2">
              <PlatformIcon size={12} color={COLORS.muted} />
              <Typography type="body-xs" color="muted" numberOfLines={1} className="flex-1">
                {`${platform.label} · saved ${savedAgo(item.saved_at)}`}
              </Typography>
              {showCategory ? (
                <View className="bg-surface-secondary flex-row items-center gap-1 rounded-full px-2 py-0.5">
                  <CategoryIcon size={11} color={COLORS.accent} />
                  <Typography type="body-xs" weight="medium" color="muted">
                    {item.category}
                  </Typography>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

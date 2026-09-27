import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Typography } from 'heroui-native';
import { ImageBackground, Pressable, View } from 'react-native';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { CATEGORY_META } from '@/lib/categories';
import { COLORS } from '@/lib/colors';
import { LOCAL_THUMBNAIL_BY_CATEGORY, thumbnailSource } from '@/lib/thumbnails';
import type { Category } from '@/lib/types';

interface FolderCardProps {
  category: Category;
  count: number;
  dueSoonCount: number;
}

/** Large image-backed dashboard folder card with item and deadline counts. */
export function FolderCard({ category, count, dueSoonCount }: FolderCardProps) {
  const meta = CATEGORY_META[category];
  const imageSource = thumbnailSource(LOCAL_THUMBNAIL_BY_CATEGORY[category]);

  return (
    <Pressable
      accessibilityLabel={`Open ${category} folder, ${count === 1 ? '1 item' : `${count} items`}`}
      accessibilityRole="button"
      className="w-full"
      onPress={() => router.push({ pathname: '/folder/[category]', params: { category } })}
      style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
    >
      <View className="border-border bg-surface h-52 overflow-hidden rounded-[28px] border">
        <ImageBackground
          source={imageSource ?? undefined}
          resizeMode="cover"
          style={{ width: '100%', height: 208 }}
        >
          <LinearGradient
            colors={[COLORS.imageOverlayTop, COLORS.imageOverlayMid, COLORS.imageOverlayBottom]}
            locations={[0, 0.44, 1]}
            className="absolute inset-0"
          />

          <View className="flex-1 justify-between p-5">
            <View className="items-end">
              <View className="flex-row items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-3 py-2">
                <Typography type="body-xs" weight="semibold" style={{ color: COLORS.onAccent }}>
                  {count === 1 ? '1 item' : `${count} items`}
                </Typography>
                <ChevronRight size={14} color={COLORS.onAccent} />
              </View>
            </View>

            <View className="gap-1">
              <Typography.Heading type="h3" weight="bold" style={{ color: COLORS.onAccent }}>
                {category}
              </Typography.Heading>
              <Typography type="body-sm" style={{ color: COLORS.onImageMuted }}>
                {dueSoonCount > 0 ? `${dueSoonCount} due soon` : meta.tagline}
              </Typography>
            </View>
          </View>
        </ImageBackground>
      </View>
    </Pressable>
  );
}

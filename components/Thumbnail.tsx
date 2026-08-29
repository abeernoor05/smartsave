import { Image, View } from 'react-native';

import { CATEGORY_META } from '@/lib/categories';
import { thumbnailSource } from '@/lib/thumbnails';
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ThumbnailProps {
  url: string;
  category: Category;
  width: number;
  height: number;
  className?: string;
}

/** Preview image for a saved item, falling back to a category-tinted tile. */
export function Thumbnail({ url, category, width, height, className }: ThumbnailProps) {
  const meta = CATEGORY_META[category];
  const source = thumbnailSource(url);
  const Icon = meta.icon;

  if (!source) {
    return (
      <View
        className={cn('items-center justify-center rounded-2xl', meta.iconBgClass, className)}
        style={{ width, height }}
      >
        <Icon size={Math.max(18, Math.min(32, Math.round(width / 3)))} color={meta.color} />
      </View>
    );
  }

  return (
    <View
      className={cn('bg-surface-secondary overflow-hidden rounded-2xl', className)}
      style={{ width, height }}
    >
      <Image source={source} resizeMode="cover" style={{ width, height }} />
    </View>
  );
}

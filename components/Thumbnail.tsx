import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';

import { LOCAL_THUMBNAIL_BY_CATEGORY, thumbnailSource } from '@/lib/thumbnails';
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ThumbnailProps {
  url: string;
  category: Category;
  width: number;
  height: number;
  className?: string;
}

/** Preview image for a saved item, falling back to representative folder artwork. */
export function Thumbnail({ url, category, width, height, className }: ThumbnailProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const fallbackSource = thumbnailSource(LOCAL_THUMBNAIL_BY_CATEGORY[category]);
  const source = imageFailed ? fallbackSource : (thumbnailSource(url) ?? fallbackSource);

  useEffect(() => {
    setImageFailed(false);
  }, [url]);

  return (
    <View
      className={cn('bg-surface-secondary overflow-hidden rounded-2xl', className)}
      style={{ width, height }}
    >
      <Image
        source={source ?? undefined}
        resizeMode="cover"
        style={{ width, height }}
        onError={() => setImageFailed(true)}
      />
    </View>
  );
}

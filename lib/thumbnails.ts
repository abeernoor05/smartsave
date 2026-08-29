import type { ImageSourcePropType } from 'react-native';

import type { Category } from '@/lib/types';

/**
 * Mock analysis stores thumbnails as `local:<key>` so bundled images can stand
 * in for scraped preview images. Real remote URLs pass straight through.
 */
const LOCAL_THUMBNAILS: Record<string, ImageSourcePropType> = {
  career: require('@/assets/thumbnails/career.png'),
  travel: require('@/assets/thumbnails/travel.png'),
  finance: require('@/assets/thumbnails/finance.png'),
  learning: require('@/assets/thumbnails/learning.png'),
  general: require('@/assets/thumbnails/general.png'),
};

export const LOCAL_THUMBNAIL_BY_CATEGORY: Record<Category, string> = {
  Career: 'local:career',
  Travel: 'local:travel',
  Finance: 'local:finance',
  Learning: 'local:learning',
  General: 'local:general',
};

export function thumbnailSource(url: string): ImageSourcePropType | null {
  if (!url) return null;
  if (url.startsWith('local:')) {
    return LOCAL_THUMBNAILS[url.slice('local:'.length)] ?? null;
  }
  return { uri: url };
}

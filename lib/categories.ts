import {
  Briefcase,
  Facebook,
  Globe,
  GraduationCap,
  Instagram,
  Linkedin,
  Plane,
  Tag,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';

import type { Category, Platform } from '@/lib/types';

interface CategoryMeta {
  /** One simple line icon per folder, used everywhere that folder appears. */
  icon: LucideIcon;
  tagline: string;
}

/**
 * Folders are told apart by their icon and label, not by colour: the palette
 * stays neutral so the accent and the deadline badges carry all the emphasis.
 */
export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Career: { icon: Briefcase, tagline: 'Jobs, roles, applications' },
  Travel: { icon: Plane, tagline: 'Trips, stays, bookings' },
  Finance: { icon: Wallet, tagline: 'Money, taxes, investing' },
  Learning: { icon: GraduationCap, tagline: 'Courses, talks, reading' },
  General: { icon: Tag, tagline: 'Everything else worth keeping' },
};

export const PLATFORM_META: Record<Platform, { label: string; icon: LucideIcon }> = {
  linkedin: { label: 'LinkedIn', icon: Linkedin },
  instagram: { label: 'Instagram', icon: Instagram },
  facebook: { label: 'Facebook', icon: Facebook },
  other: { label: 'Web', icon: Globe },
};

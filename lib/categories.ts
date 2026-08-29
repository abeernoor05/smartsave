import {
  Briefcase,
  GraduationCap,
  PiggyBank,
  Plane,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';
import { Facebook, Globe, Instagram, Linkedin } from 'lucide-react-native';

import type { Category, Platform } from '@/lib/types';

interface CategoryMeta {
  icon: LucideIcon;
  tagline: string;
  /** Hex value matching the --color-cat-* token; used for icon color props. */
  color: string;
  iconBgClass: string;
  chipBgClass: string;
  chipTextClass: string;
  accentBarClass: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Career: {
    icon: Briefcase,
    tagline: 'Jobs, roles, applications',
    color: '#4F46E5',
    iconBgClass: 'bg-cat-career-soft',
    chipBgClass: 'bg-cat-career-soft',
    chipTextClass: 'text-cat-career',
    accentBarClass: 'bg-cat-career',
  },
  Travel: {
    icon: Plane,
    tagline: 'Trips, stays, bookings',
    color: '#1F87B8',
    iconBgClass: 'bg-cat-travel-soft',
    chipBgClass: 'bg-cat-travel-soft',
    chipTextClass: 'text-cat-travel',
    accentBarClass: 'bg-cat-travel',
  },
  Finance: {
    icon: PiggyBank,
    tagline: 'Money, taxes, investing',
    color: '#12855E',
    iconBgClass: 'bg-cat-finance-soft',
    chipBgClass: 'bg-cat-finance-soft',
    chipTextClass: 'text-cat-finance',
    accentBarClass: 'bg-cat-finance',
  },
  Learning: {
    icon: GraduationCap,
    tagline: 'Courses, talks, reading',
    color: '#C2740F',
    iconBgClass: 'bg-cat-learning-soft',
    chipBgClass: 'bg-cat-learning-soft',
    chipTextClass: 'text-cat-learning',
    accentBarClass: 'bg-cat-learning',
  },
  General: {
    icon: Sparkles,
    tagline: 'Everything else worth keeping',
    color: '#7C5CA6',
    iconBgClass: 'bg-cat-general-soft',
    chipBgClass: 'bg-cat-general-soft',
    chipTextClass: 'text-cat-general',
    accentBarClass: 'bg-cat-general',
  },
};

export const PLATFORM_META: Record<Platform, { label: string; icon: LucideIcon }> = {
  linkedin: { label: 'LinkedIn', icon: Linkedin },
  instagram: { label: 'Instagram', icon: Instagram },
  facebook: { label: 'Facebook', icon: Facebook },
  other: { label: 'Web', icon: Globe },
};

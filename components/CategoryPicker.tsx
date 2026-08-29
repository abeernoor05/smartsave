import { Typography } from 'heroui-native';
import { Pressable, View } from 'react-native';

import { CATEGORY_META } from '@/lib/categories';
import { CATEGORIES, type Category } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CategoryPickerProps {
  value: Category;
  onChange: (category: Category) => void;
}

/** Editable folder tag on the item detail screen. */
export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {CATEGORIES.map((category) => {
        const meta = CATEGORY_META[category];
        const Icon = meta.icon;
        const isSelected = category === value;

        return (
          <Pressable
            key={category}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(category)}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <View
              className={cn(
                'flex-row items-center gap-1.5 rounded-full border px-3 py-2',
                isSelected
                  ? `${meta.chipBgClass} border-accent`
                  : 'bg-surface-secondary border-transparent',
              )}
            >
              <Icon size={14} color={isSelected ? meta.color : '#6A7080'} />
              <Typography
                type="body-xs"
                weight={isSelected ? 'semibold' : 'medium'}
                className={isSelected ? meta.chipTextClass : undefined}
                color={isSelected ? 'default' : 'muted'}
              >
                {category}
              </Typography>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

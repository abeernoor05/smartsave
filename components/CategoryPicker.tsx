import { Typography } from 'heroui-native';
import { Pressable, View } from 'react-native';

import { CATEGORY_META } from '@/lib/categories';
import { COLORS } from '@/lib/colors';
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
        const Icon = CATEGORY_META[category].icon;
        const isSelected = category === value;

        return (
          <Pressable
            key={category}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(category)}
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <View
              className={cn(
                'flex-row items-center gap-1.5 rounded-lg border px-3 py-2',
                isSelected ? 'bg-focal border-focal' : 'bg-surface-secondary/80 border-border',
              )}
            >
              <Icon size={14} color={isSelected ? COLORS.focalInk : COLORS.muted} />
              <Typography
                type="body-xs"
                weight={isSelected ? 'semibold' : 'medium'}
                className={isSelected ? 'text-focal-foreground' : undefined}
                color={isSelected ? undefined : 'muted'}
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

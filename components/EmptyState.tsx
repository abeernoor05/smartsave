import { Button, Typography } from 'heroui-native';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { COLORS } from '@/lib/colors';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="border-border bg-surface/70 mx-1 items-center gap-3 rounded-3xl border px-6 py-10">
      <View className="bg-surface-secondary size-12 items-center justify-center rounded-2xl">
        <Icon size={22} color={COLORS.muted} />
      </View>
      <Typography type="body" weight="bold" align="center">
        {title}
      </Typography>
      <Typography type="body-sm" color="muted" align="center">
        {description}
      </Typography>
      {actionLabel && onAction ? (
        <Button className="bg-focal" size="sm" onPress={onAction}>
          <Button.Label className="text-focal-foreground">{actionLabel}</Button.Label>
        </Button>
      ) : null}
    </View>
  );
}

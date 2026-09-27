import { Bell } from 'lucide-react-native';
import { Card, Typography } from 'heroui-native';
import { Pressable, View } from 'react-native';

import { CATEGORY_META } from '@/lib/categories';
import { COLORS } from '@/lib/colors';
import type { Reminder, ReminderStage } from '@/lib/reminders';
import type { Item } from '@/lib/types';
import { cn } from '@/lib/utils';

/** How each reminder stage is labelled wherever a notification is shown. */
export const STAGE_LABELS: Record<ReminderStage, string> = {
  lead: 'Heads-up · 2 days before',
  day: 'On the deadline day',
  nudge: 'Resurface nudge',
};

export type NotificationTone = 'due' | 'scheduled' | 'sent';

const TONE_STYLES: Record<NotificationTone, { bgClass: string; textClass: string }> = {
  due: { bgClass: 'bg-urgent-soft', textClass: 'text-urgent' },
  scheduled: { bgClass: 'bg-soon-soft', textClass: 'text-soon' },
  sent: { bgClass: 'bg-calm-soft', textClass: 'text-calm' },
};

interface NotificationCardProps {
  reminder: Reminder;
  /** The saved item this reminder belongs to, when it is still in the library. */
  item?: Item;
  tone: NotificationTone;
  /** Relative time, e.g. "in 2 days" or "3 hours ago". */
  timeLabel: string;
  /** Exact timestamp line under the message. */
  detail: string;
  onPress?: () => void;
  /** Replays this notification as an on-screen banner. */
  onPreview?: () => void;
  className?: string;
}

/**
 * One notification exactly as the phone shows it: app mark, title, message,
 * plus which deadline entry and stage it came from.
 */
export function NotificationCard({
  reminder,
  item,
  tone,
  timeLabel,
  detail,
  onPress,
  onPreview,
  className,
}: NotificationCardProps) {
  const styles = TONE_STYLES[tone];
  const CategoryIcon = item ? CATEGORY_META[item.category].icon : null;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed && onPress ? 0.85 : 1 })}
    >
      <Card className={cn('border-border bg-surface/95 gap-3 rounded-3xl border p-4', className)}>
        <View className="flex-row items-center gap-2">
          <View className="bg-accent size-7 items-center justify-center rounded-lg">
            <Bell size={14} color={COLORS.onAccent} />
          </View>
          <Typography type="body-xs" weight="semibold" className="flex-1">
            SmartSave
          </Typography>
          <Typography type="body-xs" color="muted">
            {timeLabel}
          </Typography>
        </View>

        <View className="gap-1">
          <Typography type="body-sm" weight="bold">
            {reminder.title}
          </Typography>
          <Typography type="body-xs" color="muted" numberOfLines={3}>
            {reminder.body}
          </Typography>
        </View>

        <View className="flex-row flex-wrap items-center gap-1.5">
          <View className={cn('rounded-lg px-2 py-1', styles.bgClass)}>
            <Typography type="body-xs" weight="semibold" className={styles.textClass}>
              {STAGE_LABELS[reminder.stage]}
            </Typography>
          </View>
          {CategoryIcon && item ? (
            <View className="bg-surface-secondary flex-row items-center gap-1 rounded-lg px-2 py-1">
              <CategoryIcon size={11} color={COLORS.muted} />
              <Typography type="body-xs" color="muted">
                {item.category}
              </Typography>
            </View>
          ) : null}
        </View>

        <View className="border-border flex-row items-center justify-between gap-3 border-t pt-2">
          <Typography type="body-xs" color="muted" className="flex-1">
            {detail}
          </Typography>
          {onPreview ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={onPreview}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Typography type="body-xs" weight="semibold" className="text-accent">
                Play
              </Typography>
            </Pressable>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

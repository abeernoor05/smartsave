import { CalendarClock } from 'lucide-react-native';
import { View } from 'react-native';
import { Typography } from 'heroui-native';

import { formatShortDate, relativeDeadlineLabel, URGENCY_STYLES, urgencyOf } from '@/lib/deadlines';
import { cn } from '@/lib/utils';

interface DeadlineTagProps {
  date: string;
  /** Number of additional deadlines on the same item. */
  extraCount?: number;
  className?: string;
}

/** Nearest-deadline pill with an optional "+N more" indicator. */
export function DeadlineTag({ date, extraCount = 0, className }: DeadlineTagProps) {
  const urgency = urgencyOf(date);
  const styles = URGENCY_STYLES[urgency];

  return (
    <View className={cn('flex-row items-center gap-1.5', className)}>
      <View className={cn('flex-row items-center gap-1 rounded-full px-2 py-1', styles.bgClass)}>
        <CalendarClock size={12} color={styles.color} />
        <Typography type="body-xs" weight="semibold" className={styles.textClass}>
          {`${relativeDeadlineLabel(date)} · ${formatShortDate(date)}`}
        </Typography>
      </View>
      {extraCount > 0 ? (
        <View className="bg-surface-tertiary rounded-full px-2 py-1">
          <Typography type="body-xs" weight="medium" color="muted">
            {`+${extraCount} more`}
          </Typography>
        </View>
      ) : null}
    </View>
  );
}

interface UnscheduledTagProps {
  /** Number of additional deadlines on the same item. */
  extraCount?: number;
  className?: string;
}

/** Shown when a deadline was mentioned but no date could be pinned down. */
export function UnscheduledTag({ extraCount = 0, className }: UnscheduledTagProps) {
  return (
    <View className={cn('flex-row items-center gap-1.5', className)}>
      <View className="bg-soon-soft flex-row items-center gap-1 rounded-full px-2 py-1">
        <CalendarClock size={12} color={URGENCY_STYLES.soon.color} />
        <Typography type="body-xs" weight="semibold" className="text-soon">
          Date to confirm
        </Typography>
      </View>
      {extraCount > 0 ? (
        <View className="bg-surface-tertiary rounded-full px-2 py-1">
          <Typography type="body-xs" weight="medium" color="muted">
            {`+${extraCount} more`}
          </Typography>
        </View>
      ) : null}
    </View>
  );
}

interface NudgeTagProps {
  date: string;
  className?: string;
}

/** Shown for items where no deadline was detected. */
export function NudgeTag({ date, className }: NudgeTagProps) {
  return (
    <View
      className={cn(
        'bg-surface-tertiary flex-row items-center gap-1 rounded-full px-2 py-1',
        className,
      )}
    >
      <Typography type="body-xs" weight="medium" color="muted">
        {`Gentle nudge · ${formatShortDate(date)}`}
      </Typography>
    </View>
  );
}

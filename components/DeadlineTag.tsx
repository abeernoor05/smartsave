import { CalendarClock } from 'lucide-react-native';
import { View } from 'react-native';
import { Typography } from 'heroui-native';

import {
  formatShortDate,
  NO_DEADLINE_STYLE,
  relativeDeadlineLabel,
  UNCONFIRMED_STYLE,
  URGENCY_STYLES,
  urgencyOf,
} from '@/lib/deadlines';
import { cn } from '@/lib/utils';

interface ExtraCountProps {
  count: number;
}

function ExtraCount({ count }: ExtraCountProps) {
  if (count <= 0) return null;
  return (
    <View className="bg-surface-secondary rounded-lg px-2 py-1">
      <Typography type="body-xs" weight="medium" color="muted">
        {`+${count}`}
      </Typography>
    </View>
  );
}

interface DeadlineTagProps {
  date: string;
  /** Number of additional deadlines on the same item. */
  extraCount?: number;
  className?: string;
}

/** Nearest-deadline pill: red when it is close or past, amber while further out. */
export function DeadlineTag({ date, extraCount = 0, className }: DeadlineTagProps) {
  const styles = URGENCY_STYLES[urgencyOf(date)];

  return (
    <View className={cn('flex-row items-center gap-1.5', className)}>
      <View className={cn('flex-row items-center gap-1 rounded-lg px-2.5 py-1', styles.bgClass)}>
        <CalendarClock size={12} color={styles.color} />
        <Typography type="body-xs" weight="semibold" className={styles.textClass}>
          {`${relativeDeadlineLabel(date)} · ${formatShortDate(date)}`}
        </Typography>
      </View>
      <ExtraCount count={extraCount} />
    </View>
  );
}

interface UnscheduledTagProps {
  /** Number of additional deadlines on the same item. */
  extraCount?: number;
  className?: string;
}

/** Amber pill for a deadline that exists but has no date pinned down yet. */
export function UnscheduledTag({ extraCount = 0, className }: UnscheduledTagProps) {
  return (
    <View className={cn('flex-row items-center gap-1.5', className)}>
      <View
        className={cn(
          'flex-row items-center gap-1 rounded-lg px-2.5 py-1',
          UNCONFIRMED_STYLE.bgClass,
        )}
      >
        <CalendarClock size={12} color={UNCONFIRMED_STYLE.color} />
        <Typography type="body-xs" weight="semibold" className={UNCONFIRMED_STYLE.textClass}>
          Date to confirm
        </Typography>
      </View>
      <ExtraCount count={extraCount} />
    </View>
  );
}

interface NudgeTagProps {
  date: string;
  className?: string;
}

/** Grey pill for items with no deadline at all. */
export function NudgeTag({ date, className }: NudgeTagProps) {
  return (
    <View
      className={cn(
        'flex-row items-center rounded-lg px-2.5 py-1',
        NO_DEADLINE_STYLE.bgClass,
        className,
      )}
    >
      <Typography type="body-xs" weight="medium" className={NO_DEADLINE_STYLE.textClass}>
        {`No deadline · nudge ${formatShortDate(date)}`}
      </Typography>
    </View>
  );
}

import { addDays, differenceInCalendarDays, parseISO } from 'date-fns';
import { Button, Card, Input, Label, TextField, Typography } from 'heroui-native';
import { Check, Pencil, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';
import { useState } from 'react';

import {
  formatDate,
  relativeDeadlineLabel,
  reminderDateFor,
  URGENCY_STYLES,
  urgencyOf,
} from '@/lib/deadlines';
import { useSmartSaveStore } from '@/lib/store';
import type { Deadline } from '@/lib/types';

const LEAD_OPTIONS = [1, 3, 7] as const;
const SHIFTS = [
  { label: '−1w', days: -7 },
  { label: '−1d', days: -1 },
  { label: '+1d', days: 1 },
  { label: '+1w', days: 7 },
] as const;

interface DeadlineListItemProps {
  itemId: string;
  deadline: Deadline;
}

/** One deadline from the item's deadlines array — editable and removable on its own. */
export function DeadlineListItem({ itemId, deadline }: DeadlineListItemProps) {
  const updateDeadline = useSmartSaveStore((state) => state.updateDeadline);
  const removeDeadline = useSmartSaveStore((state) => state.removeDeadline);
  const [isEditing, setIsEditing] = useState(false);

  const styles = URGENCY_STYLES[urgencyOf(deadline.date)];
  const leadDays = Math.max(
    0,
    differenceInCalendarDays(parseISO(deadline.date), parseISO(deadline.reminder_date)),
  );

  const shiftDate = (days: number) => {
    const nextDate = addDays(parseISO(deadline.date), days).toISOString();
    updateDeadline(itemId, deadline.id, {
      date: nextDate,
      reminder_date: reminderDateFor(nextDate, leadDays),
    });
  };

  const setLead = (lead: number) => {
    updateDeadline(itemId, deadline.id, { reminder_date: reminderDateFor(deadline.date, lead) });
  };

  return (
    <Card className="gap-3 p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Typography type="body-sm" weight="semibold">
            {deadline.context || 'Deadline'}
          </Typography>
          <Typography type="body-xs" color="muted">
            {formatDate(deadline.date)}
          </Typography>
          <View className={`self-start rounded-full px-2 py-1 ${styles.bgClass}`}>
            <Typography type="body-xs" weight="semibold" className={styles.textClass}>
              {relativeDeadlineLabel(deadline.date)}
            </Typography>
          </View>
        </View>

        <View className="flex-row gap-1">
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            accessibilityLabel={isEditing ? 'Finish editing deadline' : 'Edit deadline'}
            onPress={() => setIsEditing((editing) => !editing)}
          >
            {isEditing ? <Check size={16} color="#4F46E5" /> : <Pencil size={16} color="#6A7080" />}
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            accessibilityLabel="Remove deadline"
            onPress={() => removeDeadline(itemId, deadline.id)}
          >
            <Trash2 size={16} color="#C4382E" />
          </Button>
        </View>
      </View>

      <View className="bg-surface-secondary rounded-xl px-3 py-2">
        <Typography type="body-xs" color="muted">
          {leadDays === 0
            ? `Reminder on the day · ${formatDate(deadline.reminder_date)}`
            : `Reminder ${leadDays === 1 ? '1 day' : `${leadDays} days`} before · ${formatDate(deadline.reminder_date)}`}
          {deadline.reminder_sent ? ' · already sent' : ''}
        </Typography>
      </View>

      {isEditing ? (
        <View className="gap-3">
          <TextField>
            <Label>What is this date for?</Label>
            <Input
              value={deadline.context}
              placeholder="e.g. Applications close"
              onChangeText={(context: string) => updateDeadline(itemId, deadline.id, { context })}
            />
          </TextField>

          <View className="gap-1.5">
            <Typography type="body-xs" color="muted">
              Adjust the date
            </Typography>
            <View className="flex-row flex-wrap gap-2">
              {SHIFTS.map((shift) => (
                <Button
                  key={shift.label}
                  size="sm"
                  variant="secondary"
                  onPress={() => shiftDate(shift.days)}
                >
                  <Button.Label>{shift.label}</Button.Label>
                </Button>
              ))}
            </View>
          </View>

          <View className="gap-1.5">
            <Typography type="body-xs" color="muted">
              Remind me
            </Typography>
            <View className="flex-row flex-wrap gap-2">
              {LEAD_OPTIONS.map((lead) => (
                <Button
                  key={lead}
                  size="sm"
                  variant={leadDays === lead ? 'primary' : 'secondary'}
                  onPress={() => setLead(lead)}
                >
                  <Button.Label>{lead === 1 ? '1 day before' : `${lead} days before`}</Button.Label>
                </Button>
              ))}
              <Button
                size="sm"
                variant={leadDays === 0 ? 'primary' : 'secondary'}
                onPress={() => setLead(0)}
              >
                <Button.Label>On the day</Button.Label>
              </Button>
            </View>
          </View>
        </View>
      ) : null}
    </Card>
  );
}

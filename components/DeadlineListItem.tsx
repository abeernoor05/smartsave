import { addDays, parseISO } from 'date-fns';
import { Button, Card, Input, Label, TextField, Typography } from 'heroui-native';
import { CalendarPlus, Check, Pencil, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';
import { useState } from 'react';

import { COLORS } from '@/lib/colors';
import {
  type DeadlinePatch,
  formatDate,
  leadDaysOf,
  relativeDeadlineLabel,
  reminderDateFor,
  UNCONFIRMED_STYLE,
  URGENCY_STYLES,
  urgencyOf,
} from '@/lib/deadlines';
import type { Deadline } from '@/lib/types';

const LEAD_OPTIONS = [1, 2, 3, 7] as const;
const SHIFTS = [
  { label: '−1w', days: -7 },
  { label: '−1d', days: -1 },
  { label: '+1d', days: 1 },
  { label: '+1w', days: 7 },
] as const;

interface DeadlineListItemProps {
  deadline: Deadline;
  onChange: (patch: DeadlinePatch) => void;
  onRemove: () => void;
  /** Open the editing controls straight away, used while reviewing a new save. */
  startExpanded?: boolean;
}

/** One deadline from the item's deadlines array — editable and removable on its own. */
export function DeadlineListItem({
  deadline,
  onChange,
  onRemove,
  startExpanded = false,
}: DeadlineListItemProps) {
  const [isEditing, setIsEditing] = useState(startExpanded);

  const leadDays = leadDaysOf(deadline);
  const styles = deadline.date ? URGENCY_STYLES[urgencyOf(deadline.date)] : UNCONFIRMED_STYLE;

  const shiftDate = (days: number) => {
    if (!deadline.date) return;
    const nextDate = addDays(parseISO(deadline.date), days).toISOString();
    onChange({ date: nextDate, reminder_date: reminderDateFor(nextDate, leadDays) });
  };

  const setLead = (lead: number) => {
    if (!deadline.date) return;
    onChange({ reminder_date: reminderDateFor(deadline.date, lead) });
  };

  const giveItADate = () => {
    const nextDate = addDays(new Date(), 7).toISOString();
    onChange({ date: nextDate, reminder_date: reminderDateFor(nextDate, leadDays) });
    setIsEditing(true);
  };

  return (
    <Card className="border-border bg-surface/95 gap-3 rounded-3xl border p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Typography type="body-sm" weight="bold">
            {deadline.context || 'Deadline'}
          </Typography>

          {deadline.date ? (
            <>
              <Typography type="body-xs" color="muted">
                {formatDate(deadline.date)}
              </Typography>
              <View className={`self-start rounded-full px-2 py-1 ${styles.bgClass}`}>
                <Typography type="body-xs" weight="semibold" className={styles.textClass}>
                  {relativeDeadlineLabel(deadline.date)}
                </Typography>
              </View>
            </>
          ) : (
            <Typography type="body-xs" color="muted">
              No exact date found for this one — pick one to get a reminder.
            </Typography>
          )}
        </View>

        <View className="flex-row gap-1">
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            accessibilityLabel={isEditing ? 'Finish editing deadline' : 'Edit deadline'}
            onPress={() => setIsEditing((editing) => !editing)}
          >
            {isEditing ? (
              <Check size={16} color={COLORS.accent} />
            ) : (
              <Pencil size={16} color={COLORS.muted} />
            )}
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            accessibilityLabel="Remove deadline"
            onPress={onRemove}
          >
            <Trash2 size={16} color={COLORS.urgent} />
          </Button>
        </View>
      </View>

      {deadline.date && deadline.reminder_date ? (
        <View className="bg-surface-secondary gap-1 rounded-xl px-3 py-2">
          {leadDays > 0 ? (
            <Typography type="body-xs" color="muted">
              {`Reminder ${leadDays === 1 ? '1 day' : `${leadDays} days`} before · ${formatDate(deadline.reminder_date)}${
                deadline.lead_reminder_sent ? ' · sent' : ''
              }`}
            </Typography>
          ) : null}
          <Typography type="body-xs" color="muted">
            {`Reminder on the day · ${formatDate(deadline.date)}${deadline.reminder_sent ? ' · sent' : ''}`}
          </Typography>
        </View>
      ) : (
        <View className="gap-2">
          {deadline.reminder_date ? (
            <View className="bg-surface-secondary rounded-xl px-3 py-2">
              <Typography type="body-xs" color="muted">
                {`No date yet — this resurfaces on ${formatDate(deadline.reminder_date)}${
                  deadline.reminder_sent ? ' · sent' : ''
                }`}
              </Typography>
            </View>
          ) : null}
          <Button size="sm" variant="secondary" onPress={giveItADate}>
            <CalendarPlus size={14} color={COLORS.accent} />
            <Button.Label>Set a date</Button.Label>
          </Button>
        </View>
      )}

      {isEditing ? (
        <View className="gap-3">
          <TextField>
            <Label>What is this date for?</Label>
            <Input
              value={deadline.context}
              placeholder="e.g. Applications close"
              onChangeText={(context: string) => onChange({ context })}
            />
          </TextField>

          {deadline.date ? (
            <>
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
                      <Button.Label>
                        {lead === 1 ? '1 day before' : `${lead} days before`}
                      </Button.Label>
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
            </>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

import { router } from 'expo-router';
import { BellOff, BellRing, Clock, Inbox } from 'lucide-react-native';
import { Card, Typography } from 'heroui-native';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FadeInDown, FadeOut } from 'react-native-reanimated';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';

import { EmptyState } from '@/components/EmptyState';
import { NotificationCard } from '@/components/NotificationCard';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { COLORS } from '@/lib/colors';
import { allReminders, type Reminder, remindersSupported } from '@/lib/reminders';
import { useSmartSaveStore } from '@/lib/store';
import type { Item } from '@/lib/types';

/** How long a replayed notification stays on screen. */
const PREVIEW_MS = 6000;
/** Sent reminders shown, newest first. */
const SENT_LIMIT = 12;

function openItem(itemId: string): void {
  router.push({ pathname: '/item/[id]', params: { id: itemId } });
}

function stamp(iso: string): string {
  return format(parseISO(iso), 'd MMM · HH:mm');
}

function relative(iso: string, now: number): string {
  const at = parseISO(iso);
  return at.getTime() <= now
    ? `${formatDistanceToNowStrict(at)} ago`
    : `in ${formatDistanceToNowStrict(at)}`;
}

interface StatProps {
  icon: typeof BellRing;
  value: number;
  label: string;
}

function Stat({ icon: Icon, value, label }: StatProps) {
  return (
    <Card className="border-border flex-1 gap-1 border p-3">
      <Icon size={16} color={COLORS.muted} />
      <Typography type="body" weight="bold">
        {String(value)}
      </Typography>
      <Typography type="body-xs" color="muted">
        {label}
      </Typography>
    </Card>
  );
}

interface SectionProps {
  title: string;
  note: string;
  count: number;
  children: React.ReactNode;
}

function Section({ title, note, count, children }: SectionProps) {
  return (
    <View className="gap-3">
      <View className="gap-0.5">
        <View className="flex-row items-center justify-between gap-3">
          <Typography type="body" weight="bold">
            {title}
          </Typography>
          <Typography type="body-xs" color="muted">
            {count === 0 ? 'none' : String(count)}
          </Typography>
        </View>
        <Typography type="body-xs" color="muted">
          {note}
        </Typography>
      </View>
      {children}
    </View>
  );
}

/**
 * Every notification the reminder rules produce, with the exact moment each one
 * fires. Built for demoing on a screen that cannot show system notifications:
 * the list is the same data the phone build hands to the operating system.
 */
export default function NotificationsScreen() {
  const items = useSmartSaveStore((state) => state.items);
  const status = useSmartSaveStore((state) => state.status);
  const loadItems = useSmartSaveStore((state) => state.loadItems);

  const [now, setNow] = useState(() => Date.now());
  const [preview, setPreview] = useState<Reminder | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, []);

  const itemsById = useMemo(() => {
    const map = new Map<string, Item>();
    for (const item of items) map.set(item.id, item);
    return map;
  }, [items]);

  const reminders = useMemo(() => allReminders(items), [items]);

  const due = useMemo(
    () => reminders.filter((entry) => !entry.sent && parseISO(entry.fireAt).getTime() <= now),
    [reminders, now],
  );
  const scheduled = useMemo(
    () => reminders.filter((entry) => !entry.sent && parseISO(entry.fireAt).getTime() > now),
    [reminders, now],
  );
  const sent = useMemo(
    () =>
      reminders
        .filter((entry) => entry.sent)
        .slice()
        .toReversed()
        .slice(0, SENT_LIMIT),
    [reminders],
  );

  const showPreview = (reminder: Reminder) => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    setPreview(reminder);
    previewTimer.current = setTimeout(() => setPreview(null), PREVIEW_MS);
  };

  return (
    <View className="flex-1 bg-transparent">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={
          <RefreshControl
            refreshing={status === 'loading'}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
            onRefresh={() => void loadItems()}
          />
        }
      >
        <View className="gap-7 px-5 pt-5">
          <View
            className="bg-accent-soft absolute -top-28 -left-24 size-64 rounded-full"
            pointerEvents="none"
          />
          <View className="gap-2">
            <Typography type="body-sm" color="muted">
              Every reminder the deadline rules produce, one per deadline entry per stage, with the
              moment it reaches the phone.
            </Typography>
            {!remindersSupported ? (
              <Card className="border-border flex-row items-start gap-2.5 border p-3">
                <BellOff size={16} color={COLORS.muted} />
                <Typography type="body-xs" color="muted" className="flex-1">
                  This screen cannot show system notifications, so nothing is delivered here. The
                  cards below are exactly what the phone build sends. Tap Play to replay one as it
                  appears.
                </Typography>
              </Card>
            ) : null}
          </View>

          <View className="flex-row gap-3">
            <Stat icon={BellRing} value={due.length} label="Ready to fire" />
            <Stat icon={Clock} value={scheduled.length} label="Scheduled" />
            <Stat
              icon={Inbox}
              value={reminders.filter((entry) => entry.sent).length}
              label="Sent"
            />
          </View>

          {reminders.length === 0 ? (
            <EmptyState
              icon={BellRing}
              title="No reminders yet"
              description="Save a link and SmartSave lines up a reminder for every deadline it finds, plus a nudge for the ones without a date."
              actionLabel="Save a link"
              onAction={() => router.push('/add-link')}
            />
          ) : (
            <>
              <Section
                title="Firing now"
                note="Overdue and never sent — these go out the moment the app opens on a device."
                count={due.length}
              >
                {due.length === 0 ? (
                  <Typography type="body-sm" color="muted">
                    Nothing is waiting to be delivered.
                  </Typography>
                ) : (
                  due.map((reminder) => (
                    <NotificationCard
                      key={reminder.key}
                      reminder={reminder}
                      item={itemsById.get(reminder.itemId)}
                      tone="due"
                      timeLabel={relative(reminder.fireAt, now)}
                      detail={`Due ${stamp(reminder.fireAt)} · ${reminder.context}`}
                      onPress={() => openItem(reminder.itemId)}
                      onPreview={() => showPreview(reminder)}
                    />
                  ))
                )}
              </Section>

              <Section
                title="Scheduled"
                note="Handed to the system scheduler so they arrive with the app closed."
                count={scheduled.length}
              >
                {scheduled.length === 0 ? (
                  <Typography type="body-sm" color="muted">
                    No future reminders queued.
                  </Typography>
                ) : (
                  scheduled.map((reminder) => (
                    <NotificationCard
                      key={reminder.key}
                      reminder={reminder}
                      item={itemsById.get(reminder.itemId)}
                      tone="scheduled"
                      timeLabel={relative(reminder.fireAt, now)}
                      detail={`Fires ${stamp(reminder.fireAt)} · ${reminder.context}`}
                      onPress={() => openItem(reminder.itemId)}
                      onPreview={() => showPreview(reminder)}
                    />
                  ))
                )}
              </Section>

              <Section
                title="Already sent"
                note="Each deadline entry keeps its own record, so siblings still fire later."
                count={sent.length}
              >
                {sent.length === 0 ? (
                  <Typography type="body-sm" color="muted">
                    Nothing has been delivered yet.
                  </Typography>
                ) : (
                  sent.map((reminder) => (
                    <NotificationCard
                      key={reminder.key}
                      reminder={reminder}
                      item={itemsById.get(reminder.itemId)}
                      tone="sent"
                      timeLabel={relative(reminder.fireAt, now)}
                      detail={`Sent around ${stamp(reminder.fireAt)} · ${reminder.context}`}
                      onPress={() => openItem(reminder.itemId)}
                      onPreview={() => showPreview(reminder)}
                    />
                  ))
                )}
              </Section>
            </>
          )}
        </View>
      </ScrollView>

      {preview ? (
        <View className="pt-safe-offset-3 absolute inset-x-0 top-0 px-4" pointerEvents="box-none">
          <AnimatedView
            entering={FadeInDown.duration(260)}
            exiting={FadeOut.duration(180)}
            style={{
              shadowColor: '#101828',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.18,
              shadowRadius: 14,
              elevation: 8,
            }}
          >
            <Pressable accessibilityRole="button" onPress={() => setPreview(null)}>
              <NotificationCard
                reminder={preview}
                item={itemsById.get(preview.itemId)}
                tone="due"
                timeLabel="now"
                detail="Tap to dismiss"
              />
            </Pressable>
          </AnimatedView>
        </View>
      ) : null}
    </View>
  );
}

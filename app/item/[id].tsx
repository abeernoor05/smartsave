import { addDays } from 'date-fns';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chip, Separator, Typography } from 'heroui-native';
import {
  BellRing,
  ExternalLink,
  FileQuestion,
  Plus,
  ScanText,
  StickyNote,
  Trash2,
} from 'lucide-react-native';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useMemo, useState } from 'react';

import { CategoryPicker } from '@/components/CategoryPicker';
import { DeadlineListItem } from '@/components/DeadlineListItem';
import { EmptyState } from '@/components/EmptyState';
import { Thumbnail } from '@/components/Thumbnail';
import { PLATFORM_META } from '@/lib/categories';
import { COLORS } from '@/lib/colors';
import {
  formatDate,
  realDeadlines,
  REMINDER_LEAD_DAYS,
  resurfaceDateFor,
  savedAgo,
  sortDeadlines,
  undatedDeadlines,
  UNDATED_NUDGE_DAYS,
} from '@/lib/deadlines';
import { goBackOrReplace } from '@/lib/navigation';
import { getItemById, useSmartSaveStore } from '@/lib/store';
import type { Confidence } from '@/lib/types';

const CONFIDENCE_LABEL: Record<
  Confidence,
  { label: string; color: 'success' | 'warning' | 'default' }
> = {
  high: { label: 'High confidence', color: 'success' },
  medium: { label: 'Medium confidence', color: 'warning' },
  low: { label: 'Low confidence', color: 'default' },
};

export default function ItemDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const items = useSmartSaveStore((state) => state.items);
  const setCategory = useSmartSaveStore((state) => state.setCategory);
  const addDeadline = useSmartSaveStore((state) => state.addDeadline);
  const updateDeadline = useSmartSaveStore((state) => state.updateDeadline);
  const removeDeadline = useSmartSaveStore((state) => state.removeDeadline);
  const removeItem = useSmartSaveStore((state) => state.removeItem);
  const storeError = useSmartSaveStore((state) => state.error);

  const { width } = useWindowDimensions();
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  const item = getItemById(items, params.id);
  const deadlines = useMemo(() => (item ? sortDeadlines(realDeadlines(item)) : []), [item]);
  const undated = useMemo(() => (item ? undatedDeadlines(item) : []), [item]);

  if (!item) {
    return (
      <View className="bg-background flex-1">
        <Stack.Screen options={{ title: 'Saved item' }} />
        <EmptyState
          icon={FileQuestion}
          title="Item not found"
          description="This saved item is no longer in your library."
          actionLabel="Back to folders"
          onAction={() => goBackOrReplace('/')}
        />
      </View>
    );
  }

  const heroWidth = Math.max(240, width - 32);
  const platform = PLATFORM_META[item.platform];
  const PlatformIcon = platform.icon;
  const confidence = CONFIDENCE_LABEL[item.confidence];

  return (
    <View className="bg-background flex-1">
      <Stack.Screen options={{ title: item.category }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}>
        <Thumbnail
          url={item.thumbnail_url}
          category={item.category}
          width={heroWidth}
          height={Math.round(heroWidth * 0.52)}
        />

        <View className="flex-row flex-wrap items-center gap-2">
          <View className="bg-surface-secondary flex-row items-center gap-1.5 rounded-full px-2.5 py-1">
            <PlatformIcon size={12} color={COLORS.muted} />
            <Typography type="body-xs" weight="medium" color="muted">
              {platform.label}
            </Typography>
          </View>
          <Chip size="sm" variant="secondary" color={confidence.color}>
            <Chip.Label>{confidence.label}</Chip.Label>
          </Chip>
          <Typography type="body-xs" color="muted">
            {`Saved ${savedAgo(item.saved_at)}`}
          </Typography>
        </View>

        <Card className="border-border gap-2 border p-4">
          <Typography type="body-xs" weight="semibold" color="muted">
            AI SUMMARY
          </Typography>
          <Typography type="body">{item.ai_summary}</Typography>
        </Card>

        {undated.length > 0 ? (
          <Card className="border-border gap-3 border p-4">
            <View className="flex-row items-center gap-2">
              <StickyNote size={14} color={COLORS.soon} />
              <Typography type="body-xs" weight="semibold" color="muted">
                MENTIONED, NO DATE YET
              </Typography>
            </View>
            {undated.map((deadline) => (
              <View key={deadline.id} className="gap-0.5">
                <Typography type="body-sm" weight="bold">
                  {deadline.context || 'Deadline'}
                </Typography>
                <Typography type="body-xs" color="muted">
                  {deadline.reminder_date
                    ? `Resurfaces on ${formatDate(deadline.reminder_date)} — set a date below for a proper reminder.`
                    : 'Set a date below to get a reminder.'}
                </Typography>
              </View>
            ))}
          </Card>
        ) : null}

        {storeError ? (
          <Typography type="body-xs" className="text-urgent">
            {storeError}
          </Typography>
        ) : null}

        <View className="gap-2">
          <Typography type="body" weight="bold">
            Folder
          </Typography>
          <CategoryPicker
            value={item.category}
            onChange={(category) => void setCategory(item.id, category)}
          />
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Typography type="body" weight="bold">
                {deadlines.length > 0 ? `Deadlines (${deadlines.length})` : 'Deadlines'}
              </Typography>
              {deadlines.length > 0 ? (
                <Typography type="body-xs" color="muted">
                  {`Each date reminds you ${REMINDER_LEAD_DAYS} days before and again on the day.`}
                </Typography>
              ) : null}
            </View>
            <Button
              size="sm"
              variant="secondary"
              onPress={() =>
                void addDeadline(item.id, addDays(new Date(), 7).toISOString(), 'Follow up')
              }
            >
              <Plus size={14} color={COLORS.accent} />
              <Button.Label>Add</Button.Label>
            </Button>
          </View>

          {deadlines.length > 0 ? (
            deadlines.map((deadline) => (
              <DeadlineListItem
                key={deadline.id}
                deadline={deadline}
                onChange={(patch) => void updateDeadline(item.id, deadline.id, patch)}
                onRemove={() => void removeDeadline(item.id, deadline.id)}
              />
            ))
          ) : (
            <Card className="border-border flex-row items-start gap-3 border p-4">
              <View className="bg-surface-secondary size-10 items-center justify-center rounded-xl">
                <BellRing size={18} color={COLORS.muted} />
              </View>
              <View className="flex-1 gap-1">
                <Typography type="body-sm" weight="bold">
                  No deadline detected
                </Typography>
                <Typography type="body-xs" color="muted">
                  {`SmartSave will resurface this on ${formatDate(resurfaceDateFor(item))}, ${UNDATED_NUDGE_DAYS} days after saving, so it does not get forgotten.`}
                </Typography>
              </View>
            </Card>
          )}
        </View>

        <Card className="border-border gap-3 border p-4">
          <Typography type="body-xs" weight="semibold" color="muted">
            ORIGINAL CAPTION
          </Typography>
          <Typography type="body-sm" numberOfLines={isCaptionExpanded ? undefined : 3}>
            {item.caption_text || 'No caption was found on this post.'}
          </Typography>
          {item.caption_text.length > 140 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsCaptionExpanded((expanded) => !expanded)}
            >
              <Typography type="body-sm" weight="semibold" className="text-accent">
                {isCaptionExpanded ? 'Show less' : 'Show more'}
              </Typography>
            </Pressable>
          ) : null}

          {item.ocr_text ? (
            <>
              <Separator />
              <View className="gap-1.5">
                <View className="flex-row items-center gap-2">
                  <ScanText size={14} color={COLORS.muted} />
                  <Typography type="body-xs" weight="semibold" color="muted">
                    TEXT FOUND IN IMAGE
                  </Typography>
                </View>
                <Typography type="body-sm" color="muted">
                  {item.ocr_text}
                </Typography>
              </View>
            </>
          ) : null}
        </Card>

        <View className="gap-3">
          <Button onPress={() => void Linking.openURL(item.original_url)}>
            <ExternalLink size={16} color={COLORS.onAccent} />
            <Button.Label>Open original link</Button.Label>
          </Button>
          <Typography type="body-xs" color="muted" align="center" numberOfLines={1}>
            {item.original_url}
          </Typography>

          <Button
            variant="danger-soft"
            onPress={() => {
              void removeItem(item.id);
              goBackOrReplace('/');
            }}
          >
            <Trash2 size={16} color={COLORS.urgent} />
            <Button.Label>Remove from SmartSave</Button.Label>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

import { addDays } from 'date-fns';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chip, Separator, Typography } from 'heroui-native';
import {
  BellRing,
  CalendarDays,
  ExternalLink,
  FileQuestion,
  FolderOpen,
  Plus,
  ScanText,
  StickyNote,
  Trash2,
} from 'lucide-react-native';
import { ImageBackground, Pressable, ScrollView, View } from 'react-native';
import { useMemo, useState } from 'react';

import { CategoryPicker } from '@/components/CategoryPicker';
import { DeadlineListItem } from '@/components/DeadlineListItem';
import { EmptyState } from '@/components/EmptyState';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { PLATFORM_META } from '@/lib/categories';
import { COLORS } from '@/lib/colors';
import {
  formatDate,
  realDeadlines,
  relativeDeadlineLabel,
  REMINDER_LEAD_DAYS,
  resurfaceDateFor,
  savedAgo,
  sortDeadlines,
  undatedDeadlines,
  UNDATED_NUDGE_DAYS,
} from '@/lib/deadlines';
import { goBackOrReplace } from '@/lib/navigation';
import { getItemById, useSmartSaveStore } from '@/lib/store';
import { LOCAL_THUMBNAIL_BY_CATEGORY, thumbnailSource } from '@/lib/thumbnails';
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

  const platform = PLATFORM_META[item.platform];
  const PlatformIcon = platform.icon;
  const confidence = CONFIDENCE_LABEL[item.confidence];
  const primaryDeadline = deadlines.find((deadline) => deadline.date);
  const imageSource =
    thumbnailSource(item.thumbnail_url) ??
    thumbnailSource(LOCAL_THUMBNAIL_BY_CATEGORY[item.category]);

  return (
    <View className="bg-background flex-1">
      <Stack.Screen options={{ title: item.category }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 56 }}>
        <ImageBackground
          source={imageSource ?? undefined}
          resizeMode="cover"
          style={{ width: '100%', height: 330 }}
        >
          <LinearGradient
            colors={['rgba(8,8,16,0.08)', 'rgba(8,8,16,0.28)', COLORS.imageOverlayBottom]}
            locations={[0, 0.42, 1]}
            className="absolute inset-0"
          />
          <View className="flex-1 justify-end gap-3 px-5 pb-6">
            <View className="flex-row flex-wrap items-center gap-2">
              <View className="flex-row items-center gap-1.5 rounded-lg border border-white/20 bg-black/45 px-2.5 py-1">
                <PlatformIcon size={13} color={COLORS.onAccent} />
                <Typography type="body-xs" weight="medium" style={{ color: COLORS.onAccent }}>
                  {platform.label}
                </Typography>
              </View>
              <Chip className="rounded-lg" size="sm" variant="secondary" color={confidence.color}>
                <Chip.Label>{confidence.label}</Chip.Label>
              </Chip>
            </View>

            <Typography
              type="h2"
              weight="bold"
              numberOfLines={3}
              style={{ color: COLORS.onAccent }}
            >
              {primaryDeadline?.context || item.ai_summary}
            </Typography>

            <View className="flex-row flex-wrap items-center gap-2">
              {primaryDeadline?.date ? (
                <>
                  <Typography type="body-sm" weight="semibold" style={{ color: COLORS.onAccent }}>
                    {formatDate(primaryDeadline.date)}
                  </Typography>
                  <View className="size-1 rounded-lg bg-white/70" />
                  <Typography type="body-sm" style={{ color: COLORS.onImageMuted }}>
                    {relativeDeadlineLabel(primaryDeadline.date)}
                  </Typography>
                </>
              ) : (
                <Typography type="body-sm" style={{ color: COLORS.onImageMuted }}>
                  {`Saved ${savedAgo(item.saved_at)}`}
                </Typography>
              )}
            </View>
          </View>
        </ImageBackground>

        <View className="gap-5 px-5 pt-5">
          <Card className="border-border bg-surface/95 gap-3 rounded-3xl border p-5">
            <View className="flex-row items-center gap-2">
              <View className="bg-accent-soft size-10 items-center justify-center rounded-2xl">
                <StickyNote size={18} color={COLORS.accent} />
              </View>
              <View className="flex-1">
                <Typography type="body" weight="bold">
                  Summary
                </Typography>
                <Typography type="body-xs" color="muted">
                  {`Saved ${savedAgo(item.saved_at)}`}
                </Typography>
              </View>
            </View>
            <Typography type="body-sm" color="muted">
              {item.ai_summary}
            </Typography>
          </Card>

          {undated.length > 0 ? (
            <Card className="border-border bg-surface/95 gap-3 rounded-3xl border p-5">
              <View className="flex-row items-center gap-2">
                <StickyNote size={16} color={COLORS.soon} />
                <Typography type="body" weight="bold">
                  Date to confirm
                </Typography>
              </View>
              {undated.map((deadline) => (
                <View key={deadline.id} className="gap-1">
                  <Typography type="body-sm" weight="semibold">
                    {deadline.context || 'Deadline'}
                  </Typography>
                  <Typography type="body-xs" color="muted">
                    {deadline.reminder_date
                      ? `Resurfaces on ${formatDate(deadline.reminder_date)} until you set a date.`
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

          <Card className="border-border bg-surface/95 gap-4 rounded-3xl border p-5">
            <View className="flex-row items-center gap-2">
              <FolderOpen size={18} color={COLORS.accent} />
              <Typography type="body" weight="bold">
                Folder
              </Typography>
            </View>
            <CategoryPicker
              value={item.category}
              onChange={(category) => void setCategory(item.id, category)}
            />
          </Card>

          <View className="gap-3">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1 flex-row items-center gap-2">
                <CalendarDays size={18} color={COLORS.accent} />
                <View className="flex-1">
                  <Typography type="body" weight="bold">
                    {deadlines.length > 0 ? `Deadlines (${deadlines.length})` : 'Deadlines'}
                  </Typography>
                  {deadlines.length > 0 ? (
                    <Typography type="body-xs" color="muted">
                      {`${REMINDER_LEAD_DAYS} days before and again on the day`}
                    </Typography>
                  ) : null}
                </View>
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
              <Card className="border-border bg-surface/95 flex-row items-start gap-3 rounded-3xl border p-5">
                <View className="bg-surface-secondary size-10 items-center justify-center rounded-2xl">
                  <BellRing size={18} color={COLORS.muted} />
                </View>
                <View className="flex-1 gap-1">
                  <Typography type="body-sm" weight="bold">
                    No deadline detected
                  </Typography>
                  <Typography type="body-xs" color="muted">
                    {`SmartSave will resurface this on ${formatDate(resurfaceDateFor(item))}, ${UNDATED_NUDGE_DAYS} days after saving.`}
                  </Typography>
                </View>
              </Card>
            )}
          </View>

          <Card className="border-border bg-surface/95 gap-3 rounded-3xl border p-5">
            <Typography type="body" weight="bold">
              Original caption
            </Typography>
            <Typography
              type="body-sm"
              color="muted"
              numberOfLines={isCaptionExpanded ? undefined : 4}
            >
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
                      Text found in image
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
            <Button className="bg-focal" onPress={() => void Linking.openURL(item.original_url)}>
              <ExternalLink size={16} color={COLORS.focalInk} />
              <Button.Label className="text-focal-foreground">Open original link</Button.Label>
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
        </View>
      </ScrollView>
    </View>
  );
}

import { addDays } from 'date-fns';
import { router } from 'expo-router';
import {
  Button,
  Card,
  Chip,
  FieldError,
  Input,
  Label,
  Spinner,
  TextField,
  Typography,
} from 'heroui-native';
import {
  KeyboardAvoidingView,
  Platform as RNPlatform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { CheckCheck, Plus, X } from 'lucide-react-native';
import { useRef, useState } from 'react';

import { CategoryPicker } from '@/components/CategoryPicker';
import { DeadlineListItem } from '@/components/DeadlineListItem';
import { Thumbnail } from '@/components/Thumbnail';
import { PLATFORM_META } from '@/lib/categories';
import { COLORS } from '@/lib/colors';
import {
  applyDeadlinePatch,
  createDeadline,
  type DeadlinePatch,
  REMINDER_LEAD_DAYS,
  UNDATED_NUDGE_DAYS,
} from '@/lib/deadlines';
import {
  ANALYSIS_STAGES,
  analyzeLink,
  detectPlatform,
  isProbablyUrl,
  normalizeUrl,
} from '@/lib/linkAnalysis';
import { goBackOrReplace } from '@/lib/navigation';
import { useSmartSaveStore } from '@/lib/store';
import type { Category, Confidence, ItemAnalysis, Platform } from '@/lib/types';

type Phase = 'input' | 'working' | 'review' | 'note' | 'saving';

const CONFIDENCE_CHIP: Record<
  Confidence,
  { label: string; color: 'success' | 'warning' | 'default' }
> = {
  high: { label: 'High confidence', color: 'success' },
  medium: { label: 'Medium confidence', color: 'warning' },
  low: { label: 'Low confidence', color: 'default' },
};

interface NoteContext {
  platform: Platform;
  thumbnail_url: string;
  page_title: string;
}

export default function AddLinkScreen() {
  const createItem = useSmartSaveStore((state) => state.createItem);
  const { height, width } = useWindowDimensions();

  const [url, setUrl] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [stage, setStage] = useState<string>(ANALYSIS_STAGES[0]);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<ItemAnalysis | null>(null);
  const [noteContext, setNoteContext] = useState<NoteContext | null>(null);
  const [note, setNote] = useState('');
  const [noteCategory, setNoteCategory] = useState<Category>('General');

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isBusy = phase === 'working' || phase === 'saving';
  const platformHint = url.trim().length > 3 ? PLATFORM_META[detectPlatform(url)] : null;
  const heroWidth = Math.max(220, Math.min(width - 72, 520));

  const stopStages = () => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  };

  const startStages = () => {
    stopStages();
    setStage(ANALYSIS_STAGES[0]);
    timers.current = [
      setTimeout(() => setStage(ANALYSIS_STAGES[1]), 1400),
      setTimeout(() => setStage(ANALYSIS_STAGES[2]), 3200),
    ];
  };

  const close = () => {
    if (isBusy) return;
    stopStages();
    goBackOrReplace('/');
  };

  const handleAnalyze = async () => {
    if (!isProbablyUrl(url)) {
      setError('That does not look like a link. Paste a full post or article address.');
      return;
    }

    setError(null);
    setPhase('working');
    startStages();

    try {
      const result = await analyzeLink(normalizeUrl(url));
      if (result.status === 'needs_note') {
        setNoteContext({
          platform: result.platform,
          thumbnail_url: result.thumbnail_url,
          page_title: result.page_title,
        });
        setNote('');
        setNoteCategory('General');
        setPhase('note');
      } else {
        setDraft(result.analysis);
        setPhase('review');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not analyze that link.');
      setPhase('input');
    } finally {
      stopStages();
    }
  };

  const patchDeadline = (deadlineId: string, patch: DeadlinePatch) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            deadlines: current.deadlines.map((deadline) =>
              deadline.id === deadlineId ? applyDeadlinePatch(deadline, patch) : deadline,
            ),
          }
        : current,
    );
  };

  const removeDraftDeadline = (deadlineId: string) => {
    setDraft((current) => {
      if (!current) return current;
      const deadlines = current.deadlines.filter((deadline) => deadline.id !== deadlineId);
      return { ...current, deadlines, has_deadline: deadlines.length > 0 };
    });
  };

  const addDraftDeadline = () => {
    setDraft((current) => {
      if (!current) return current;
      const deadlines = [
        ...current.deadlines,
        createDeadline(addDays(new Date(), 7).toISOString(), 'Follow up'),
      ];
      return { ...current, deadlines, has_deadline: true };
    });
  };

  const finalize = async (payload: ItemAnalysis) => {
    setError(null);
    setPhase('saving');
    try {
      const item = await createItem({ original_url: normalizeUrl(url), ...payload });
      router.replace({ pathname: '/item/[id]', params: { id: item.id } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this link.');
      setPhase(draft ? 'review' : 'note');
    }
  };

  const confirmAnalyzed = () => {
    if (!draft) return;
    void finalize({ ...draft, has_deadline: draft.deadlines.length > 0 });
  };

  const confirmNote = () => {
    if (!noteContext) return;
    const trimmed = note.trim();
    if (trimmed.length < 3) {
      setError('Add a few words so you can recognise this later.');
      return;
    }
    void finalize({
      platform: noteContext.platform,
      thumbnail_url: noteContext.thumbnail_url,
      caption_text: '',
      ocr_text: '',
      ai_summary: trimmed,
      category: noteCategory,
      has_deadline: false,
      deadlines: [],
      confidence: 'low',
    });
  };

  const confidence = draft ? CONFIDENCE_CHIP[draft.confidence] : null;

  return (
    <View className="flex-1 justify-end bg-black/75">
      <Pressable
        accessibilityLabel="Close"
        accessibilityRole="button"
        className="absolute inset-0"
        onPress={close}
      />

      <KeyboardAvoidingView behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: height * 0.86 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        >
          <Card className="border-border bg-overlay gap-4 rounded-3xl border p-5">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Typography.Heading type="h4" weight="bold">
                  {phase === 'review'
                    ? 'Check before saving'
                    : phase === 'note'
                      ? 'Add a quick note'
                      : 'Save a link'}
                </Typography.Heading>
                <Typography type="body-sm" color="muted">
                  {phase === 'review'
                    ? 'This is what the AI found. Change the folder or the dates if it got something wrong.'
                    : phase === 'note'
                      ? "We couldn't find any text in this post. Add a quick note so you can find it later"
                      : 'Paste a post or article. SmartSave reads it, files it, and sets the reminder.'}
                </Typography>
              </View>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                accessibilityLabel="Close"
                isDisabled={isBusy}
                onPress={close}
              >
                <X size={18} color={COLORS.muted} />
              </Button>
            </View>

            {phase === 'input' || phase === 'working' ? (
              <>
                <TextField isInvalid={error !== null}>
                  <Input
                    value={url}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isBusy}
                    inputMode="url"
                    keyboardType="url"
                    placeholder="https://"
                    returnKeyType="done"
                    onChangeText={(next: string) => {
                      setUrl(next);
                      if (error) setError(null);
                    }}
                    onSubmitEditing={() => void handleAnalyze()}
                  />
                  {error ? <FieldError>{error}</FieldError> : null}
                </TextField>

                {platformHint && phase === 'input' ? (
                  <Typography type="body-xs" color="muted">
                    {`Detected: ${platformHint.label}`}
                  </Typography>
                ) : null}

                {phase === 'working' ? (
                  <View className="bg-surface-secondary flex-row items-center gap-3 rounded-2xl p-4">
                    <Spinner size="sm" />
                    <Typography type="body-sm" weight="medium">
                      {stage}
                    </Typography>
                  </View>
                ) : null}

                <Button isDisabled={isBusy} onPress={() => void handleAnalyze()}>
                  <Button.Label>{isBusy ? 'Analyzing…' : 'Save and analyze'}</Button.Label>
                </Button>
              </>
            ) : null}

            {phase === 'note' || (phase === 'saving' && !draft) ? (
              <>
                {noteContext?.thumbnail_url ? (
                  <Thumbnail
                    url={noteContext.thumbnail_url}
                    category={noteCategory}
                    width={heroWidth}
                    height={Math.round(heroWidth * 0.5)}
                  />
                ) : null}

                {noteContext?.page_title ? (
                  <Typography type="body-sm" weight="medium" numberOfLines={2}>
                    {noteContext.page_title}
                  </Typography>
                ) : null}

                <TextField isInvalid={error !== null}>
                  <Label>Your note</Label>
                  <Input
                    value={note}
                    editable={phase === 'note'}
                    multiline
                    numberOfLines={3}
                    placeholder="e.g. Reel about the scholarship my friend mentioned"
                    onChangeText={(next: string) => {
                      setNote(next);
                      if (error) setError(null);
                    }}
                  />
                  {error ? <FieldError>{error}</FieldError> : null}
                </TextField>

                <View className="gap-2">
                  <Typography type="body-sm" weight="semibold">
                    Pick a folder
                  </Typography>
                  <CategoryPicker value={noteCategory} onChange={setNoteCategory} />
                </View>

                <Typography type="body-xs" color="muted">
                  Saved without a deadline, so it gets a gentle nudge instead.
                </Typography>

                <Button isDisabled={phase === 'saving'} onPress={confirmNote}>
                  {phase === 'saving' ? <Spinner size="sm" /> : null}
                  <Button.Label>{phase === 'saving' ? 'Saving…' : 'Save note'}</Button.Label>
                </Button>
              </>
            ) : null}

            {draft && (phase === 'review' || phase === 'saving') ? (
              <>
                {draft.thumbnail_url ? (
                  <Thumbnail
                    url={draft.thumbnail_url}
                    category={draft.category}
                    width={heroWidth}
                    height={Math.round(heroWidth * 0.5)}
                  />
                ) : null}

                <View className="flex-row flex-wrap items-center gap-2">
                  <Typography type="body-xs" color="muted">
                    {PLATFORM_META[draft.platform].label}
                  </Typography>
                  {confidence ? (
                    <Chip
                      className="rounded-lg"
                      size="sm"
                      variant="secondary"
                      color={confidence.color}
                    >
                      <Chip.Label>{confidence.label}</Chip.Label>
                    </Chip>
                  ) : null}
                </View>

                <View className="bg-surface-secondary gap-1.5 rounded-2xl p-4">
                  <Typography type="body-xs" weight="semibold" color="muted">
                    AI SUMMARY
                  </Typography>
                  <Typography type="body-sm">{draft.ai_summary}</Typography>
                </View>

                <View className="gap-2">
                  <Typography type="body-sm" weight="semibold">
                    Folder
                  </Typography>
                  <CategoryPicker
                    value={draft.category}
                    onChange={(category) =>
                      setDraft((current) => (current ? { ...current, category } : current))
                    }
                  />
                </View>

                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Typography type="body-sm" weight="semibold">
                        {draft.deadlines.length > 0
                          ? `Deadlines found (${draft.deadlines.length})`
                          : 'No deadline found'}
                      </Typography>
                      {draft.deadlines.length > 0 ? (
                        <Typography type="body-xs" color="muted">
                          {`Each one reminds you ${REMINDER_LEAD_DAYS} days before and again on the day.`}
                        </Typography>
                      ) : null}
                    </View>
                    <Button size="sm" variant="secondary" onPress={addDraftDeadline}>
                      <Plus size={14} color={COLORS.accent} />
                      <Button.Label>Add</Button.Label>
                    </Button>
                  </View>

                  {draft.deadlines.length > 0 ? (
                    draft.deadlines.map((deadline) => (
                      <DeadlineListItem
                        key={deadline.id}
                        deadline={deadline}
                        onChange={(patch) => patchDeadline(deadline.id, patch)}
                        onRemove={() => removeDraftDeadline(deadline.id)}
                      />
                    ))
                  ) : (
                    <Typography type="body-xs" color="muted">
                      {`Nothing time-sensitive in this post, so SmartSave resurfaces it in ${UNDATED_NUDGE_DAYS} days.`}
                    </Typography>
                  )}
                </View>

                {error ? (
                  <Typography type="body-xs" className="text-urgent">
                    {error}
                  </Typography>
                ) : null}

                <View className="gap-2">
                  <Button isDisabled={phase === 'saving'} onPress={confirmAnalyzed}>
                    {phase === 'saving' ? (
                      <Spinner size="sm" />
                    ) : (
                      <CheckCheck size={16} color={COLORS.onAccent} />
                    )}
                    <Button.Label>
                      {phase === 'saving' ? 'Saving…' : 'Confirm and save'}
                    </Button.Label>
                  </Button>
                  <Button
                    variant="ghost"
                    isDisabled={phase === 'saving'}
                    onPress={() => {
                      setDraft(null);
                      setError(null);
                      setPhase('input');
                    }}
                  >
                    <Button.Label>Start over</Button.Label>
                  </Button>
                </View>
              </>
            ) : null}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

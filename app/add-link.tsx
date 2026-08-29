import { router } from 'expo-router';
import {
  Button,
  Card,
  Chip,
  FieldError,
  Input,
  Spinner,
  TextField,
  Typography,
} from 'heroui-native';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useState } from 'react';

import { PLATFORM_META } from '@/lib/categories';
import { goBackOrReplace } from '@/lib/navigation';
import { analyzeLink, detectPlatform, isProbablyUrl, normalizeUrl } from '@/lib/mockAnalysis';
import { useSmartSaveStore } from '@/lib/store';

const EXAMPLES = [
  { label: 'LinkedIn job post', url: 'https://linkedin.com/posts/design-lead-role-hiring' },
  { label: 'Instagram travel deal', url: 'https://instagram.com/reel/lisbon-flight-trip-sale' },
  { label: 'Tax reminder', url: 'https://facebook.com/posts/end-of-tax-year-money-checklist' },
  { label: 'Free workshop', url: 'https://example.com/workshop-systems-thinking-course' },
];

export default function AddLinkScreen() {
  const saveAnalyzedLink = useSmartSaveStore((state) => state.saveAnalyzedLink);
  const [url, setUrl] = useState('');
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAnalyzing = stage !== null;
  const platform = url.trim().length > 3 ? PLATFORM_META[detectPlatform(url)] : null;

  const close = () => {
    if (isAnalyzing) return;
    goBackOrReplace('/');
  };

  const handleSave = async () => {
    if (!isProbablyUrl(url)) {
      setError('That does not look like a link. Paste a full post or article address.');
      return;
    }

    setError(null);
    const normalized = normalizeUrl(url);

    try {
      const analysis = await analyzeLink(normalized, (nextStage) => setStage(nextStage));
      const item = saveAnalyzedLink(normalized, analysis);
      setStage(null);
      router.replace({ pathname: '/item/[id]', params: { id: item.id } });
    } catch {
      setStage(null);
      setError('Could not analyze that link. Try again.');
    }
  };

  return (
    <View className="flex-1 justify-end bg-black/40">
      <Pressable
        accessibilityLabel="Close"
        accessibilityRole="button"
        className="absolute inset-0"
        onPress={close}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        >
          <Card className="gap-4 p-5">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Typography.Heading type="h4">Save a link</Typography.Heading>
                <Typography type="body-sm" color="muted">
                  Paste a post or article. SmartSave reads it, files it, and sets the reminder.
                </Typography>
              </View>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                accessibilityLabel="Close"
                isDisabled={isAnalyzing}
                onPress={close}
              >
                <X size={18} color="#6A7080" />
              </Button>
            </View>

            <TextField isInvalid={error !== null}>
              <Input
                value={url}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isAnalyzing}
                inputMode="url"
                keyboardType="url"
                placeholder="https://"
                returnKeyType="done"
                onChangeText={(next: string) => {
                  setUrl(next);
                  if (error) setError(null);
                }}
                onSubmitEditing={() => void handleSave()}
              />
              {error ? <FieldError>{error}</FieldError> : null}
            </TextField>

            {platform && !isAnalyzing ? (
              <Typography type="body-xs" color="muted">
                {`Detected: ${platform.label}`}
              </Typography>
            ) : null}

            {isAnalyzing ? (
              <View className="bg-surface-secondary flex-row items-center gap-3 rounded-2xl p-4">
                <Spinner size="sm" />
                <Typography type="body-sm" weight="medium">
                  {stage}
                </Typography>
              </View>
            ) : (
              <View className="gap-2">
                <Typography type="body-xs" color="muted">
                  Or try an example
                </Typography>
                <View className="flex-row flex-wrap gap-2">
                  {EXAMPLES.map((example) => (
                    <Chip
                      key={example.label}
                      size="sm"
                      variant="secondary"
                      onPress={() => {
                        setUrl(example.url);
                        setError(null);
                      }}
                    >
                      <Chip.Label>{example.label}</Chip.Label>
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            <Button isDisabled={isAnalyzing} onPress={() => void handleSave()}>
              <Button.Label>{isAnalyzing ? 'Analyzing…' : 'Save and analyze'}</Button.Label>
            </Button>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

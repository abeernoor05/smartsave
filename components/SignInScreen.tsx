import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  Spinner,
  TextField,
  Typography,
} from 'heroui-native';
import { Bookmark, MailCheck } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useState } from 'react';

import { useAuth } from '@/lib/auth';

type Step = 'email' | 'code';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Passwordless sign-in: email address, then the 6-digit code we mail out. */
export function SignInScreen() {
  const { requestCode, confirmCode } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [didResend, setDidResend] = useState(false);

  const sendCode = async (isResend = false) => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setIsBusy(true);
    try {
      await requestCode(email);
      setStep('code');
      setDidResend(isResend);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send the code.');
    } finally {
      setIsBusy(false);
    }
  };

  const verify = async () => {
    if (code.trim().length < 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setError(null);
    setIsBusy(true);
    try {
      await confirmCode(email, code);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That code did not work.');
      setIsBusy(false);
    }
  };

  return (
    <View className="bg-background flex-1">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 }}
        >
          <View className="items-center gap-3">
            <View className="bg-accent size-14 items-center justify-center rounded-2xl">
              <Bookmark size={26} color="#FFFFFF" />
            </View>
            <Typography.Heading type="h3" align="center">
              SmartSave
            </Typography.Heading>
            <Typography type="body-sm" color="muted" align="center">
              Save any link and never miss the deadline hiding inside it.
            </Typography>
          </View>

          <Card className="gap-4 p-5">
            {step === 'email' ? (
              <>
                <View className="gap-1">
                  <Typography type="body" weight="semibold">
                    Sign in
                  </Typography>
                  <Typography type="body-xs" color="muted">
                    We email a 6-digit code — no password to remember.
                  </Typography>
                </View>

                <TextField isInvalid={error !== null}>
                  <Label>Email</Label>
                  <Input
                    value={email}
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    editable={!isBusy}
                    inputMode="email"
                    keyboardType="email-address"
                    placeholder="you@example.com"
                    returnKeyType="go"
                    onChangeText={(next: string) => {
                      setEmail(next);
                      if (error) setError(null);
                    }}
                    onSubmitEditing={() => void sendCode()}
                  />
                  {error ? <FieldError>{error}</FieldError> : null}
                </TextField>

                <Button isDisabled={isBusy} onPress={() => void sendCode()}>
                  {isBusy ? <Spinner size="sm" /> : null}
                  <Button.Label>{isBusy ? 'Sending…' : 'Email me a code'}</Button.Label>
                </Button>
              </>
            ) : (
              <>
                <View className="flex-row items-start gap-3">
                  <View className="bg-accent-soft size-10 items-center justify-center rounded-xl">
                    <MailCheck size={18} color="#4F46E5" />
                  </View>
                  <View className="flex-1 gap-1">
                    <Typography type="body" weight="semibold">
                      Check your email
                    </Typography>
                    <Typography type="body-xs" color="muted">
                      {`${didResend ? 'New code sent to' : 'We sent a 6-digit code to'} ${email.trim()}`}
                    </Typography>
                  </View>
                </View>

                <TextField isInvalid={error !== null}>
                  <Label>6-digit code</Label>
                  <Input
                    value={code}
                    autoComplete="one-time-code"
                    autoFocus
                    editable={!isBusy}
                    inputMode="numeric"
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="123456"
                    returnKeyType="go"
                    onChangeText={(next: string) => {
                      setCode(next.replace(/\D/g, ''));
                      if (error) setError(null);
                    }}
                    onSubmitEditing={() => void verify()}
                  />
                  {error ? <FieldError>{error}</FieldError> : null}
                </TextField>

                <Button isDisabled={isBusy} onPress={() => void verify()}>
                  {isBusy ? <Spinner size="sm" /> : null}
                  <Button.Label>{isBusy ? 'Checking…' : 'Sign in'}</Button.Label>
                </Button>

                <View className="flex-row justify-between gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    isDisabled={isBusy}
                    onPress={() => {
                      setStep('email');
                      setCode('');
                      setError(null);
                    }}
                  >
                    <Button.Label>Use another email</Button.Label>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    isDisabled={isBusy}
                    onPress={() => void sendCode(true)}
                  >
                    <Button.Label>Resend code</Button.Label>
                  </Button>
                </View>
              </>
            )}
          </Card>

          <Typography type="body-xs" color="muted" align="center">
            Your saved links are private to your account.
          </Typography>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

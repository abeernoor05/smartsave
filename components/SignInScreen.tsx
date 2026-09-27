import { useState } from 'react';
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
import { ArrowLeft, Mail, MailCheck } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { useAuth } from '@/lib/auth';
import { WELCOME_COLORS } from '@/lib/colors';

type Step = 'email' | 'code';
type SignInIntent = 'start' | 'signin';

type SignInScreenProps = {
  intent?: SignInIntent;
  onBack?: () => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const AUTH_BACKGROUND = '#080810';
const AUTH_INK = '#F8F7FF';
const AUTH_MUTED = '#B8B5C8';

/** Passwordless account creation and sign-in using a 6-digit email code. */
export function SignInScreen({ intent = 'signin', onBack }: SignInScreenProps) {
  const { requestCode, confirmCode } = useAuth();
  const [activeIntent, setActiveIntent] = useState<SignInIntent>(intent);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [didResend, setDidResend] = useState(false);

  const isSignUp = activeIntent === 'start';

  const sendCode = async (isResend = false) => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setIsBusy(true);
    try {
      await requestCode(email, isSignUp);
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

  const switchIntent = () => {
    setActiveIntent(isSignUp ? 'signin' : 'start');
    setStep('email');
    setCode('');
    setError(null);
    setDidResend(false);
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[AUTH_BACKGROUND, '#0B0B18', '#111128']}
        locations={[0, 0.58, 1]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[styles.glow, styles.glowTop]} />
      <View pointerEvents="none" style={[styles.glow, styles.glowBottom]} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.topBar}>
              {onBack && step === 'email' ? (
                <Button
                  accessibilityLabel="Back to welcome"
                  className="size-11 rounded-full border border-white/15 bg-white/10"
                  isIconOnly
                  variant="ghost"
                  onPress={onBack}
                >
                  <ArrowLeft color={AUTH_INK} size={21} />
                </Button>
              ) : step === 'code' ? (
                <Button
                  accessibilityLabel="Back to email"
                  className="size-11 rounded-full border border-white/15 bg-white/10"
                  isIconOnly
                  variant="ghost"
                  onPress={() => {
                    setStep('email');
                    setCode('');
                    setError(null);
                  }}
                >
                  <ArrowLeft color={AUTH_INK} size={21} />
                </Button>
              ) : (
                <View style={styles.topBarPlaceholder} />
              )}

              <View style={styles.brandMark}>
                <View style={styles.folderIcon}>
                  <View style={styles.folderTab} />
                  <View style={styles.folderBody} />
                </View>
              </View>
            </View>

            <View style={styles.headingBlock}>
              <Typography.Heading className="text-white" type="h2" weight="bold">
                {step === 'code'
                  ? 'Check your email'
                  : isSignUp
                    ? 'Create your account'
                    : 'Welcome back'}
              </Typography.Heading>
              <Typography className="text-[#B8B5C8]" type="body">
                {step === 'code'
                  ? `${didResend ? 'A new code was sent to' : 'Enter the 6-digit code sent to'} ${email.trim()}`
                  : isSignUp
                    ? 'Start saving links and keep every deadline in one place.'
                    : 'Log in to continue to your saved links.'}
              </Typography>
            </View>

            <View style={styles.cardShadow}>
              <Card className="gap-5 rounded-[28px] border border-white/15 bg-white/10 p-5">
                {step === 'email' ? (
                  <>
                    <TextField isInvalid={error !== null}>
                      <Label>
                        <Mail color={AUTH_MUTED} size={16} />
                        <Label.Text className="text-[#E7E5EF]">Email</Label.Text>
                      </Label>
                      <Input
                        accessibilityLabel="Email"
                        className="h-14 rounded-2xl border-white bg-white px-4 text-[#17151F]"
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

                    <Button
                      className="h-14 rounded-2xl bg-white"
                      isDisabled={isBusy}
                      onPress={() => void sendCode()}
                    >
                      {isBusy ? <Spinner size="sm" /> : null}
                      <Button.Label className="text-[#24134F]">
                        {isBusy ? 'Sending…' : isSignUp ? 'Create account' : 'Log in'}
                      </Button.Label>
                    </Button>
                  </>
                ) : (
                  <>
                    <View style={styles.codeNotice}>
                      <View style={styles.codeIcon}>
                        <MailCheck color={WELCOME_COLORS.violetGlow} size={20} />
                      </View>
                      <Typography className="flex-1 text-[#E7E5EF]" type="body-sm">
                        Codes expire shortly. Check your spam folder if it does not arrive.
                      </Typography>
                    </View>

                    <TextField isInvalid={error !== null}>
                      <Label>
                        <Label.Text className="text-[#E7E5EF]">6-digit code</Label.Text>
                      </Label>
                      <Input
                        accessibilityLabel="6-digit code"
                        className="h-14 rounded-2xl border-white bg-white px-4 text-center text-xl tracking-[8px] text-[#17151F]"
                        value={code}
                        autoComplete="one-time-code"
                        autoFocus
                        editable={!isBusy}
                        inputMode="numeric"
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholder="000000"
                        returnKeyType="go"
                        onChangeText={(next: string) => {
                          setCode(next.replace(/\D/g, ''));
                          if (error) setError(null);
                        }}
                        onSubmitEditing={() => void verify()}
                      />
                      {error ? <FieldError>{error}</FieldError> : null}
                    </TextField>

                    <Button
                      className="h-14 rounded-2xl bg-white"
                      isDisabled={isBusy}
                      onPress={() => void verify()}
                    >
                      {isBusy ? <Spinner size="sm" /> : null}
                      <Button.Label className="text-[#24134F]">
                        {isBusy ? 'Checking…' : isSignUp ? 'Finish sign up' : 'Log in'}
                      </Button.Label>
                    </Button>

                    <Button
                      className="self-center"
                      size="sm"
                      variant="ghost"
                      isDisabled={isBusy}
                      onPress={() => void sendCode(true)}
                    >
                      <Button.Label className="text-white">Resend code</Button.Label>
                    </Button>
                  </>
                )}
              </Card>
            </View>

            {step === 'email' ? (
              <Button className="self-center" variant="ghost" onPress={switchIntent}>
                <Button.Label className="text-white">
                  {isSignUp ? 'Already have an account? Log in' : 'New to Smart Save? Sign up'}
                </Button.Label>
              </Button>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AUTH_BACKGROUND,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 22,
    gap: 24,
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(117, 103, 244, 0.1)',
  },
  glowTop: {
    top: -100,
    right: -100,
  },
  glowBottom: {
    bottom: -110,
    left: -110,
  },
  topBar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarPlaceholder: {
    width: 44,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.09)',
    shadowColor: WELCOME_COLORS.violetGlow,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
  },
  folderIcon: {
    width: 22,
    height: 17,
    position: 'relative',
  },
  folderTab: {
    position: 'absolute',
    top: 1,
    left: 2,
    width: 10,
    height: 6,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: WELCOME_COLORS.violetGlow,
  },
  folderBody: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 13,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: WELCOME_COLORS.white,
    backgroundColor: 'rgba(117,103,244,0.24)',
  },
  headingBlock: {
    gap: 9,
  },
  cardShadow: {
    borderRadius: 28,
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  codeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(117, 103, 244, 0.18)',
  },
});

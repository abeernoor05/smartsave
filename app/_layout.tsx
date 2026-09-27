// oxlint-disable-next-line eslint-plugin-import/no-unassigned-import
import '../global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { useEffect, useState, type ReactNode } from 'react';
import * as DevClient from 'expo-dev-client';
import { HeroUINativeProvider, Spinner, useThemeColor } from 'heroui-native';
import { Uniwind } from 'uniwind';
import {
  ErrorBoundary as ExpoErrorBoundary,
  type ErrorBoundaryProps,
  SplashScreen,
  Stack,
} from 'expo-router';

import { initPostHog } from '@/lib/posthog';
import { registerServiceWorker } from '@/lib/registerServiceWorker';
import { reportErrorToParent } from '@/lib/reportPreviewError';
import { AuthProvider, useAuth } from '@/lib/auth';
import { clearScheduledReminders } from '@/lib/reminders';
import { useSmartSaveStore } from '@/lib/store';
import { useReminderSync } from '@/hooks/useReminderSync';
import { AppBackground } from '@/components/AppBackground';
import { InstallPrompt } from '@/components/InstallPrompt';
import { LaunchFlow } from '@/components/LaunchFlow';
import { SignInScreen } from '@/components/SignInScreen';

/**
 * Custom ErrorBoundary that reports React render errors to the parent window (Bilt preview iframe)
 * and then renders the default Expo error UI.
 */
function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    if (Platform.OS === 'web' && error) {
      const message = [error.message, error.stack].filter(Boolean).join('\n');
      reportErrorToParent(message);
    }
  }, [error]);
  return <ExpoErrorBoundary error={error} retry={retry} />;
}

export { ErrorBoundary };

// Starter is light-only by default. Remove this when implementing requested dark mode.
Uniwind.setTheme('light');

void SplashScreen.preventAutoHideAsync();

function AppStack() {
  const foreground = useThemeColor('foreground');

  return (
    <View className="flex-1">
      <AppBackground />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#080A14' },
          headerTintColor: foreground,
          headerTitleStyle: { color: foreground },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-link"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen name="folder/[category]" options={{ title: 'Folder' }} />
        <Stack.Screen name="item/[id]" options={{ title: 'Saved item' }} />
        <Stack.Screen name="search" options={{ title: 'Search' }} />
        <Stack.Screen name="notifications" options={{ title: 'Reminders sent' }} />
      </Stack>
    </View>
  );
}

/** Nothing renders until we know who is signed in; their items load right after. */
function AuthGate() {
  const { session, isLoading } = useAuth();
  const [authIntent, setAuthIntent] = useState<'start' | 'signin' | null>(null);
  const userId = session?.user.id ?? null;
  const loadItems = useSmartSaveStore((state) => state.loadItems);
  const clearItems = useSmartSaveStore((state) => state.clear);

  useReminderSync(userId !== null);

  useEffect(() => {
    if (userId) {
      void loadItems();
    } else {
      clearItems();
      void clearScheduledReminders();
    }
  }, [userId, loadItems, clearItems]);

  let content: ReactNode;
  let statusBarStyle: 'light' | 'dark' = 'dark';

  if (isLoading) {
    content = (
      <View className="flex-1 items-center justify-center">
        <AppBackground />
        <Spinner />
      </View>
    );
  } else if (!session) {
    if (authIntent) {
      statusBarStyle = 'light';
      content = <SignInScreen intent={authIntent} onBack={() => setAuthIntent(null)} />;
    } else {
      statusBarStyle = 'light';
      content = (
        <LaunchFlow
          onGetStarted={() => setAuthIntent('start')}
          onSignIn={() => setAuthIntent('signin')}
        />
      );
    }
  } else {
    content = <AppStack />;
    statusBarStyle = 'light';
  }

  return (
    <>
      <StatusBar style={statusBarStyle} translucent backgroundColor="transparent" />
      {content}
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Report uncaught JS errors and unhandled promise rejections to parent (Bilt preview iframe)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    const handleError = (event: ErrorEvent) => {
      const message = event.error?.stack ?? event.message ?? 'Unknown error';
      reportErrorToParent(message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const err = event.reason;
      const message =
        err instanceof Error ? [err.message, err.stack].filter(Boolean).join('\n') : String(err);
      reportErrorToParent(message);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Inject Google Fonts link tag for web to ensure fonts load through proxy
  // Also register font family names as fallback if expo-font fails
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Check if link already exists
      const existingLink = document.querySelector(
        'link[href*="fonts.googleapis.com/css2?family=Inter"]',
      );

      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }

      // Note: The @import in global.css and the link tag above ensure Inter font loads
      // expo-font will register the font family names (Inter_400Regular, etc.)
      // If expo-font fails due to proxy issues, the fonts should still be available
      // via the direct Google Fonts CDN link, though the specific font family names
      // might not be registered. The app should still render with Inter font.
    }
  }, []);

  useEffect(() => {
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (__DEV__ && Platform.OS !== 'web' && !isExpoGo) {
      const timer = setTimeout(() => {
        DevClient.closeMenu();
        DevClient.hideMenu();
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      initPostHog();
    }
  }, []);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
        <InstallPrompt />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}

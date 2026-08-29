import AsyncStorage from '@react-native-async-storage/async-storage';
import { asyncStorage, createClient } from '@biltme/backend';

const url = process.env.EXPO_PUBLIC_BILT_URL;
const anonKey = process.env.EXPO_PUBLIC_BILT_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Backend is not configured: EXPO_PUBLIC_BILT_URL / EXPO_PUBLIC_BILT_ANON_KEY.');
}

/** Single shared client for the database, auth, and server functions. */
export const bilt = createClient(url, anonKey, {
  auth: {
    storage: asyncStorage(AsyncStorage),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

/** Turns a Postgres/network failure into something worth showing a person. */
export function backendErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message);
    if (message.toLowerCase().includes('failed to fetch')) {
      return 'No connection to SmartSave. Check your network and try again.';
    }
    if (message.toLowerCase().includes('row-level security')) {
      return 'You are not signed in any more. Sign in again to continue.';
    }
    return message;
  }
  return fallback;
}

import type { NotificationsAdapter } from '@/lib/notifications.types';

/**
 * Browsers have no reminder scheduler we can hand a future date to, so every
 * call is a no-op and `isSupported` keeps the scheduler from running at all.
 */
export const notifications: NotificationsAdapter = {
  isSupported: false,
  ensurePermission: () => Promise.resolve(false),
  ensureChannel: () => Promise.resolve(),
  present: () => Promise.resolve(),
  scheduleAt: () => Promise.resolve(''),
  cancel: () => Promise.resolve(),
  cancelAll: () => Promise.resolve(),
  lastTappedData: () => Promise.resolve(null),
  onTap: () => () => {},
};

/**
 * Web Push types (Sprint 27).
 *
 * Mirrors browser PushSubscription.toJSON() shape.
 */

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type PushNotificationPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  /**
   * If true, browser shows even if same tag already visible (no replace).
   * Default = replace.
   */
  renotify?: boolean;
};

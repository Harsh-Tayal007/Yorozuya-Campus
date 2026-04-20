/**
 * PushNotificationToggle.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Place at: src/components/settings/PushNotificationToggle.jsx
 *
 * Drop this anywhere in your DashboardSettings page:
 *   <PushNotificationToggle />
 */

import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function PushNotificationToggle() {
  const { supported, subscribed, permission, loading, subscribe, unsubscribe } =
    usePushNotifications();

  if (!supported) {
    return (
      <div className="flex items-center justify-between py-3">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">Push Notifications</p>
          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
            Not supported in this browser.
          </p>
        </div>
      </div>
    );
  }

  const denied = permission === "denied";

  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0 flex-1 pr-4">
        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">Push Notifications</p>
        <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
          {denied
            ? "Blocked in browser settings. Click the lock icon in your address bar to allow."
            : subscribed
            ? "You'll receive notifications even when the tab is closed."
            : "Get notified about replies, mentions, and follows - even with the tab closed."}
        </p>
      </div>

      {denied ? (
        <span className="text-xs text-rose-500 dark:text-rose-400 font-medium flex-shrink-0">Blocked</span>
      ) : (
        <button
          onClick={subscribed ? unsubscribe : subscribe}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                      transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${subscribed ? "bg-violet-500" : "bg-gray-200 dark:bg-zinc-700"}`}
          role="switch"
          aria-checked={subscribed}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full
                        bg-white shadow ring-0 transition duration-200 ease-in-out
                        ${subscribed ? "translate-x-5" : "translate-x-0"}`}
          />
        </button>
      )}
    </div>
  );
}
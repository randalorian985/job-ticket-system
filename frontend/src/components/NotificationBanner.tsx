import type { Notification } from '../features/notifications/NotificationContext'
import { useNotification } from '../features/notifications/NotificationContext'

export function NotificationBanner() {
  const { notifications, dismiss } = useNotification()

  if (notifications.length === 0) return null

  return (
    <div className="notification-banner-stack" role="alert" aria-live="assertive">
      {notifications.map((n: Notification) => (
        <div key={n.id} className={`notification-banner notification-banner--${n.type}`}>
          <span className="notification-banner__message">{n.message}</span>
          <button
            className="notification-banner__close"
            onClick={() => dismiss(n.id)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

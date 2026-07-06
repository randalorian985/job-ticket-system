import { createContext, useCallback, useContext, useRef, useState } from 'react'

export type NotificationType = 'error' | 'success' | 'warning' | 'info'

export type Notification = {
  id: string
  type: NotificationType
  message: string
}

type NotificationContextValue = {
  notifications: Notification[]
  notify: (message: string, type?: NotificationType) => void
  dismiss: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const timerRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: string) => {
    clearTimeout(timerRefs.current[id])
    delete timerRefs.current[id]
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, type: NotificationType = 'error') => {
      const id = `${Date.now()}-${Math.random()}`
      setNotifications((prev) => [...prev.filter((n) => n.type !== type || n.message !== message), { id, type, message }])

      // Auto-dismiss success/info after 5 s; warning after 8 s; errors stay until dismissed
      const delay = type === 'success' || type === 'info' ? 5000 : type === 'warning' ? 8000 : 0
      if (delay > 0) {
        timerRefs.current[id] = setTimeout(() => dismiss(id), delay)
      }
    },
    [dismiss]
  )

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotification must be used inside NotificationProvider')
  return ctx
}

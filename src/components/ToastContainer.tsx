import { useToastStore } from '../state/useToastStore'

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <div className="toast" key={t.id}>
          {t.message}
        </div>
      ))}
    </div>
  )
}

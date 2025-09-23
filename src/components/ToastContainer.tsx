import { useToastStore } from '../state/useToastStore'

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 flex flex-col gap-2 z-50"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="px-4 py-2 rounded-lg bg-cyan-700 text-white shadow-lg animate-fade-in"
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

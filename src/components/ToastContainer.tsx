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
          className="rounded-md border px-4 py-2 text-sm"
          style={{
            borderColor: 'var(--hairline)',
            background: 'rgba(8, 15, 18, 0.92)',
            color: 'var(--vfd)',
            boxShadow: '0 0 18px var(--glow-soft)',
            letterSpacing: '0.04em',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

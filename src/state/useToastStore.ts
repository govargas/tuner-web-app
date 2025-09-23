import { create } from 'zustand'

type Toast = {
  id: number
  message: string
}

type ToastState = {
  toasts: Toast[]
  push: (message: string) => void
  remove: (id: number) => void
}

let counter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message) => {
    const id = ++counter
    set((s) => ({ toasts: [...s.toasts, { id, message }] }))
    // Auto-remove after 3s
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

'use client'

import { cn } from '@/lib/utils'

export default function GlassCard({
  className,
  children,
  variant = 'default',
}: {
  className?: string
  children: React.ReactNode
  variant?: 'default' | 'mint'
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4',
        'backdrop-blur-md transition-all duration-200',
        'before:absolute before:inset-0 before:pointer-events-none before:rounded-2xl',
        'before:bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.00))] before:opacity-40',
        variant === 'mint'
          ? 'bg-[rgba(45,212,191,0.06)] border-[rgba(45,212,191,0.15)] shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:bg-[rgba(45,212,191,0.08)]'
          : 'bg-white/[0.08] border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-white/[0.10]',
        className
      )}
    >
      {children}
    </div>
  )
}

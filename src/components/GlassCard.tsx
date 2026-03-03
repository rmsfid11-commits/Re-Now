'use client'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'mint'
}

export default function GlassCard({ children, className = '', variant = 'default' }: GlassCardProps) {
  const base = variant === 'mint' ? 'glass-card-mint' : 'glass-card'
  return (
    <div className={`${base} p-4 ${className}`}>
      {children}
    </div>
  )
}

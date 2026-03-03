'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const tabs = [
  {
    href: '/today',
    label: '오늘',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3B82F6' : '#6b7280'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: '/decision',
    label: '결정',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3B82F6' : '#6b7280'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    href: '/review',
    label: '복기',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3B82F6' : '#6b7280'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 010-4h14v4" />
        <path d="M3 5v14a2 2 0 002 2h16v-5" />
        <path d="M18 12a2 2 0 000 4h4v-4h-4z" />
      </svg>
    ),
  },
  {
    href: '/dream',
    label: 'Dream',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#2DD4BF' : '#6b7280'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a6 6 0 009 5.197A6 6 0 1112 21V3z" />
      </svg>
    ),
  },
]

export default function TabBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 bg-[#0B0F19]/80 backdrop-blur-xl border-t border-white/5 pb-safe">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href)
        const color = active
          ? tab.href === '/dream' ? '#2DD4BF' : '#3B82F6'
          : '#6b7280'

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-0.5 py-1 px-3 min-w-[56px]"
          >
            {tab.icon(active)}
            <span
              className="text-[10px] font-medium"
              style={{ color }}
            >
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

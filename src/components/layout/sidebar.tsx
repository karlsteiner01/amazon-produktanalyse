'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AppLogo } from '@/components/layout/app-logo'
import {
  LayoutDashboard,
  Package,
  FileText,
  Upload,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Übersicht', href: '/', icon: LayoutDashboard },
  { label: 'Produkte', href: '/produkte', icon: Package },
  { label: 'Analysen', href: '/analysen', icon: FileText },
  { label: 'Import', href: '/import', icon: Upload },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-x-3 bottom-3 z-40 flex rounded-lg border border-border bg-card shadow-lg shadow-slate-950/10 dark:shadow-black/30 lg:inset-y-0 lg:left-0 lg:right-auto lg:bottom-auto lg:w-72 lg:flex-col lg:rounded-none lg:border-y-0 lg:border-l-0 lg:bg-sidebar lg:text-sidebar-foreground lg:shadow-none">
      <div className="hidden border-b border-sidebar-border px-5 py-5 lg:block">
        <AppLogo />
      </div>

      <nav className="grid flex-1 grid-cols-4 gap-1 p-1.5 lg:block lg:space-y-1.5 lg:p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/'
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link key={item.href} href={item.href} className="min-w-0">
              <Button
                variant="ghost"
                className={cn(
                  'h-14 w-full flex-col gap-1 rounded-md px-1 text-[11px] font-medium text-muted-foreground lg:h-10 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm lg:text-muted-foreground dark:lg:text-sidebar-foreground/68',
                  isActive && 'bg-primary/15 text-foreground lg:bg-sidebar-accent lg:text-sidebar-accent-foreground'
                )}
              >
                <Icon className={cn('size-4', isActive && 'text-primary lg:text-sidebar-primary')} />
                <span className="truncate">{item.label}</span>
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="hidden border-t border-sidebar-border p-4 lg:block">
        <div className="rounded-lg border border-sidebar-border bg-muted/45 p-3 dark:bg-white/5">
          <p className="text-xs font-medium">v1.0</p>
          <p className="mt-1 text-xs text-muted-foreground dark:text-sidebar-foreground/55">
            Lokale CSV-Analyse mit Supabase-Speicher.
          </p>
        </div>
      </div>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ModeToggle } from './mode-toggle'
import {
  LayoutDashboard,
  Package,
  FileText,
  Upload,
  LineChart,
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
    <aside className="fixed left-0 top-0 z-30 flex h-full w-56 flex-col border-r bg-white dark:bg-zinc-950 dark:border-zinc-800">
      <div className="flex h-14 items-center gap-2 border-b px-5 dark:border-zinc-800">
        <LineChart className="h-5 w-5 text-blue-600" />
        <span className="font-semibold text-sm">Amazon Produktanalyse</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 text-sm font-normal h-9',
                  isActive && 'bg-zinc-100 dark:bg-zinc-800 font-medium'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      <Separator />

      <div className="flex items-center justify-between p-3">
        <span className="text-xs text-zinc-400">v1.0</span>
        <ModeToggle />
      </div>
    </aside>
  )
}

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Product, Analysis } from '@/types'

interface MarketOverviewProps {
  products: (Product & { analysis?: Analysis })[]
}

export function MarketOverview({ products }: MarketOverviewProps) {
  const totalSales = products.reduce((s, p) => s + (p.asin_sales ?? 0), 0)
  const avgReviews = products.reduce((s, p) => s + (p.review_count ?? 0), 0) / (products.length || 1)
  const fbaCount = products.filter((p) => p.is_fba).length

  const demandLevel = totalSales > 5000 ? 'Hoch' : totalSales > 2000 ? 'Mittel' : 'Niedrig'
  const compLevel = avgReviews > 500 ? 'Hoch' : avgReviews > 100 ? 'Mittel' : 'Niedrig'
  const fbaLevel = fbaCount / (products.length || 1) > 0.7 ? 'Hoch' : 'Mittel'
  const aCount = products.filter((p) => p.analysis?.product_tier === 'A').length

  function LevelBadge({ level, goodUp }: { level: string; goodUp: boolean }) {
    const isGood = goodUp
      ? level === 'Hoch'
      : level === 'Niedrig'
    const isMid = level === 'Mittel'
    const color = isGood ? '#10b981' : isMid ? '#f59e0b' : '#ef4444'

    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-medium"
        style={{ color }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        {level}
      </span>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Nachfrage</p>
            <LevelBadge level={demandLevel} goodUp />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Konkurrenz</p>
            <LevelBadge level={compLevel} goodUp={false} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">FBA Dichte</p>
            <LevelBadge level={fbaLevel} goodUp />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">A-Kandidaten</p>
            <span className="text-sm font-semibold">{aCount}</span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

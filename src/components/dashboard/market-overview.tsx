'use client'

import { Progress } from '@/components/ui/progress'
import type { Product, Analysis } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Activity, ShieldCheck } from 'lucide-react'

interface MarketOverviewProps {
  products: (Product & { analysis?: Analysis })[]
}

export function MarketOverview({ products }: MarketOverviewProps) {
  const totalSales = products.reduce((s, p) => s + (p.asin_sales ?? 0), 0)
  const avgReviews = products.reduce((s, p) => s + (p.review_count ?? 0), 0) / (products.length || 1)
  const fbaCount = products.filter((p) => p.is_fba).length
  const fbaShare = Math.round((fbaCount / (products.length || 1)) * 100)

  const demandLevel = totalSales > 5000 ? 'Hoch' : totalSales > 2000 ? 'Mittel' : 'Niedrig'
  const compLevel = avgReviews > 500 ? 'Hoch' : avgReviews > 100 ? 'Mittel' : 'Niedrig'
  const fbaLevel = fbaCount / (products.length || 1) > 0.7 ? 'Hoch' : 'Mittel'
  const aCount = products.filter((p) => p.analysis?.product_tier === 'A').length
  const demandPercent = Math.min(Math.round((totalSales / 7000) * 100), 100)
  const competitionPercent = Math.min(Math.round((avgReviews / 700) * 100), 100)
  const candidatePercent = Math.min(Math.round((aCount / (products.length || 1)) * 100), 100)
  const signals = [
    {
      label: 'Gesamtnachfrage',
      value: demandLevel,
      helper: `${new Intl.NumberFormat('de-DE').format(totalSales)} Verkäufe`,
      progress: demandPercent,
      badge: demandLevel === 'Hoch' ? 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-300 dark:border-emerald-900 dark:bg-emerald-950/30' : demandLevel === 'Mittel' ? 'text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-300 dark:border-amber-900 dark:bg-amber-950/30' : 'text-red-700 border-red-200 bg-red-50 dark:text-red-300 dark:border-red-900 dark:bg-red-950/30',
    },
    {
      label: 'Konkurrenzdruck',
      value: compLevel,
      helper: `${Math.round(avgReviews)} Reviews im Schnitt`,
      progress: competitionPercent,
      badge: compLevel === 'Niedrig' ? 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-300 dark:border-emerald-900 dark:bg-emerald-950/30' : compLevel === 'Mittel' ? 'text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-300 dark:border-amber-900 dark:bg-amber-950/30' : 'text-red-700 border-red-200 bg-red-50 dark:text-red-300 dark:border-red-900 dark:bg-red-950/30',
    },
    {
      label: 'FBA Anteil',
      value: fbaLevel,
      helper: `${fbaShare}% der Produkte`,
      progress: fbaShare,
      badge: 'text-sky-700 border-sky-200 bg-sky-50 dark:text-sky-300 dark:border-sky-900 dark:bg-sky-950/30',
    },
    {
      label: 'A-Kandidaten',
      value: `${aCount}`,
      helper: `${candidatePercent}% der Liste`,
      progress: candidatePercent,
      badge: 'text-violet-700 border-violet-200 bg-violet-50 dark:text-violet-300 dark:border-violet-900 dark:bg-violet-950/30',
    },
  ]

  return (
    <section className="panel p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Market Overview</h3>
          <p className="text-xs text-muted-foreground">Schnelle Einordnung des aktiven Imports</p>
        </div>
        <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Activity className="size-4" />
        </div>
      </div>
      <div className="space-y-3">
        {signals.map((signal) => (
          <div key={signal.label} className="rounded-lg border border-border/80 bg-muted/25 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium">{signal.label}</p>
                <p className="truncate text-xs text-muted-foreground">{signal.helper}</p>
              </div>
              <Badge variant="outline" className={signal.badge}>
                {signal.value}
              </Badge>
            </div>
            <Progress value={signal.progress} className="h-1.5" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/80 bg-background/60 p-3">
        <ShieldCheck className="mt-0.5 size-4 text-emerald-600 dark:text-emerald-300" />
        <p className="text-xs leading-5 text-muted-foreground">
          Niedriger Review-Druck plus sichtbare Nachfrage ist der stärkste Startpunkt für die Detailprüfung.
        </p>
      </div>
    </section>
  )
}

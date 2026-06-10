'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useData } from '@/lib/store'
import { tierColor, tierLabel, playColor, playLabel } from '@/lib/scoring'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProductThumb } from '@/components/product-thumb'
import { Brain, Trophy, Target, Gauge, FileText } from 'lucide-react'

const PLAYS = ['all', 'Verkaufen', 'Verbessern', 'Beides', 'Meiden'] as const

export default function AnalysenPage() {
  const router = useRouter()
  const { ready, imports, parents } = useData()
  const [playFilter, setPlayFilter] = useState<(typeof PLAYS)[number]>('all')

  if (!ready) {
    return <div className="panel p-8"><p className="text-sm text-muted-foreground">Lade Analysen…</p></div>
  }

  if (imports.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold sm:text-3xl">Analysen</h2>
        <div className="panel flex flex-col items-center p-12 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileText className="size-5" />
          </div>
          <p className="text-sm font-medium">Noch keine Analysen</p>
          <p className="mt-1 text-xs text-muted-foreground">Importiere zuerst einen Helium-10 Export.</p>
          <Button className="mt-4 h-9" onClick={() => router.push('/')}>Zur Übersicht</Button>
        </div>
      </div>
    )
  }

  const bestScore = parents[0]?.scores.opportunity_score ?? 0
  const aCount = parents.filter((p) => p.scores.product_tier === 'A').length
  const avgScore = parents.length
    ? Math.round(parents.reduce((s, p) => s + p.scores.opportunity_score, 0) / parents.length)
    : 0

  const filtered = parents.filter((p) => playFilter === 'all' || p.scores.play === playFilter)

  const stats = [
    { label: 'Produkte', value: parents.length, icon: Brain },
    { label: 'Bester Score', value: bestScore, icon: Trophy },
    { label: 'Top-Kandidaten', value: aCount, icon: Target },
    { label: 'Ø Score', value: avgScore, icon: Gauge },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Priorisierung</p>
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Analysen</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Alle Produkte nach Opportunity-Score sortiert, mit empfohlener Strategie.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="panel flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon className="size-5" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {PLAYS.map((t) => (
          <Button
            key={t}
            variant={playFilter === t ? 'secondary' : 'ghost'}
            size="sm"
            className={`h-8 text-xs ${playFilter === t ? '' : 'text-muted-foreground'}`}
            onClick={() => setPlayFilter(t)}
          >
            {t === 'all' ? 'Alle' : playLabel(t)}
          </Button>
        ))}
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b border-border bg-muted/35 px-4 py-3">
          <h3 className="text-sm font-semibold">Ranking</h3>
          <p className="text-xs text-muted-foreground">{filtered.length} Produkte</p>
        </div>
        <div className="divide-y divide-border">
          {filtered.map((p, index) => {
            const s = p.scores
            return (
              <button
                key={p.key}
                type="button"
                className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                onClick={() => router.push(`/produkte/${p.representative.asin}`)}
              >
                <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-sm font-semibold tabular-nums">
                  {index + 1}
                </div>
                <div className="flex min-w-0 items-center gap-3">
                  <ProductThumb src={p.representative.image_url} title={p.representative.product_details} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.representative.product_details}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {p.representative.brand || 'Keine Marke'} · {p.sales.toLocaleString('de-DE')} Verk./Mo
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden text-right sm:block">
                    <p className="text-[10px] text-muted-foreground">Verk · Verb</p>
                    <p className="text-xs font-medium tabular-nums">
                      <span style={{ color: '#0ea5e9' }}>{s.sell_score}</span>
                      {' · '}
                      <span style={{ color: '#8b5cf6' }}>{s.improve_score}</span>
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="hidden text-[10px] sm:inline-flex"
                    style={{ backgroundColor: playColor(s.play) + '1a', color: playColor(s.play), borderColor: playColor(s.play) + '40' }}
                  >
                    {playLabel(s.play)}
                  </Badge>
                  <div className="w-12 text-right">
                    <p className="text-lg font-bold tabular-nums" style={{ color: tierColor(s.product_tier) }}>
                      {s.opportunity_score}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{tierLabel(s.product_tier)}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

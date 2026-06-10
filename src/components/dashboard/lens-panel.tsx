'use client'

import { useRouter } from 'next/navigation'
import type { ScoredParent } from '@/lib/scoring'
import { ProductThumb } from '@/components/product-thumb'
import { ShoppingCart, Sparkles, ArrowUpRight } from 'lucide-react'

interface LensPanelProps {
  lens: 'sell' | 'improve'
  parents: ScoredParent[]
}

const fmt = new Intl.NumberFormat('de-DE')

export function LensPanel({ lens, parents }: LensPanelProps) {
  const router = useRouter()
  const sell = lens === 'sell'
  const scoreOf = (p: ScoredParent) =>
    sell ? p.scores.sell_score : p.scores.improve_score

  const top = [...parents].sort((a, b) => scoreOf(b) - scoreOf(a)).slice(0, 5)

  const color = sell ? '#0ea5e9' : '#8b5cf6'
  const Icon = sell ? ShoppingCart : Sparkles
  const title = sell ? 'Sofort verkaufen' : 'Verbessern & verkaufen'
  const subtitle = sell
    ? 'Nachfrage da, Konkurrenz schwach genug zum Einsteigen'
    : 'Nachfrage da, Platzhirsch über Bewertung/Listing schlagbar'

  return (
    <section className="panel flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border/80 px-4 py-3">
        <div
          className="flex size-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: color + '1f', color }}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{title}</h3>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {top.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6 text-xs text-muted-foreground">
          Keine Kandidaten.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {top.map((p, i) => {
            const s = p.scores
            const score = scoreOf(p)
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => router.push(`/produkte/${p.representative.asin}`)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50"
              >
                <span className="w-4 shrink-0 text-center text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <ProductThumb src={p.representative.image_url} title={p.representative.product_details} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-5">
                    {p.representative.product_details || p.representative.asin}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {sell
                      ? `${fmt.format(p.sales)} Verk./Mo · ${fmt.format(p.review_count)} Reviews · ${s.margin_eur != null ? s.margin_eur.toFixed(2) + ' € Marge' : '–'}`
                      : `${p.rating ?? '–'}★ · ${fmt.format(p.review_count)} Reviews · Verb.-Pot. ${s.improvement_score}`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold leading-none tabular-nums" style={{ color }}>
                    {score}
                  </p>
                  <p className="text-[10px] text-muted-foreground">/ 100</p>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

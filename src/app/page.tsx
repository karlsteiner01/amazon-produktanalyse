'use client'

import { useRouter } from 'next/navigation'
import { useData } from '@/lib/store'
import { UploadCsv } from '@/components/dashboard/upload-csv'
import { LensPanel } from '@/components/dashboard/lens-panel'
import { OpportunityScatter } from '@/components/dashboard/opportunity-scatter'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Boxes,
  Euro,
  ShoppingCart,
  Sparkles,
  Target,
  ArrowRight,
  PackageSearch,
  TrendingUp,
} from 'lucide-react'

const fmtNum = new Intl.NumberFormat('de-DE')

export default function DashboardPage() {
  const router = useRouter()
  const { ready, imports, parents, scopedProducts, config } = useData()

  if (!ready) {
    return (
      <div className="panel p-8">
        <p className="text-sm text-muted-foreground">Lade Daten…</p>
      </div>
    )
  }

  // --- Leerzustand: noch kein Import ---
  if (imports.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Übersicht</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Welcher Markt lohnt sich?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Lade einen Helium-10 Xray-Export hoch. Die App findet automatisch Produkte, die
            du <strong>sofort verkaufen</strong> kannst — und solche, die du <strong>verbessern</strong> und
            dann verkaufen kannst.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="panel flex min-h-[320px] items-center p-8">
            <div>
              <div className="mb-5 flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <PackageSearch className="size-6" />
              </div>
              <h3 className="text-xl font-semibold">In 3 Schritten zur Entscheidung</h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ['01', 'CSV importieren', 'Helium-10 Xray Export'],
                  ['02', 'Auto-Analyse', 'Scores & Strategie je Produkt'],
                  ['03', 'Chancen prüfen', 'Verkaufen oder verbessern'],
                ].map(([n, t, d]) => (
                  <div key={n} className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="text-xs font-semibold text-primary">{n}</p>
                    <p className="mt-1 text-sm font-medium">{t}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <UploadCsv />
        </div>
      </div>
    )
  }

  // --- KPIs (auf Eltern-Produkt-Ebene) ---
  const productCount = parents.length
  const totalSales = parents.reduce((s, p) => s + p.sales, 0)
  const marginPcts = parents.map((p) => p.scores.margin_pct).filter((v): v is number => v != null)
  const avgMarginPct = marginPcts.length
    ? Math.round(marginPcts.reduce((s, v) => s + v, 0) / marginPcts.length)
    : 0
  const aCount = parents.filter((p) => p.scores.product_tier === 'A').length
  const sellReady = parents.filter((p) => p.scores.play === 'Verkaufen' || p.scores.play === 'Beides').length
  const improveReady = parents.filter((p) => p.scores.play === 'Verbessern' || p.scores.play === 'Beides').length

  const kpis = [
    { label: 'Produkte', value: fmtNum.format(productCount), helper: `${fmtNum.format(scopedProducts.length)} ASINs (Varianten zusammengefasst)`, icon: Boxes, tone: 'text-sky-600 dark:text-sky-300' },
    { label: 'Nachfrage gesamt', value: fmtNum.format(totalSales), helper: 'geschätzte Verkäufe / Monat', icon: ShoppingCart, tone: 'text-emerald-600 dark:text-emerald-300' },
    { label: 'Ø Marge', value: `${avgMarginPct}%`, helper: `bei ${Math.round(config.cogsPct * 100)}% Wareneinsatz`, icon: Euro, tone: 'text-amber-600 dark:text-amber-300' },
    { label: 'Top-Kandidaten', value: fmtNum.format(aCount), helper: 'Tier A', icon: Target, tone: 'text-violet-600 dark:text-violet-300' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Übersicht</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Marktüberblick</h2>
        </div>
      </div>

      {/* Entscheidungs-Banner */}
      <div className="panel flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <p className="text-xs text-muted-foreground">Empfehlung für diesen Markt</p>
            <p className="mt-0.5 text-lg font-semibold">
              {aCount > 0 ? `${aCount} Top-Kandidat${aCount > 1 ? 'en' : ''} gefunden` : 'Eher schwieriger Markt'}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1.5 border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300">
              <ShoppingCart className="size-3.5" /> {sellReady} zum Einsteigen
            </Badge>
            <Badge variant="outline" className="gap-1.5 border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300">
              <Sparkles className="size-3.5" /> {improveReady} zum Verbessern
            </Badge>
          </div>
        </div>
        <Button className="h-9 gap-2 md:self-center" onClick={() => router.push('/produkte')}>
          Alle Produkte <ArrowRight className="size-4" />
        </Button>
      </div>

      {/* KPI-Strip */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.label} className="metric-card flex flex-col rounded-lg p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted ${k.tone}`}>
                  <Icon className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums">{k.value}</p>
              <p className="mt-auto pt-2 text-[11px] leading-4 text-muted-foreground">{k.helper}</p>
            </div>
          )
        })}
      </div>

      {/* Zwei Linsen */}
      <div className="grid gap-4 lg:grid-cols-2">
        <LensPanel lens="sell" parents={parents} />
        <LensPanel lens="improve" parents={parents} />
      </div>

      {/* Chancen-Karte + Upload */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <OpportunityScatter parents={parents} />
        <div className="space-y-4">
          <div className="panel p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">Lesehilfe</h3>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Suche <strong>kleine Blasen weit oben</strong>: viel Nachfrage bei niedriger
              Review-Mauer. Große Blasen = etablierte Platzhirsche mit vielen Reviews —
              schwer einzusteigen, eher ein Fall für die Verbessern-Linse.
            </p>
          </div>
          <UploadCsv compact />
        </div>
      </div>
    </div>
  )
}

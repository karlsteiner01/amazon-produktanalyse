'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from "@/lib/supabase"
import type { Product, Analysis } from '@/types'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { TopProducts } from '@/components/dashboard/top-products'
import { MarketOverview } from '@/components/dashboard/market-overview'
import { UploadCsv } from '@/components/dashboard/upload-csv'
import { ImportSelector } from '@/components/import-selector'
import { useImport } from '@/hooks/use-import'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowRight, Database, KeyRound, PackageSearch, Target, Upload } from 'lucide-react'

type ProductWithAnalysis = Product & { analysis?: Analysis }

async function fetchDashboardProducts(importId: string | undefined) {
  let query = getSupabase()
    .from('products')
    .select('*')

  if (importId) {
    query = query.eq('import_id', importId)
  }

  const { data: pData, error: pErr } = await query.order('created_at', { ascending: false })

  if (pErr) {
    throw pErr
  }

  const { data: aData } = await getSupabase()
    .from('analyses')
    .select('*')

  const productData = (pData || []) as unknown as Product[]
  const analysisData = (aData || []) as unknown as Analysis[]
  const analysisMap = new Map<string, Analysis>()
  analysisData.forEach((a) => analysisMap.set(a.product_id, a))

  return productData.map(
    (p): ProductWithAnalysis => ({
      ...p,
      analysis: analysisMap.get(p.id),
    })
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [products, setProducts] = useState<ProductWithAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { imports, selectedImportId, switchImport, refreshImports } = useImport()

  useEffect(() => {
    let cancelled = false

    async function loadSelectedImport() {
      await Promise.resolve()
      if (cancelled) return

      setLoading(true)
      setError(null)

      try {
        const withAnalysis = await fetchDashboardProducts(selectedImportId ?? undefined)
        if (!cancelled) setProducts(withAnalysis)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Produkte konnten nicht geladen werden')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadSelectedImport()

    return () => {
      cancelled = true
    }
  }, [selectedImportId])

  const totalSales = products.reduce((s, p) => s + (p.asin_sales ?? 0), 0)
  const totalRevenue = products.reduce((s, p) => s + (p.asin_revenue ?? 0), 0)
  const avgPrice = products.length
    ? products.reduce((s, p) => s + (p.price_eur ?? 0), 0) / products.length
    : 0
  const avgRating = products.length
    ? products.reduce((s, p) => s + (p.rating ?? 0), 0) / products.length
    : 0
  const fbaCount = products.filter((p) => p.is_fba).length
  const aCandidates = products.filter((p) => p.analysis?.product_tier === 'A').length
  const bestScore = Math.max(...products.map((p) => p.analysis?.opportunity_score ?? 0), 0)
  const topCategory = products
    .map((p) => p.category)
    .filter(Boolean)
    .reduce<Record<string, number>>((acc, category) => {
      acc[category as string] = (acc[category as string] || 0) + 1
      return acc
    }, {})
  const strongestCategory = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Keine Kategorie'
  const selectedImport = imports.find((item) => item.id === selectedImportId)
  const importScopeLabel = selectedImport
    ? selectedImport.filename.replace(/\.csv$/i, '')
    : imports.length > 1
      ? 'Alle Imports'
      : imports[0]?.filename.replace(/\.csv$/i, '')

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Übersicht</p>
            <h2 className="text-2xl font-semibold sm:text-3xl">Dashboard</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Produktmärkte importieren, Scores berechnen und Kandidaten priorisieren.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="panel overflow-hidden">
            <div className="border-b border-border bg-muted/35 p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Database className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Datenbank verbinden</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Die App ist bereit. Es fehlen nur die Supabase-Variablen für diesen Workspace.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-3">
              {[
                { title: 'Supabase URL', text: 'Projekt-URL setzen', icon: Database },
                { title: 'Anon Key', text: 'Public Client Key setzen', icon: KeyRound },
                { title: 'Schema', text: 'SQL Tabellen anlegen', icon: AlertTriangle },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="rounded-lg border border-border bg-card p-4">
                    <Icon className="size-4 text-primary" />
                    <p className="mt-3 text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.text}</p>
                  </div>
                )
              })}
            </div>
            <div className="border-t border-border bg-muted/25 px-5 py-4">
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </section>

          <section className="panel p-5">
            <h3 className="text-sm font-semibold">Nächster Schritt</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Sobald Supabase verbunden ist, wird hier direkt dein Helium-10 Export verarbeitet und die Analyseansicht gefüllt.
            </p>
            <div className="mt-5 grid gap-2">
              {['CSV hochladen', 'Scores berechnen', 'Produkte prüfen'].map((label, index) => (
                <div key={label} className="flex items-center gap-3 rounded-lg border border-border bg-muted/25 p-3">
                  <span className="flex size-7 items-center justify-center rounded-md bg-background text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              Marktübersicht
            </Badge>
            {importScopeLabel && (
              <Badge variant="outline" className="max-w-full border-border bg-card text-muted-foreground">
                {importScopeLabel}
              </Badge>
            )}
          </div>
          <h2 className="text-2xl font-semibold sm:text-3xl">Übersicht</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Kompakte Marktprüfung für Helium-10 Exporte: Nachfrage, Umsatz, Wettbewerb und erste Produktentscheidungen.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ImportSelector imports={imports} selectedImportId={selectedImportId} onSelect={switchImport} />
          <Button
            variant="outline"
            className="h-9 justify-start gap-2"
            onClick={() => document.getElementById('csv-import-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            <Upload className="size-4" />
            CSV Import
          </Button>
        </div>
      </div>

      {loading && (
        <div className="panel p-8">
          <p className="text-sm text-muted-foreground">Lade Dashboard-Daten...</p>
        </div>
      )}

      {products.length === 0 && !loading && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="panel flex min-h-[360px] items-center p-8">
            <div className="max-w-xl">
              <div className="mb-5 flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <PackageSearch className="size-6" />
              </div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Noch kein Datensatz</p>
              <h3 className="mt-2 text-2xl font-semibold">Importiere deinen ersten Produktmarkt</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Sobald eine CSV geladen ist, entstehen automatisch Score, Tier-Einstufung, Toplisten und Produktdetails.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {['CSV einlesen', 'Scores berechnen', 'Kandidaten prüfen'].map((label, index) => (
                  <div key={label} className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="text-xs font-semibold text-muted-foreground">0{index + 1}</p>
                    <p className="mt-1 text-sm font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div id="csv-import-panel">
            <UploadCsv onImport={(id) => refreshImports(id)} />
          </div>
        </div>
      )}

      {products.length > 0 && (
        <>
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="panel p-5 lg:col-span-2">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Marktentscheidung</p>
                  <h3 className="mt-1 text-xl font-semibold">
                    {aCandidates > 0 ? `${aCandidates} starke Kandidaten gefunden` : 'Markt noch kritisch prüfen'}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                    Der beste Opportunity Score liegt bei {bestScore}/100. Häufigste Kategorie: {strongestCategory}.
                  </p>
                </div>
                <Button className="h-9 justify-start gap-2 md:self-end" onClick={() => router.push('/produkte')}>
                  Produkte prüfen
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
            <div className="panel p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Target className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Aktiver Datensatz</p>
                  <p className="truncate text-sm font-semibold">
                    {selectedImportId ? `${products.length} Produkte geladen` : `${imports.length} Imports · ${products.length} Produkte`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <KpiCards
            productCount={products.length}
            totalSales={totalSales}
            totalRevenue={totalRevenue}
            avgPrice={avgPrice}
            avgRating={avgRating}
            fbaCount={fbaCount}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <TopProducts products={products} title="Top 5 nach Umsatz" sortBy="sales" />
              <TopProducts products={products} title="Top 5 nach Opportunity Score" sortBy="score" />
            </div>
            <div id="csv-import-panel" className="space-y-6">
              <MarketOverview products={products} />
              <UploadCsv onImport={(id) => refreshImports(id)} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

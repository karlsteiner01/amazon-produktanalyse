'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import type { Analysis, Product } from '@/types'
import { tierColor, tierLabel } from '@/lib/scoring'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImportSelector } from '@/components/import-selector'
import { useImport } from '@/hooks/use-import'
import { Award, Brain, ChevronRight, FileText, Gauge, PackageSearch, Target, Trophy } from 'lucide-react'

interface AnalysisWithProduct extends Analysis {
  product?: Product
}

function ProductImage({ product }: { product?: Product }) {
  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border bg-white p-1 shadow-sm dark:bg-muted">
      {product?.image_url ? (
        <img
          src={product.image_url}
          alt={product.product_details ? `${product.product_details} Produktbild` : 'Produktbild'}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      ) : (
        <PackageSearch className="size-5 text-muted-foreground" />
      )}
    </div>
  )
}

function TierBadge({ tier }: { tier: Analysis['product_tier'] }) {
  return (
    <Badge
      style={{
        backgroundColor: tierColor(tier) + '20',
        color: tierColor(tier),
        borderColor: tierColor(tier) + '40',
      }}
      variant="outline"
      className="shrink-0 text-xs"
    >
      {tierLabel(tier)}
    </Badge>
  )
}

export default function AnalysenPage() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<AnalysisWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const { imports, selectedImportId, switchImport } = useImport()

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)

      let productQuery = getSupabase()
        .from('products')
        .select('*')

      if (selectedImportId) {
        productQuery = productQuery.eq('import_id', selectedImportId)
      }

      const { data: productData } = await productQuery
      if (cancelled) return

      const productRows = (productData || []) as unknown as Product[]
      if (productRows.length === 0) {
        setAnalyses([])
        setLoading(false)
        return
      }

      const ids = productRows.map((p) => p.id)
      const { data: analysisData } = await getSupabase()
        .from('analyses')
        .select('*')
        .in('product_id', ids)
        .order('opportunity_score', { ascending: false })
        .order('created_at', { ascending: false })

      if (cancelled) return

      const analysisRows = (analysisData || []) as unknown as Analysis[]
      const productMap = new Map<string, Product>()
      productRows.forEach((p) => productMap.set(p.id, p))

      setAnalyses(
        analysisRows.map((analysis) => ({
          ...analysis,
          product: productMap.get(analysis.product_id),
        }))
      )
      setLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [selectedImportId])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const selectedImport = imports.find((item) => item.id === selectedImportId)
  const scopeLabel = selectedImport
    ? selectedImport.filename.replace(/\.csv$/i, '')
    : imports.length > 1
      ? 'Alle Imports'
      : imports[0]?.filename.replace(/\.csv$/i, '') || 'Import'

  const tierCounts = analyses.reduce<Record<string, number>>((acc, analysis) => {
    acc[analysis.product_tier] = (acc[analysis.product_tier] || 0) + 1
    return acc
  }, {})
  const bestScore = analyses[0]?.opportunity_score ?? 0
  const avgScore = analyses.length
    ? Math.round(analyses.reduce((sum, item) => sum + item.opportunity_score, 0) / analyses.length)
    : 0
  const topThree = analyses.slice(0, 3)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Priorisierung</p>
            <h2 className="text-2xl font-semibold sm:text-3xl">Analysen</h2>
          </div>
          <ImportSelector imports={imports} selectedImportId={selectedImportId} onSelect={switchImport} />
        </div>
        <div className="panel p-8">
          <p className="text-sm text-muted-foreground">Lade Analysen...</p>
        </div>
      </div>
    )
  }

  if (analyses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Priorisierung</p>
            <h2 className="text-2xl font-semibold sm:text-3xl">Analysen</h2>
          </div>
          <ImportSelector imports={imports} selectedImportId={selectedImportId} onSelect={switchImport} />
        </div>
        <div className="panel p-12 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileText className="size-5" />
          </div>
          <p className="text-sm font-medium">Noch keine Analysen vorhanden</p>
          <p className="mt-1 text-xs text-muted-foreground">Sobald Produkte importiert wurden, erscheinen hier die Analysen.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Priorisierung</p>
          <h2 className="text-2xl font-semibold sm:text-3xl">Analysen</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Kandidaten nach Score, Tier, Nachfrage und Risiko in einer Rangliste.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ImportSelector imports={imports} selectedImportId={selectedImportId} onSelect={switchImport} />
          <Badge variant="outline" className="h-9 justify-center border-border bg-card text-muted-foreground">
            {scopeLabel}
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Analysen', value: analyses.length, icon: Brain },
          { label: 'Bester Score', value: bestScore, icon: Trophy },
          { label: 'Starke Kandidaten', value: tierCounts.A || 0, icon: Target },
          { label: 'Ø Score', value: avgScore, icon: Gauge },
        ].map((item) => {
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

      <div className="grid gap-4 xl:grid-cols-3">
        {topThree.map((analysis, index) => (
          <Card key={analysis.id} className="metric-card overflow-hidden">
            <CardContent className="p-0">
              <div className="border-b border-border bg-muted/35 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Award className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Top {index + 1}</p>
                      <p className="text-sm font-semibold">Score {analysis.opportunity_score}/100</p>
                    </div>
                  </div>
                  <TierBadge tier={analysis.product_tier} />
                </div>
              </div>
              <div className="p-4">
                <div className="flex gap-3">
                  <ProductImage product={analysis.product} />
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-5">
                      {analysis.product?.product_details || 'Unbekanntes Produkt'}
                    </h3>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {analysis.product?.brand || 'Keine Marke'} · {analysis.product?.asin || 'Keine ASIN'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(analysis.opportunity_score, 100)}%` }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">{formatDate(analysis.created_at)}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => analysis.product && router.push(`/produkte/${analysis.product_id}`)}
                  >
                    Details
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/35 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">Ranking</h3>
            <p className="text-xs text-muted-foreground">{analyses.length} Produkte nach Opportunity Score sortiert</p>
          </div>
        </div>
        <div className="divide-y divide-border">
          {analyses.map((analysis, index) => (
            <button
              key={analysis.id}
              type="button"
              className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/45"
              onClick={() => analysis.product && router.push(`/produkte/${analysis.product_id}`)}
            >
              <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-sm font-semibold tabular-nums">
                {index + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <ProductImage product={analysis.product} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{analysis.product?.product_details || 'Unbekanntes Produkt'}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {analysis.product?.brand || 'Keine Marke'} · {analysis.product?.asin || 'Keine ASIN'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex min-w-[8rem] flex-col items-end gap-2">
                <p className="text-lg font-semibold tabular-nums" style={{ color: tierColor(analysis.product_tier) }}>
                  {analysis.opportunity_score}
                </p>
                <TierBadge tier={analysis.product_tier} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

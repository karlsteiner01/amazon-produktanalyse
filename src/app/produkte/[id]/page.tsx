'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSupabase } from "@/lib/supabase"
import type { Product, Analysis } from '@/types'
import { tierColor, tierLabel } from '@/lib/scoring'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ExternalLink, Euro, Lightbulb, Package, ShieldAlert, ShoppingCart, Star } from 'lucide-react'
import dynamic from 'next/dynamic'

const RadarChart = dynamic(() => import('@/components/analysis/radar-chart'), { ssr: false })

export default function ProduktDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: pData } = await getSupabase()
        .from('products')
        .select('*')
        .eq('id', params.id as string)
        .single()

      const { data: aData } = await getSupabase()
        .from('analyses')
        .select('*')
        .eq('product_id', params.id as string)
        .order('created_at', { ascending: false })
        .limit(1)

      setProduct(pData as unknown as Product | null)
      const analysisRows = (aData || []) as unknown as Analysis[]
      if (analysisRows.length > 0) setAnalysis(analysisRows[0])
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => router.push('/produkte')}>
          <ArrowLeft className="size-3.5" />
          Zurück
        </Button>
        <div className="panel p-8">
          <p className="text-sm text-muted-foreground">Lade Produkt...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="panel p-8">
        <p className="text-sm text-muted-foreground">Produkt nicht gefunden.</p>
      </div>
    )
  }

  const formatEur = (v: number | null) =>
    v ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v) : '–'

  const formatNumber = (v: number | null) =>
    v ? new Intl.NumberFormat('de-DE').format(v) : '–'

  const infoFields = [
    { label: 'Marke', value: product.brand },
    { label: 'ASIN', value: product.asin },
    { label: 'Preis', value: formatEur(product.price_eur) },
    { label: 'Verkäufe', value: formatNumber(product.asin_sales) },
    { label: 'Umsatz', value: formatEur(product.asin_revenue) },
    { label: 'BSR', value: product.bsr?.toString() ?? '–' },
    { label: 'Amazon-Gebühren', value: formatEur(product.fees_eur) },
    { label: 'Aktive Verkäufer', value: product.active_sellers?.toString() ?? '–' },
    { label: 'Bewertung', value: product.rating ? `${product.rating} Sterne` : '–' },
    { label: 'Reviews', value: formatNumber(product.review_count) },
    { label: 'FBA', value: product.is_fba ? 'Ja' : 'Nein' },
    { label: 'Gewicht', value: product.weight_kg ? `${product.weight_kg} kg` : '–' },
    { label: 'Kategorie', value: product.category ?? '–' },
    { label: 'Verkäufer', value: product.seller ?? '–' },
  ]
  const quickStats = [
    { label: 'Preis', value: formatEur(product.price_eur), icon: Euro, tone: 'text-amber-600 dark:text-amber-300' },
    { label: 'Verkäufe', value: formatNumber(product.asin_sales), icon: ShoppingCart, tone: 'text-emerald-600 dark:text-emerald-300' },
    { label: 'Umsatz', value: formatEur(product.asin_revenue), icon: Package, tone: 'text-sky-600 dark:text-sky-300' },
    { label: 'Rating', value: product.rating ? `${product.rating}` : '–', icon: Star, tone: 'text-rose-600 dark:text-rose-300' },
  ]
  const scoreRows = analysis ? [
    { label: 'Nachfrage', value: analysis.demand_score },
    { label: 'Umsatzpotenzial', value: analysis.revenue_score },
    { label: 'Konkurrenz', value: analysis.competition_score },
    { label: 'Marge', value: analysis.margin_score },
    { label: 'Verbesserbarkeit', value: analysis.improvement_score },
    { label: 'Risiko', value: analysis.risk_score },
  ] : []

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={() => router.push('/produkte')}
      >
        <ArrowLeft className="size-3.5" />
        Zurück
      </Button>

      <section className="panel overflow-hidden">
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_260px] lg:p-6">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-border bg-muted/50 text-muted-foreground">{product.asin}</Badge>
              {analysis && (
                <Badge
                  style={{
                    backgroundColor: tierColor(analysis.product_tier) + '20',
                    color: tierColor(analysis.product_tier),
                    borderColor: tierColor(analysis.product_tier) + '40',
                  }}
                  variant="outline"
                  className="text-xs"
                >
                  {tierLabel(analysis.product_tier)}
                </Badge>
              )}
            </div>
            <h2 className="max-w-4xl text-2xl font-semibold leading-tight sm:text-3xl">{product.product_details}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{product.brand || 'Keine Marke'} - {product.category || 'Keine Kategorie'}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {quickStats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="rounded-lg border border-border bg-muted/25 p-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`size-4 ${stat.tone}`} />
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                    <p className="mt-2 text-lg font-semibold">{stat.value}</p>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex items-center justify-center rounded-lg border border-border bg-white p-4 dark:bg-muted/30">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.product_details || ''}
                className="max-h-56 max-w-full object-contain"
                loading="lazy"
              />
            ) : (
              <Package className="size-12 text-muted-foreground" />
            )}
          </div>
        </div>
        {product.url && (
          <div className="flex justify-end border-t border-border/80 bg-muted/30 px-5 py-3 lg:px-6">
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted"
            >
              <ExternalLink className="size-3.5" />
              Auf Amazon ansehen
            </a>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Produktinformationen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {infoFields.map((f) => (
                  <div key={f.label} className="rounded-md border border-border/70 bg-muted/25 px-3 py-2">
                    <span className="block text-xs text-muted-foreground">{f.label}</span>
                    <span className="mt-1 block truncate text-xs font-medium">{f.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {analysis?.full_analysis && (
            <>
              <Separator />
              <section className="panel p-5">
                <h3 className="text-sm font-semibold">KI-Analyse</h3>
                <div className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {analysis.full_analysis}
                </div>
              </section>
            </>
          )}
        </div>

        <div className="space-y-6">
          {analysis && (
            <>
              <Card className="metric-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Opportunity Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p className="text-5xl font-bold" style={{ color: tierColor(analysis.product_tier) }}>
                      {analysis.opportunity_score}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">/ 100</p>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    {scoreRows.map((s) => (
                      <div key={s.label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{s.label}</span>
                        <span className="font-medium">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <RadarChart analysis={analysis} />
            </>
          )}

          {analysis?.improvement_ideas && analysis.improvement_ideas.length > 0 && (
            <Card className="metric-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Lightbulb className="size-4 text-amber-500" />
                  Verbesserungsideen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {analysis.improvement_ideas.map((idea, i) => (
                    <li key={i} className="flex gap-2 text-xs leading-5 text-muted-foreground">
                      <span className="shrink-0 text-primary">–</span>
                      {idea}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {analysis?.risks && analysis.risks.length > 0 && (
            <Card className="metric-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldAlert className="size-4 text-destructive" />
                  Risiken
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {analysis.risks.map((risk, i) => (
                    <li key={i} className="flex gap-2 text-xs leading-5 text-muted-foreground">
                      <span className="shrink-0 text-destructive">–</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

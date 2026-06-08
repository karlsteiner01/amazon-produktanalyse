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
import { ArrowLeft, ExternalLink } from 'lucide-react'
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
      const { data: pData } = await (getSupabase() as any)
        .from('products')
        .select('*')
        .eq('id', params.id as string)
        .single()

      const { data: aData } = await (getSupabase() as any)
        .from('analyses')
        .select('*')
        .eq('product_id', params.id as string)
        .order('created_at', { ascending: false })
        .limit(1)

      setProduct(pData)
      if (aData && aData.length > 0) setAnalysis(aData[0])
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) {
    return <p className="text-sm text-zinc-500">Lade Produkt...</p>
  }

  if (!product) {
    return <p className="text-sm text-zinc-500">Produkt nicht gefunden.</p>
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

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 text-xs"
        onClick={() => router.push('/produkte')}
      >
        <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
        Zurück
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">{product.product_details}</h2>
                <p className="text-sm text-zinc-500">{product.brand}</p>
              </div>
              {analysis && (
                <Badge
                  style={{
                    backgroundColor: tierColor(analysis.product_tier) + '20',
                    color: tierColor(analysis.product_tier),
                    borderColor: tierColor(analysis.product_tier) + '40',
                  }}
                  variant="outline"
                  className="text-xs shrink-0"
                >
                  {tierLabel(analysis.product_tier)}
                </Badge>
              )}
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Produktinformationen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
                {infoFields.map((f) => (
                  <div key={f.label} className="flex justify-between py-1">
                    <span className="text-xs text-zinc-500">{f.label}</span>
                    <span className="text-xs font-medium">{f.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {analysis?.full_analysis && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-3">KI-Analyse</h3>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                  {analysis.full_analysis}
                </div>
              </div>
            </>
          )}

          {product.url && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => window.open(product.url, '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Auf Amazon ansehen
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {analysis && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p className="text-3xl font-bold" style={{ color: tierColor(analysis.product_tier) }}>
                      {analysis.opportunity_score}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">/ 100</p>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    {[
                      { label: 'Nachfrage', value: analysis.demand_score },
                      { label: 'Umsatzpotenzial', value: analysis.revenue_score },
                      { label: 'Konkurrenz', value: analysis.competition_score },
                      { label: 'Marge', value: analysis.margin_score },
                      { label: 'Verbesserbarkeit', value: analysis.improvement_score },
                      { label: 'Risiko', value: analysis.risk_score },
                    ].map((s) => (
                      <div key={s.label} className="flex justify-between text-xs">
                        <span className="text-zinc-500">{s.label}</span>
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
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Verbesserungsideen</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {analysis.improvement_ideas.map((idea, i) => (
                    <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 flex gap-2">
                      <span className="text-blue-500 shrink-0">–</span>
                      {idea}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {analysis?.risks && analysis.risks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Risiken</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {analysis.risks.map((risk, i) => (
                    <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 flex gap-2">
                      <span className="text-red-500 shrink-0">–</span>
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

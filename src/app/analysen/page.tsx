'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from "@/lib/supabase"
import type { Analysis, Product } from '@/types'
import { tierColor, tierLabel } from '@/lib/scoring'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'

interface AnalysisWithProduct extends Analysis {
  product?: Product
}

export default function AnalysenPage() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<AnalysisWithProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: aData } = await (getSupabase() as any)
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false })

      if (!aData || aData.length === 0) {
        setLoading(false)
        return
      }

      const productIds = aData.map((a: Analysis) => a.product_id)
      const { data: pData } = await (getSupabase() as any)
        .from('products')
        .select('*')
        .in('id', productIds)

      const productMap = new Map<string, Product>()
      if (pData) pData.forEach((p: Product) => productMap.set(p.id, p))

      setAnalyses(
        aData.map((a: Analysis) => ({
          ...a,
          product: productMap.get(a.product_id),
        }))
      )
      setLoading(false)
    }
    load()
  }, [])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  if (loading) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-6">Analysen</h2>
        <p className="text-sm text-zinc-500">Lade Analysen...</p>
      </div>
    )
  }

  if (analyses.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-6">Analysen</h2>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-12 text-center">
          <FileText className="h-8 w-8 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm text-zinc-500 mb-1">Noch keine Analysen vorhanden</p>
          <p className="text-xs text-zinc-400">
            Sobald Produkte importiert wurden, erscheinen hier die Analysen.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Analysen</h2>

      <div className="space-y-3">
        {analyses.map((a, idx) => (
          <Card key={a.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs text-zinc-400">#{analyses.length - idx}</span>
                    <h3
                      className="text-sm font-medium truncate cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => a.product && router.push(`/produkte/${a.product_id}`)}
                    >
                      {a.product?.product_details || 'Unbekanntes Produkt'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>{a.product?.brand || '–'}</span>
                    <span>{a.product?.asin || '–'}</span>
                    <span>{formatDate(a.created_at)}</span>
                  </div>
                  {a.full_analysis && (
                    <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
                      {a.full_analysis}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: tierColor(a.product_tier) }}>
                      {a.opportunity_score}
                    </p>
                    <Badge
                      style={{
                        backgroundColor: tierColor(a.product_tier) + '20',
                        color: tierColor(a.product_tier),
                        borderColor: tierColor(a.product_tier) + '40',
                      }}
                      variant="outline"
                      className="text-xs"
                    >
                      {tierLabel(a.product_tier)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => a.product && router.push(`/produkte/${a.product_id}`)}
                  >
                    Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

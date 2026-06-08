'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from "@/lib/supabase"
import type { Product, Analysis } from '@/types'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { TopProducts } from '@/components/dashboard/top-products'
import { MarketOverview } from '@/components/dashboard/market-overview'
import { UploadCsv } from '@/components/dashboard/upload-csv'
import { ImportSelector } from '@/components/import-selector'
import { useImport } from '@/hooks/use-import'

type ProductWithAnalysis = Product & { analysis?: Analysis }

export default function DashboardPage() {
  const [products, setProducts] = useState<ProductWithAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { selectedImportId, refreshImports } = useImport()

  async function loadData() {
    setLoading(true)
    setError(null)

    let query = (getSupabase() as any)
      .from('products')
      .select('*')

    if (selectedImportId) {
      query = query.eq('import_id', selectedImportId)
    }

    const { data: pData, error: pErr } = await query.order('created_at', { ascending: false })

    if (pErr) {
      setError(pErr.message)
      setLoading(false)
      return
    }

    const { data: aData } = await (getSupabase() as any)
      .from('analyses')
      .select('*')

    const analysisMap = new Map<string, Analysis>()
    if (aData) {
      aData.forEach((a: Analysis) => analysisMap.set(a.product_id, a))
    }

    const withAnalysis: ProductWithAnalysis[] = (pData || []).map(
      (p: Product) => ({
        ...p,
        analysis: analysisMap.get(p.id),
      })
    )

    setProducts(withAnalysis)
    setLoading(false)
  }

  useEffect(() => {
    if (selectedImportId !== undefined) loadData()
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

  if (error) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Übersicht</h2>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-8 text-center">
          <p className="text-sm text-zinc-500 mb-2">Supabase nicht verbunden</p>
          <p className="text-xs text-zinc-400 mb-4">{error}</p>
          <p className="text-xs text-zinc-400">
            Erstelle ein Supabase-Projekt, führe das SQL-Schema aus und setze die Umgebungsvariablen.
          </p>
        </div>
        <div className="mt-6">
          <UploadCsv onImport={loadData} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Übersicht</h2>
          <ImportSelector />
        </div>
        {products.length > 0 && (
          <p className="text-xs text-zinc-400">
            {products.length} Produkte geladen
          </p>
        )}
      </div>

      {products.length === 0 && !loading && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-12 text-center mb-6">
          <p className="text-sm text-zinc-500 mb-2">Noch keine Produkte vorhanden</p>
          <p className="text-xs text-zinc-400 mb-6">
            Lade einen Helium-10 Xray Export hoch, um zu starten.
          </p>
          <UploadCsv onImport={(id) => { refreshImports(id); loadData() }} />
        </div>
      )}

      {products.length > 0 && (
        <>
          <KpiCards
            productCount={products.length}
            totalSales={totalSales}
            totalRevenue={totalRevenue}
            avgPrice={avgPrice}
            avgRating={avgRating}
            fbaCount={fbaCount}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 space-y-6">
              <TopProducts products={products} title="Top 5 nach Umsatz" sortBy="sales" />
              <TopProducts products={products} title="Top 5 nach Opportunity Score" sortBy="score" />
            </div>
            <div className="space-y-6">
              <MarketOverview products={products} />
              <UploadCsv onImport={(id) => { refreshImports(id); loadData() }} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

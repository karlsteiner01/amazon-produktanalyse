'use client'

import { useState, useCallback } from 'react'
import { parseCsvText, parseCsvRows } from '@/lib/csv-parser'
import { computeScores } from '@/lib/scoring'
import { getSupabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'

interface UploadCsvProps {
  onImport: () => void
}

export function UploadCsv({ onImport }: UploadCsvProps) {
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'parsing' | 'importing' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setStatus('error')
      setMessage('Bitte eine CSV-Datei hochladen')
      return
    }

    setImporting(true)
    setStatus('parsing')
    setProgress(10)

    try {
      const text = await file.text()
      const rows = parseCsvText(text)
      const products = parseCsvRows(rows)

      if (products.length === 0) {
        setStatus('error')
        setMessage('Keine Produkte in der CSV gefunden')
        setImporting(false)
        return
      }

      setProgress(30)
      setStatus('importing')

      const { data: importRecord, error: importErr } = await (getSupabase() as any)
        .from('csv_imports')
        .insert({
          filename: file.name,
          product_count: products.length,
          status: 'processing',
        })
        .select()

      if (importErr) throw importErr

      const importId = importRecord?.[0]?.id
      setProgress(50)

      let successCount = 0
      for (let i = 0; i < products.length; i++) {
        const p = products[i]

        const { error: upsertErr } = await (getSupabase() as any).from('products').upsert(
          {
            asin: p.asin,
            product_details: p.product_details,
            url: p.url,
            image_url: p.image_url,
            brand: p.brand,
            price_eur: p.price_eur,
            asin_sales: p.asin_sales,
            asin_revenue: p.asin_revenue,
            bsr: p.bsr,
            fees_eur: p.fees_eur,
            active_sellers: p.active_sellers,
            rating: p.rating,
            review_count: p.review_count,
            is_fba: p.is_fba,
            weight_kg: p.weight_kg,
            category: p.category,
            seller: p.seller,
            seller_region: p.seller_region,
            fulfillment: p.fulfillment,
            title_length: p.title_length,
            image_count: p.image_count,
            sponsored: p.sponsored,
            bestseller: p.bestseller,
            seller_age_months: p.seller_age_months,
            import_id: importId,
          },
          { onConflict: 'asin' }
        )

        if (!upsertErr) successCount++

        setProgress(50 + Math.round((i / products.length) * 40))
      }

      setProgress(92)
      setStatus('importing')

      const scores = computeScores(products)
      let analysisCount = 0

      for (const p of products) {
        const s = scores.get(p.asin)
        if (!s) continue

        const { data: productData } = await (getSupabase() as any)
          .from('products')
          .select('id')
          .eq('asin', p.asin)
          .single()

        if (productData) {
          await (getSupabase() as any).from('analyses').upsert(
            {
              product_id: productData.id,
              opportunity_score: s.opportunity_score,
              product_tier: s.product_tier,
              demand_score: s.demand_score,
              revenue_score: s.revenue_score,
              competition_score: s.competition_score,
              margin_score: s.margin_score,
              improvement_score: s.improvement_score,
              risk_score: s.risk_score,
            },
            { onConflict: 'product_id' }
          )
          analysisCount++
        }
      }

      if (importId) {
        await (getSupabase() as any)
          .from('csv_imports')
          .update({ status: 'completed' })
          .eq('id', importId)
      }

      setProgress(100)
      setStatus('done')
      setMessage(`${successCount} Produkte, ${analysisCount} Analysen erstellt`)
      onImport()
    } catch (e: unknown) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : 'Import fehlgeschlagen')
    }

    setImporting(false)
  }, [onImport])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">CSV Import</CardTitle>
        <CardDescription className="text-xs">
          Helium-10 Xray Export hochladen
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'idle' ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
              transition-colors duration-200
              ${dragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500'
              }
            `}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.csv'
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) handleFile(file)
              }
              input.click()
            }}
          >
            <Upload className="h-6 w-6 mx-auto mb-2 text-zinc-400" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              CSV hier ablegen oder klicken zum Auswählen
            </p>
            <p className="text-xs text-zinc-400 mt-1">Helium-10 Xray Format</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              {(status === 'parsing' || status === 'importing') && <FileText className="h-4 w-4 text-blue-500" />}
              {status === 'done' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
              <span className="text-xs">
                {status === 'parsing' && 'Analysiere CSV...'}
                {status === 'importing' && 'Importiere Produkte...'}
                {(status === 'done' || status === 'error') && message}
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
            {(status === 'done' || status === 'error') && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setStatus('idle')
                  setProgress(0)
                  setMessage('')
                }}
              >
                {status === 'done' ? 'Weiteren Import starten' : 'Erneut versuchen'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { useState, useCallback, useRef } from 'react'
import { parseCsvText, parseCsvRows } from '@/lib/csv-parser'
import { computeScores } from '@/lib/scoring'
import { getSupabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react'
import type { CsvImport, Product } from '@/types'

interface UploadCsvProps {
  onImport: (importId?: string) => void
}

export function UploadCsv({ onImport }: UploadCsvProps) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'parsing' | 'importing' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setStatus('error')
      setMessage('Bitte eine CSV-Datei hochladen')
      return
    }

    setStatus('parsing')
    setProgress(10)

    try {
      const text = await file.text()
      const rows = parseCsvText(text)
      const products = parseCsvRows(rows)

      if (products.length === 0) {
        setStatus('error')
        setMessage('Keine Produkte in der CSV gefunden')
        return
      }

      setProgress(30)
      setStatus('importing')

      const { data: importRecord, error: importErr } = await getSupabase()
        .from('csv_imports')
        .insert({
          filename: file.name,
          product_count: products.length,
          status: 'processing',
        })
        .select()

      if (importErr) throw importErr

      const importRows = (importRecord || []) as unknown as CsvImport[]
      const importId = importRows[0]?.id
      setProgress(50)

      let successCount = 0
      for (let i = 0; i < products.length; i++) {
        const p = products[i]

        const { error: insertErr } = await getSupabase().from('products').insert(
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
          }
        )

        if (!insertErr) successCount++

        setProgress(50 + Math.round((i / products.length) * 40))
      }

      setProgress(92)
      setStatus('importing')

      const scores = computeScores(products)
      let analysisCount = 0

      const { data: importedProducts } = await getSupabase()
        .from('products')
        .select('*')
        .eq('import_id', importId)

      const importedProductRows = (importedProducts || []) as unknown as Product[]
      if (importedProductRows.length > 0) {
        for (const prod of importedProductRows) {
          const s = scores.get(prod.asin)
          if (!s) continue

          const { error: insErr } = await getSupabase().from('analyses').insert({
            product_id: prod.id,
            opportunity_score: s.opportunity_score,
            product_tier: s.product_tier,
            demand_score: s.demand_score,
            revenue_score: s.revenue_score,
            competition_score: s.competition_score,
            margin_score: s.margin_score,
            improvement_score: s.improvement_score,
            risk_score: s.risk_score,
          })
          if (!insErr) analysisCount++
        }
      }

      if (importId) {
        await getSupabase()
          .from('csv_imports')
          .update({ status: 'completed' })
          .eq('id', importId)
      }

      setProgress(100)
      setStatus('done')
      setMessage(`${successCount} Produkte, ${analysisCount} Analysen erstellt`)
      onImport(importId || undefined)
    } catch (e: unknown) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : 'Import fehlgeschlagen')
    }
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
    <Card className="metric-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold">CSV Import</CardTitle>
            <CardDescription className="text-xs">
              Helium-10 Xray Export hochladen
            </CardDescription>
          </div>
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <FileSpreadsheet className="size-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {status === 'idle' ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.currentTarget.value = ''
              }}
            />
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                cursor-pointer rounded-lg border border-dashed p-6 text-center
                transition-colors duration-200
                ${dragOver
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted/25 hover:border-primary/60 hover:bg-muted/50'
                }
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-background text-primary shadow-sm">
                <Upload className="size-5" />
              </div>
              <p className="text-sm font-medium">
                CSV ablegen oder auswählen
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Helium-10 Xray Format</p>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              {(status === 'parsing' || status === 'importing') && <FileText className="h-4 w-4 text-primary" />}
              {status === 'done' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
              {status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
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
                className="h-8 w-full text-xs"
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

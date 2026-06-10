'use client'

import { useState, useCallback, useRef } from 'react'
import { parseCsvText, parseCsvRows } from '@/lib/csv-parser'
import { useData } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react'

interface UploadCsvProps {
  onImported?: (importId: string) => void
  compact?: boolean
}

export function UploadCsv({ onImported, compact }: UploadCsvProps) {
  const { addImport } = useData()
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setStatus('error')
        setMessage('Bitte eine CSV-Datei hochladen (Helium-10 Xray Export).')
        return
      }

      setStatus('working')
      setMessage('')

      try {
        const text = await file.text()
        const products = parseCsvRows(parseCsvText(text))

        if (products.length === 0) {
          setStatus('error')
          setMessage('Keine Produkte erkannt. Ist das ein Helium-10 Xray Export?')
          return
        }

        const id = addImport(file.name, products)
        setStatus('done')
        setMessage(`${products.length} Produkte importiert und ausgewertet.`)
        onImported?.(id)
      } catch (e) {
        setStatus('error')
        setMessage(e instanceof Error ? e.message : 'Import fehlgeschlagen.')
      }
    },
    [addImport, onImported]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <Card className="metric-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold">CSV importieren</CardTitle>
            <CardDescription className="text-xs">Helium-10 Xray Export</CardDescription>
          </div>
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <FileSpreadsheet className="size-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.currentTarget.value = ''
          }}
        />
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-lg border border-dashed text-center transition-colors duration-200 ${
            compact ? 'p-4' : 'p-6'
          } ${
            dragOver
              ? 'border-primary bg-primary/10'
              : 'border-border bg-muted/25 hover:border-primary/60 hover:bg-muted/50'
          }`}
        >
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-lg bg-background text-primary shadow-sm">
            <Upload className="size-5" />
          </div>
          <p className="text-sm font-medium">CSV ablegen oder auswählen</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Wird sofort lokal ausgewertet — keine Anmeldung nötig.
          </p>
        </div>

        {status !== 'idle' && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            {status === 'working' && <FileText className="size-4 animate-pulse text-primary" />}
            {status === 'done' && <CheckCircle className="size-4 text-emerald-500" />}
            {status === 'error' && <AlertCircle className="size-4 text-destructive" />}
            <span className={status === 'error' ? 'text-destructive' : 'text-muted-foreground'}>
              {status === 'working' ? 'Verarbeite CSV…' : message}
            </span>
          </div>
        )}

        {status !== 'idle' && status !== 'working' && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-8 w-full text-xs"
            onClick={() => {
              setStatus('idle')
              setMessage('')
            }}
          >
            {status === 'done' ? 'Weiteren Import' : 'Erneut versuchen'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

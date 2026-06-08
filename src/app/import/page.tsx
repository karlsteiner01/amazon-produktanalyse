'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from "@/lib/supabase"
import type { CsvImport } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UploadCsv } from '@/components/dashboard/upload-csv'
import { Upload, CheckCircle, AlertCircle, Clock } from 'lucide-react'

export default function ImportPage() {
  const [imports, setImports] = useState<CsvImport[]>([])
  const [loading, setLoading] = useState(true)

  async function loadImports() {
    const { data } = await (getSupabase() as any)
      .from('csv_imports')
      .select('*')
      .order('created_at', { ascending: false })

    setImports(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadImports()
  }, [])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing': return <Clock className="h-4 w-4 text-blue-500" />
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-zinc-400" />
    }
  }

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'Abgeschlossen',
      processing: 'In Bearbeitung',
      failed: 'Fehlgeschlagen',
    }
    return labels[status] || status
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Import</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Verlauf</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-xs text-zinc-500">Lade Importverlauf...</p>
              ) : imports.length === 0 ? (
                <div className="text-center py-8">
                  <Upload className="h-6 w-6 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-xs text-zinc-500">Noch keine Importe vorhanden</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {imports.map((imp) => (
                    <div
                      key={imp.id}
                      className="flex items-center justify-between py-2 border-b last:border-0 dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        {statusIcon(imp.status)}
                        <div>
                          <p className="text-xs font-medium">{imp.filename}</p>
                          <p className="text-xs text-zinc-500">
                            {formatDate(imp.created_at)} | {imp.product_count} Produkte
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          imp.status === 'completed' ? 'text-green-600 border-green-200 dark:border-green-800' :
                          imp.status === 'failed' ? 'text-red-600 border-red-200 dark:border-red-800' :
                          'text-blue-600 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        {statusLabel(imp.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <UploadCsv onImport={loadImports} />
          <div className="mt-4 p-3 border rounded-lg dark:border-zinc-800">
            <p className="text-xs font-medium mb-2">Hinweis</p>
            <p className="text-xs text-zinc-500">
              Die importierten Produkte werden automatisch analysiert und erhalten einen
              Opportunity Score sowie eine Tier-Einstufung.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

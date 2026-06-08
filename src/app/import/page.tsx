'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from "@/lib/supabase"
import type { CsvImport, Product } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UploadCsv } from '@/components/dashboard/upload-csv'
import { Upload, CheckCircle, AlertCircle, Clock, FileSpreadsheet, CalendarDays, Database, Layers3, Trash2 } from 'lucide-react'

export default function ImportPage() {
  const [imports, setImports] = useState<CsvImport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CsvImport | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadImports() {
    try {
      const { data } = await getSupabase()
        .from('csv_imports')
        .select('*')
        .order('created_at', { ascending: false })

      setImports((data || []) as unknown as CsvImport[])
      setError(null)
    } catch (e) {
      setImports([])
      setError(e instanceof Error ? e.message : 'Importverlauf konnte nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadInitialImports() {
      try {
        const { data } = await getSupabase()
          .from('csv_imports')
          .select('*')
          .order('created_at', { ascending: false })

        if (cancelled) return

        setImports((data || []) as unknown as CsvImport[])
        setError(null)
      } catch (e) {
        if (cancelled) return

        setImports([])
        setError(e instanceof Error ? e.message : 'Importverlauf konnte nicht geladen werden')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadInitialImports()

    return () => {
      cancelled = true
    }
  }, [])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const formatDay = (d: string) =>
    new Date(d).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing': return <Clock className="h-4 w-4 text-blue-500" />
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
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

  async function deleteImport(imp: CsvImport) {
    setDeletingId(imp.id)
    setError(null)

    try {
      const { data: productData, error: fetchErr } = await getSupabase()
        .from('products')
        .select('id')
        .eq('import_id', imp.id)

      if (fetchErr) throw fetchErr

      const products = (productData || []) as unknown as Pick<Product, 'id'>[]
      const productIds = products.map((product) => product.id)

      if (productIds.length > 0) {
        const { error: analysisErr } = await getSupabase()
          .from('analyses')
          .delete()
          .in('product_id', productIds)

        if (analysisErr) throw analysisErr

        const { error: productErr } = await getSupabase()
          .from('products')
          .delete()
          .eq('import_id', imp.id)

        if (productErr) throw productErr
      }

      const { error: importErr } = await getSupabase()
        .from('csv_imports')
        .delete()
        .eq('id', imp.id)

      if (importErr) throw importErr

      if (localStorage.getItem('selected-import-id') === imp.id) {
        localStorage.setItem('selected-import-id', 'all')
      }

      setDeleteTarget(null)
      await loadImports()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import konnte nicht gelöscht werden')
    } finally {
      setDeletingId(null)
    }
  }

  const totalProducts = imports.reduce((sum, item) => sum + item.product_count, 0)
  const completedImports = imports.filter((item) => item.status === 'completed').length
  const todayKey = new Date().toDateString()
  const todayImports = imports.filter((item) => new Date(item.created_at).toDateString() === todayKey).length

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground">Datenquelle</p>
        <h2 className="text-2xl font-semibold sm:text-3xl">Import</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Listen verwalten und neue Xray-Exporte in den Analyse-Workflow bringen.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Heute', value: todayImports, icon: CalendarDays },
          { label: 'Alle Imports', value: imports.length, icon: Layers3 },
          { label: 'Produkte', value: totalProducts, icon: Database },
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="metric-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold">Importverlauf</CardTitle>
                  <p className="text-xs text-muted-foreground">{completedImports} abgeschlossen</p>
                </div>
                <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <FileSpreadsheet className="size-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Lade Importverlauf...</p>
              ) : error ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <AlertCircle className="size-5" />
                  </div>
                  <p className="text-sm font-medium">Supabase nicht verbunden</p>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{error}</p>
                </div>
              ) : imports.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Upload className="size-5" />
                  </div>
                  <p className="text-sm font-medium">Noch keine Importe vorhanden</p>
                  <p className="mt-1 text-xs text-muted-foreground">Der erste Upload erscheint direkt in dieser Liste.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {imports.map((imp) => (
                    <div
                      key={imp.id}
                      className="rounded-lg border border-border bg-muted/25 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-card">
                            {statusIcon(imp.status)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{imp.filename.replace(/\.csv$/i, '')}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(imp.created_at)} · {imp.product_count} Produkte
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:justify-end">
                          <Badge
                            variant="outline"
                            className={`shrink-0 text-xs ${
                              imp.status === 'completed' ? 'text-green-600 border-green-200 dark:border-green-800' :
                              imp.status === 'failed' ? 'text-red-600 border-red-200 dark:border-red-800' :
                              'text-blue-600 border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            {statusLabel(imp.status)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(imp)}
                            disabled={deletingId === imp.id}
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Import löschen</span>
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-md border border-border bg-card px-2 py-1">{formatDay(imp.created_at)}</span>
                        <span className="rounded-md border border-border bg-card px-2 py-1">{imp.product_count} Produkte</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <UploadCsv onImport={loadImports} />
          <div className="panel p-4">
            <p className="text-sm font-semibold">Gesamtübersicht</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-border bg-muted/25 p-3">
                <p className="text-muted-foreground">Abgeschlossen</p>
                <p className="mt-1 text-lg font-semibold">{completedImports}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/25 p-3">
                <p className="text-muted-foreground">Produkte</p>
                <p className="mt-1 text-lg font-semibold">{totalProducts}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import löschen</DialogTitle>
            <DialogDescription>
              {deleteTarget?.filename.replace(/\.csv$/i, '')} mit {deleteTarget?.product_count} Produkten wird entfernt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={Boolean(deletingId)} />}>
              Abbrechen
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteImport(deleteTarget)}
              disabled={Boolean(deletingId)}
            >
              {deletingId ? 'Lösche...' : 'Löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

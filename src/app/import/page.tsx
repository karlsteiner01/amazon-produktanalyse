'use client'

import { useData } from '@/lib/store'
import { groupParents } from '@/lib/scoring'
import { UploadCsv } from '@/components/dashboard/upload-csv'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileSpreadsheet, Trash2, Check, Eye, Layers } from 'lucide-react'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function ImportPage() {
  const { ready, imports, selectedImportId, selectImport, deleteImport } = useData()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Daten</p>
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Import</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Helium-10 Xray-Exporte hochladen und verwalten. Alles liegt lokal in deinem Browser —
          kein Account, keine Datenbank nötig.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <UploadCsv />

        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-muted/35 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold">Importe</h3>
              <p className="text-xs text-muted-foreground">{imports.length} gespeichert</p>
            </div>
            {imports.length > 1 && (
              <Button
                variant={selectedImportId === null ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => selectImport(null)}
              >
                Alle anzeigen
              </Button>
            )}
          </div>

          {!ready || imports.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <FileSpreadsheet className="size-5" />
              </div>
              <p className="text-sm font-medium">{ready ? 'Noch keine Importe' : 'Lade…'}</p>
              {ready && <p className="mt-1 text-xs text-muted-foreground">Lade links eine CSV hoch, um zu starten.</p>}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {imports.map((imp) => {
                const parentCount = groupParents(imp.products).length
                const active = selectedImportId === imp.id
                return (
                  <div key={imp.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <FileSpreadsheet className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{imp.filename.replace(/\.csv$/i, '')}</p>
                        {active && (
                          <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                            <Check className="size-3" /> aktiv
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span>{formatDate(imp.created_at)}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1"><Layers className="size-3" /> {parentCount} Produkte / {imp.products.length} ASINs</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!active && (
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => selectImport(imp.id)}>
                          <Eye className="size-3.5" /> Anzeigen
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Import „${imp.filename}" löschen?`)) deleteImport(imp.id)
                        }}
                        aria-label="Import löschen"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

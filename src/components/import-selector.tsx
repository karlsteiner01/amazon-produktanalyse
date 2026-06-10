'use client'

import { useData } from '@/lib/store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'

/** Globale Import-Auswahl (Scope), verbunden mit dem Daten-Store. */
export function ImportSelector() {
  const { imports, selectedImportId, selectImport } = useData()
  if (imports.length <= 1) return null

  const selected = imports.find((item) => item.id === selectedImportId)
  const label = selected?.filename.replace(/\.csv$/i, '') || 'Alle Imports'

  return (
    <Select
      value={selectedImportId || 'all'}
      onValueChange={(val) => selectImport(val === 'all' ? null : (val as string))}
    >
      <SelectTrigger className="h-9 w-40 min-w-0 text-xs sm:w-52">
        <span className="truncate text-left">{label}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all" className="text-xs">
          Alle Imports
        </SelectItem>
        {imports.map((imp) => (
          <SelectItem key={imp.id} value={imp.id} className="text-xs">
            {imp.filename.replace(/\.csv$/i, '')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

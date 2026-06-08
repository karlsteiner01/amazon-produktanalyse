'use client'

import type { CsvImport } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'

interface ImportSelectorProps {
  imports: CsvImport[]
  selectedImportId: string | null
  onSelect: (id: string | null) => void
}

export function ImportSelector({ imports, selectedImportId, onSelect }: ImportSelectorProps) {
  if (imports.length <= 1) return null

  const selectedImport = imports.find((item) => item.id === selectedImportId)
  const selectedLabel = selectedImport?.filename.replace(/\.csv$/i, '') || 'Alle Imports'

  return (
    <Select value={selectedImportId || 'all'} onValueChange={(val) => onSelect(val === 'all' ? null : val)}>
      <SelectTrigger className="h-9 w-full min-w-0 sm:w-56 text-xs">
        <span className="truncate text-left">{selectedLabel}</span>
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

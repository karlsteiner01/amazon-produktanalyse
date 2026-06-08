'use client'

import type { CsvImport } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ImportSelectorProps {
  imports: CsvImport[]
  selectedImportId: string | null
  onSelect: (id: string) => void
}

export function ImportSelector({ imports, selectedImportId, onSelect }: ImportSelectorProps) {
  if (imports.length <= 1) return null

  return (
      <Select value={selectedImportId || undefined} onValueChange={(val) => val && onSelect(val)}>
      <SelectTrigger className="w-48 h-8 text-xs">
        <SelectValue placeholder="Import wählen..." />
      </SelectTrigger>
      <SelectContent>
        {imports.map((imp) => (
          <SelectItem key={imp.id} value={imp.id} className="text-xs">
            {imp.filename.replace(/\.csv$/i, '')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
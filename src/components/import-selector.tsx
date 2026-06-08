'use client'

import { useImport } from '@/hooks/use-import'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ImportSelector() {
  const { imports, selectedImportId, switchImport, refreshImports } = useImport()

  if (imports.length <= 1) return null

  return (
      <Select value={selectedImportId || undefined} onValueChange={(val) => val && switchImport(val)}>
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

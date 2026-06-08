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
  const { imports, selectedImportId, switchImport } = useImport()

  if (imports.length <= 1) return null

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
      <Select value={selectedImportId || undefined} onValueChange={(val) => val && switchImport(val)}>
      <SelectTrigger className="w-56 h-8 text-xs">
        <SelectValue placeholder="Import wählen..." />
      </SelectTrigger>
      <SelectContent>
        {imports.map((imp) => (
          <SelectItem key={imp.id} value={imp.id} className="text-xs">
            {imp.filename} ({formatDate(imp.created_at)})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

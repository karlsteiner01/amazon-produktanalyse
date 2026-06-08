'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { CsvImport } from '@/types'

export function useImport() {
  const [imports, setImports] = useState<CsvImport[]>([])
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await (getSupabase() as any)
        .from('csv_imports')
        .select('*')
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        setImports(data)
        const stored = localStorage.getItem('selected-import-id')
        const exists = stored ? data.some((i: CsvImport) => i.id === stored) : false
        setSelectedImportId(exists ? stored : data[0].id)
      } else {
        setSelectedImportId(null)
      }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (selectedImportId) {
      localStorage.setItem('selected-import-id', selectedImportId)
    }
  }, [selectedImportId])

  const switchImport = useCallback((id: string) => {
    setSelectedImportId(id)
  }, [])

  const refreshImports = useCallback(async (newImportId?: string) => {
    const { data } = await (getSupabase() as any)
      .from('csv_imports')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setImports(data)
      if (newImportId) {
        setSelectedImportId(newImportId)
        localStorage.setItem('selected-import-id', newImportId)
      }
    }
  }, [])

  const selectedImport = imports.find(i => i.id === selectedImportId) || null

  return { imports, selectedImportId, selectedImport, switchImport, refreshImports, loading }
}

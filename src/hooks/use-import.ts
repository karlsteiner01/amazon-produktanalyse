'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { CsvImport } from '@/types'

export function useImport() {
  const [imports, setImports] = useState<CsvImport[]>([])
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { data } = await getSupabase()
          .from('csv_imports')
          .select('*')
          .order('created_at', { ascending: false })

        if (cancelled) return

        const importRows = (data || []) as unknown as CsvImport[]
        if (importRows.length > 0) {
          setImports(importRows)
          const stored = localStorage.getItem('selected-import-id')
          const exists = stored ? importRows.some((i) => i.id === stored) : false
          setSelectedImportId(stored === 'all' || !stored ? null : exists ? stored : null)
        } else {
          setSelectedImportId(null)
        }
      } catch {
        if (cancelled) return
        setImports([])
        setSelectedImportId(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (selectedImportId) {
      localStorage.setItem('selected-import-id', selectedImportId)
    } else {
      localStorage.setItem('selected-import-id', 'all')
    }
  }, [selectedImportId])

  const switchImport = useCallback((id: string | null) => {
    setSelectedImportId(id)
  }, [])

  const refreshImports = useCallback(async (newImportId?: string) => {
    try {
      const { data } = await getSupabase()
        .from('csv_imports')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) {
        setImports((data || []) as unknown as CsvImport[])
        if (newImportId) {
          setSelectedImportId(newImportId)
          localStorage.setItem('selected-import-id', newImportId)
        }
      }
    } catch {
      setImports([])
    }
  }, [])

  const selectedImport = imports.find(i => i.id === selectedImportId) || null

  return { imports, selectedImportId, selectedImport, switchImport, refreshImports, loading }
}

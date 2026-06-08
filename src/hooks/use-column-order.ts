'use client'

import { useState, useCallback, useEffect } from 'react'

export function useColumnOrder(storageKey: string, defaultColumns: string[]) {
  const [columns, setColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') return defaultColumns
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch {}
    }
    return defaultColumns
  })

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(columns))
  }, [columns, storageKey])

  const moveColumn = useCallback((fromIndex: number, toIndex: number) => {
    setColumns(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  const resetColumns = useCallback(() => {
    setColumns(defaultColumns)
  }, [defaultColumns])

  return { columns, moveColumn, resetColumns, setColumns }
}

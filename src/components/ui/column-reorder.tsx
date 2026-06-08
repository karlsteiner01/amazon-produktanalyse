'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Settings2, ChevronUp, ChevronDown } from 'lucide-react'

interface ColumnReorderProps {
  columns: { id: string; label: string }[]
  order: string[]
  onOrderChange: (newOrder: string[]) => void
  onReset?: () => void
}

export function ColumnReorder({ columns, order, onOrderChange, onReset }: ColumnReorderProps) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const moveUp = useCallback((index: number) => {
    if (index <= 0) return
    const next = [...order]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onOrderChange(next)
  }, [order, onOrderChange])

  const moveDown = useCallback((index: number) => {
    if (index >= order.length - 1) return
    const next = [...order]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    onOrderChange(next)
  }, [order, onOrderChange])

  const labelMap = new Map(columns.map(c => [c.id, c.label]))

  return (
    <div className="relative">
      <Button
        ref={btnRef}
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => setOpen(!open)}
      >
        <Settings2 className="h-3.5 w-3.5 text-zinc-400" />
      </Button>
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-50 p-2"
        >
          <div className="text-xs font-medium text-zinc-500 px-3 pb-1.5">Spalten anpassen</div>
          <div className="space-y-0.5">
            {order.map((id, index) => (
              <div
                key={id}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <span className="flex-1 truncate">{labelMap.get(id) || id}</span>
                <div className="flex gap-0.5 shrink-0">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === order.length - 1}
                    className="p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-zinc-500 mt-1"
              onClick={() => { onReset(); setOpen(false) }}
            >
              Zurücksetzen
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

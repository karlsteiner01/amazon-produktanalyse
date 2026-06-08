'use client'

import { useState, useCallback } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Settings2, ChevronUp, ChevronDown } from 'lucide-react'

interface ColumnReorderProps {
  columns: { id: string; label: string }[]
  order: string[]
  onOrderChange: (newOrder: string[]) => void
  onReset?: () => void
}

export function ColumnReorder({ columns, order, onOrderChange, onReset }: ColumnReorderProps) {
  const labelMap = new Map(columns.map(c => [c.id, c.label]))

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Settings2 className="h-3.5 w-3.5 text-zinc-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2">
        <div className="text-xs font-medium text-zinc-500 px-3 pb-1.5">Spalten anpassen</div>
        <div className="space-y-0.5">
          {order.map((id, index) => (
            <div
              key={id}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="flex-1">{labelMap.get(id) || id}</span>
              <div className="flex gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); moveUp(index) }}
                  disabled={index === 0}
                  className="p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveDown(index) }}
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
            onClick={onReset}
          >
            Zurücksetzen
          </Button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

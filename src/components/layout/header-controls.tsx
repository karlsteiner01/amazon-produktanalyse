'use client'

import { useState } from 'react'
import { useData } from '@/lib/store'
import { ImportSelector } from '@/components/import-selector'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal } from 'lucide-react'

/** Globale Steuerung im Header: Import-Scope + Margen-Annahme (Wareneinsatz). */
export function HeaderControls() {
  const { config, setConfig, imports } = useData()
  const [open, setOpen] = useState(false)
  const cogsPct = Math.round(config.cogsPct * 100)

  return (
    <>
      <ImportSelector />

      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <SlidersHorizontal className="size-3.5" />
          <span className="hidden text-xs sm:inline">Marge-Annahme</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
            {cogsPct}%
          </span>
        </Button>

        {open && (
          <>
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
              <p className="text-sm font-semibold">Margen-Annahme</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Marge je Stück = Verkaufspreis − Amazon-Gebühren − Wareneinsatz.
                Gebühren kommen aus der CSV (sonst geschätzt). Den Wareneinsatz
                kennst nur du — stell ihn hier ein.
              </p>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium">Wareneinsatz (COGS)</span>
                  <span className="font-semibold tabular-nums">{cogsPct}% vom VK</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={70}
                  step={1}
                  value={cogsPct}
                  onChange={(e) => setConfig({ cogsPct: Number(e.target.value) / 100 })}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                />
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>5%</span>
                  <span>günstiger Einkauf · teurer Einkauf</span>
                  <span>70%</span>
                </div>
              </div>

              <p className="mt-4 rounded-md border border-border/70 bg-muted/40 px-3 py-2 text-[11px] leading-4 text-muted-foreground">
                Gilt für alle Produkte{imports.length > 0 ? ' im aktuellen Datensatz' : ''}.
                Wirkt sofort auf Marge & Scores.
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useData } from '@/lib/store'
import type { ScoredParent } from '@/lib/scoring'
import { tierColor, tierLabel, playColor, playLabel } from '@/lib/scoring'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ProductThumb } from '@/components/product-thumb'
import { Search, ArrowUpDown, PackageSearch } from 'lucide-react'

type SortKey = 'opportunity' | 'price' | 'sales' | 'revenue' | 'margin' | 'sell' | 'improve'

const fmtNum = new Intl.NumberFormat('de-DE')
const eur = (v: number | null) =>
  v != null ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v) : '–'

const PLAYS = ['all', 'Verkaufen', 'Verbessern', 'Beides', 'Meiden'] as const

function value(p: ScoredParent, key: SortKey): number {
  switch (key) {
    case 'price': return p.price ?? 0
    case 'sales': return p.sales
    case 'revenue': return p.revenue
    case 'margin': return p.scores.margin_eur ?? -999
    case 'sell': return p.scores.sell_score
    case 'improve': return p.scores.improve_score
    default: return p.scores.opportunity_score
  }
}

export default function ProduktePage() {
  const router = useRouter()
  const { ready, imports, parents } = useData()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('opportunity')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [playFilter, setPlayFilter] = useState<(typeof PLAYS)[number]>('all')

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const filtered = parents
    .filter((p) => {
      if (playFilter !== 'all' && p.scores.play !== playFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const rep = p.representative
        if (
          !rep.product_details?.toLowerCase().includes(q) &&
          !rep.asin?.toLowerCase().includes(q) &&
          !rep.brand?.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
    .sort((a, b) => {
      const av = value(a, sortKey)
      const bv = value(b, sortKey)
      return sortDir === 'desc' ? bv - av : av - bv
    })

  function SortHead({ label, k, align = 'right' }: { label: string; k: SortKey; align?: 'left' | 'right' }) {
    const active = sortKey === k
    return (
      <TableHead
        className={`cursor-pointer select-none text-xs font-medium ${align === 'right' ? 'text-right' : ''}`}
        onClick={() => toggleSort(k)}
      >
        <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
          {label}
          <ArrowUpDown className={`size-3 transition-opacity ${active ? 'opacity-100' : 'opacity-30'} ${active && sortDir === 'asc' ? 'rotate-180' : ''}`} />
        </div>
      </TableHead>
    )
  }

  if (!ready) {
    return <div className="panel p-8"><p className="text-sm text-muted-foreground">Lade Produkte…</p></div>
  }

  if (imports.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold sm:text-3xl">Produkte</h2>
        <div className="panel flex flex-col items-center p-12 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <PackageSearch className="size-5" />
          </div>
          <p className="text-sm font-medium">Noch keine Daten</p>
          <p className="mt-1 text-xs text-muted-foreground">Importiere zuerst einen Helium-10 Export auf der Übersicht.</p>
          <Button className="mt-4 h-9" onClick={() => router.push('/')}>Zur Übersicht</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Screening</p>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Produkte</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Eine Zeile pro Produkt-Familie. Sortiere nach Score, Marge oder Nachfrage und öffne Details.
          </p>
        </div>
        <Badge variant="outline" className="h-8 w-fit justify-center border-border bg-card text-muted-foreground">
          {filtered.length} von {parents.length}
        </Badge>
      </div>

      <div className="panel flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Produkt, Marke oder ASIN suchen"
            className="h-9 pl-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {PLAYS.map((t) => (
            <Button
              key={t}
              variant={playFilter === t ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-8 text-xs ${playFilter === t ? '' : 'text-muted-foreground'}`}
              onClick={() => setPlayFilter(t)}
            >
              {t === 'all' ? 'Alle' : playLabel(t)}
            </Button>
          ))}
        </div>
      </div>

      <div className="data-table-wrap overflow-x-auto">
        <Table className="min-w-[1080px]">
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="w-14" />
              <TableHead className="text-xs font-medium">Produkt</TableHead>
              <SortHead label="Preis" k="price" />
              <SortHead label="Verkäufe" k="sales" />
              <SortHead label="Umsatz" k="revenue" />
              <SortHead label="Marge/St." k="margin" />
              <TableHead className="text-right text-xs font-medium">Rating</TableHead>
              <TableHead className="text-right text-xs font-medium">Reviews</TableHead>
              <SortHead label="Verkaufen" k="sell" />
              <SortHead label="Verbessern" k="improve" />
              <TableHead className="text-right text-xs font-medium">Strategie</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-40 text-center text-sm text-muted-foreground">
                  Keine Produkte gefunden. Filter anpassen.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const rep = p.representative
                const s = p.scores
                return (
                  <TableRow
                    key={p.key}
                    className="cursor-pointer hover:bg-muted/60"
                    onClick={() => router.push(`/produkte/${rep.asin}`)}
                  >
                    <TableCell className="p-2">
                      <ProductThumb src={rep.image_url} title={rep.product_details} />
                    </TableCell>
                    <TableCell className="max-w-[320px]">
                      <p className="truncate text-xs font-medium" title={rep.product_details}>
                        {rep.product_details}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                        <span>{rep.brand || '–'}</span>
                        {p.variant_count > 1 && (
                          <span className="rounded bg-muted px-1 py-px text-[10px] font-medium">
                            {p.variant_count} Varianten
                          </span>
                        )}
                      </p>
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{eur(p.price)}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{fmtNum.format(p.sales)}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{eur(p.revenue)}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {s.margin_eur != null ? (
                        <span className={s.margin_eur < 3 ? 'text-amber-600 dark:text-amber-400' : ''}>
                          {eur(s.margin_eur)}
                        </span>
                      ) : '–'}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{p.rating ?? '–'}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{fmtNum.format(p.review_count)}</TableCell>
                    <TableCell className="text-right text-xs font-semibold tabular-nums" style={{ color: '#0ea5e9' }}>{s.sell_score}</TableCell>
                    <TableCell className="text-right text-xs font-semibold tabular-nums" style={{ color: '#8b5cf6' }}>{s.improve_score}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: playColor(s.play) + '1a',
                          color: playColor(s.play),
                          borderColor: playColor(s.play) + '40',
                        }}
                        className="text-[10px]"
                      >
                        {playLabel(s.play)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

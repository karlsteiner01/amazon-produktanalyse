'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from "@/lib/supabase"
import type { Product, Analysis } from '@/types'
import { tierColor, tierLabel } from '@/lib/scoring'
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
import { Search, ArrowUpDown, PackageSearch, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useColumnOrder } from '@/hooks/use-column-order'
import { useImport } from '@/hooks/use-import'
import { ImportSelector } from '@/components/import-selector'

type ProductWithAnalysis = Product & { analysis?: Analysis }
type SortKey = 'asin_sales' | 'asin_revenue' | 'price_eur' | 'opportunity_score'
type SortDir = 'asc' | 'desc'
type ColumnId = 'image' | 'product' | 'brand' | 'asin' | 'price_eur' | 'asin_sales' | 'asin_revenue' | 'rating' | 'review_count' | 'is_fba' | 'opportunity_score' | 'product_tier'

const DEFAULT_COLUMNS: ColumnId[] = [
  'image', 'product', 'brand', 'asin', 'price_eur', 'asin_sales', 'asin_revenue',
  'rating', 'review_count', 'is_fba', 'opportunity_score', 'product_tier',
]

function ProductThumb({ src, title }: { src: string | null; title: string }) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-white p-1 shadow-sm dark:bg-muted">
      {showImage ? (
        <img
          src={src}
          alt={title ? `${title} Produktbild` : 'Produktbild'}
          className="block h-full w-full max-w-none object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <PackageSearch className="size-5 text-muted-foreground" />
      )}
    </div>
  )
}

export default function ProduktePage() {
  const router = useRouter()
  const [products, setProducts] = useState<ProductWithAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('opportunity_score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const { columns: columnOrder, setColumns, resetColumns } = useColumnOrder('produkte-columns', DEFAULT_COLUMNS)
  const { imports, selectedImportId, switchImport } = useImport()
  const dragCol = useRef<ColumnId | null>(null)
  const dropCol = useRef<ColumnId | null>(null)

  useEffect(() => {
    async function load() {
      let query = getSupabase()
        .from('products')
        .select('*')

      if (selectedImportId) {
        query = query.eq('import_id', selectedImportId)
      }

      const { data: pData } = await query.order('created_at', { ascending: false })
      const productRows = (pData || []) as unknown as Product[]

      const { data: aData } = await getSupabase().from('analyses').select('*')
      const analysisRows = (aData || []) as unknown as Analysis[]
      const analysisMap = new Map<string, Analysis>()
      analysisRows.forEach((a) => analysisMap.set(a.product_id, a))

      setProducts(
        productRows.map((p) => ({
          ...p,
          analysis: analysisMap.get(p.id),
        }))
      )
      setLoading(false)
    }
    load()
  }, [selectedImportId])

  const filtered = products
    .filter((p) => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !p.product_details?.toLowerCase().includes(q) &&
          !p.asin?.toLowerCase().includes(q) &&
          !p.brand?.toLowerCase().includes(q)
        ) return false
      }
      if (tierFilter !== 'all' && p.analysis?.product_tier !== tierFilter) return false
      return true
    })
    .sort((a, b) => {
      let aVal: number
      let bVal: number
      if (sortKey === 'opportunity_score') {
        aVal = a.analysis?.opportunity_score ?? 0
        bVal = b.analysis?.opportunity_score ?? 0
      } else {
        aVal = a[sortKey] ?? 0
        bVal = b[sortKey] ?? 0
      }
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    })

  const formatEur = (v: number | null) =>
    v ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v) : '–'

  const formatNumber = (v: number | null) =>
    v ? new Intl.NumberFormat('de-DE').format(v) : '–'

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function handleDragStart(colId: ColumnId) {
    dragCol.current = colId
  }

  function handleDragOver(e: React.DragEvent, colId: ColumnId) {
    e.preventDefault()
    dropCol.current = colId
  }

  function handleDragEnd() {
    const from = dragCol.current
    const to = dropCol.current
    dragCol.current = null
    dropCol.current = null
    if (!from || !to || from === to) return

    const fromIdx = columnOrder.indexOf(from)
    const toIdx = columnOrder.indexOf(to)
    if (fromIdx === -1 || toIdx === -1) return

    const next = [...columnOrder]
    next.splice(fromIdx, 1)
    next.splice(toIdx, 0, from)
    setColumns(next)
  }

  function SortHeader({ label, sortKey: sk, colId }: { label: string; sortKey: SortKey; colId: ColumnId }) {
    const isActive = sortKey === sk
    return (
      <TableHead
        draggable
        onDragStart={() => handleDragStart(colId)}
        onDragOver={(e) => handleDragOver(e, colId)}
        onDragEnd={handleDragEnd}
        className="text-xs font-medium cursor-pointer select-none"
        onClick={() => toggleSort(sk)}
      >
        <div className="flex items-center gap-1">
          {label}
          {isActive && (
            <ArrowUpDown className={`h-3 w-3 transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
          )}
        </div>
      </TableHead>
    )
  }

  function StaticHeader({ label, colId }: { label: string; colId: ColumnId }) {
    return (
      <TableHead
        draggable
        onDragStart={() => handleDragStart(colId)}
        onDragOver={(e) => handleDragOver(e, colId)}
        onDragEnd={handleDragEnd}
        className="text-xs font-medium cursor-grab active:cursor-grabbing"
      >
        {label}
      </TableHead>
    )
  }

  function RightHeader({ label, colId }: { label: string; colId: ColumnId }) {
    return (
      <TableHead
        draggable
        onDragStart={() => handleDragStart(colId)}
        onDragOver={(e) => handleDragOver(e, colId)}
        onDragEnd={handleDragEnd}
        className="text-xs font-medium text-right cursor-grab active:cursor-grabbing"
      >
        {label}
      </TableHead>
    )
  }

  function renderHeader(colId: ColumnId) {
    if (colId === 'image') return <TableHead key={colId} className="w-16 min-w-16" />
    if (colId === 'product') return <StaticHeader key={colId} label="Produkt" colId={colId} />
    if (colId === 'brand') return <StaticHeader key={colId} label="Marke" colId={colId} />
    if (colId === 'asin') return <StaticHeader key={colId} label="ASIN" colId={colId} />
    if (colId === 'price_eur') return <SortHeader key={colId} label="Preis" sortKey="price_eur" colId={colId} />
    if (colId === 'asin_sales') return <SortHeader key={colId} label="Verkäufe" sortKey="asin_sales" colId={colId} />
    if (colId === 'asin_revenue') return <SortHeader key={colId} label="Umsatz" sortKey="asin_revenue" colId={colId} />
    if (colId === 'rating') return <RightHeader key={colId} label="Rating" colId={colId} />
    if (colId === 'review_count') return <RightHeader key={colId} label="Reviews" colId={colId} />
    if (colId === 'is_fba') return <RightHeader key={colId} label="FBA" colId={colId} />
    if (colId === 'opportunity_score') return <SortHeader key={colId} label="Score" sortKey="opportunity_score" colId={colId} />
    if (colId === 'product_tier') return <RightHeader key={colId} label="Tier" colId={colId} />
    return null
  }

  function renderCell(colId: ColumnId, p: ProductWithAnalysis) {
    if (colId === 'image') return (
      <TableCell key={colId} className="w-16 min-w-16 p-2">
        <ProductThumb src={p.image_url} title={p.product_details || p.asin} />
      </TableCell>
    )
    if (colId === 'product') return (
      <TableCell key={colId} className="w-[360px] min-w-[360px] max-w-[360px] truncate text-xs font-medium" title={p.product_details || ''}>{p.product_details}</TableCell>
    )
    if (colId === 'brand') return <TableCell key={colId} className="text-xs text-muted-foreground">{p.brand}</TableCell>
    if (colId === 'asin') return <TableCell key={colId} className="text-xs font-mono text-muted-foreground">{p.asin}</TableCell>
    if (colId === 'price_eur') return <TableCell key={colId} className="text-xs text-right">{formatEur(p.price_eur)}</TableCell>
    if (colId === 'asin_sales') return <TableCell key={colId} className="text-xs text-right">{formatNumber(p.asin_sales)}</TableCell>
    if (colId === 'asin_revenue') return <TableCell key={colId} className="text-xs text-right">{formatEur(p.asin_revenue)}</TableCell>
    if (colId === 'rating') return <TableCell key={colId} className="text-xs text-right">{p.rating ?? '–'}</TableCell>
    if (colId === 'review_count') return <TableCell key={colId} className="text-xs text-right">{formatNumber(p.review_count)}</TableCell>
    if (colId === 'is_fba') return (
      <TableCell key={colId} className="text-xs text-right">
        {p.is_fba ? <span className="text-emerald-600 dark:text-emerald-400">Ja</span> : <span className="text-muted-foreground">Nein</span>}
      </TableCell>
    )
    if (colId === 'opportunity_score') return (
      <TableCell key={colId} className="text-xs text-right font-medium">{p.analysis?.opportunity_score ?? '–'}</TableCell>
    )
    if (colId === 'product_tier') return (
      <TableCell key={colId} className="text-xs text-right">
        {p.analysis?.product_tier && (
          <Badge
            style={{
              backgroundColor: tierColor(p.analysis.product_tier) + '20',
              color: tierColor(p.analysis.product_tier),
              borderColor: tierColor(p.analysis.product_tier) + '40',
            }}
            variant="outline"
          >{tierLabel(p.analysis.product_tier)}</Badge>
        )}
      </TableCell>
    )
    return null
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Screening</p>
          <h2 className="text-2xl font-semibold sm:text-3xl">Produkte</h2>
        </div>
        <div className="panel p-8">
          <p className="text-sm text-muted-foreground">Lade Produkte...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Screening</p>
          <h2 className="text-2xl font-semibold sm:text-3xl">Produkte</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Sortiere Kandidaten nach Score, Umsatz, Preis oder Nachfrage und öffne Details für die nächste Prüfung.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ImportSelector imports={imports} selectedImportId={selectedImportId} onSelect={switchImport} />
          <Badge variant="outline" className="h-8 justify-center border-border bg-card text-muted-foreground">
            {filtered.length} Produkte
          </Badge>
        </div>
      </div>

      <div className="panel flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Produkt, Marke oder ASIN suchen"
            className="h-9 pl-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="size-3.5" />
            Tier
          </div>
          {['all', 'A', 'B', 'C', 'Ablehnen'].map((t) => (
            <Button
              key={t}
              variant={tierFilter === t ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-8 text-xs ${tierFilter === t ? '' : 'text-muted-foreground'}`}
              onClick={() => setTierFilter(t)}
            >
              {t === 'all' ? 'Alle' : tierLabel(t)}
            </Button>
          ))}
          {columnOrder.join(',') !== DEFAULT_COLUMNS.join(',') && (
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={resetColumns}>
              <RotateCcw className="size-3.5" />
              Spalten
            </Button>
          )}
        </div>
      </div>

      <div className="data-table-wrap">
        <Table className="min-w-[1180px]">
          <TableHeader>
            <TableRow className="bg-muted/60">
              {columnOrder.map((colId) => renderHeader(colId as ColumnId))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnOrder.length} className="h-44 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <PackageSearch className="size-5" />
                    </div>
                    <p className="text-sm font-medium">Keine Produkte gefunden</p>
                    <p className="mt-1 text-xs text-muted-foreground">Passe Suche oder Tier-Filter an.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer hover:bg-muted/60"
                  onClick={() => router.push(`/produkte/${p.id}`)}
                >
                  {columnOrder.map((colId) => renderCell(colId as ColumnId, p))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

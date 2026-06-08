'use client'

import { useEffect, useState } from 'react'
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
import { Search, ArrowUpDown } from 'lucide-react'

type ProductWithAnalysis = Product & { analysis?: Analysis }
type SortKey = 'asin_sales' | 'asin_revenue' | 'price_eur' | 'opportunity_score'
type SortDir = 'asc' | 'desc'

export default function ProduktePage() {
  const router = useRouter()
  const [products, setProducts] = useState<ProductWithAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('opportunity_score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [tierFilter, setTierFilter] = useState<string>('all')

  useEffect(() => {
    async function load() {
      const { data: pData } = await (getSupabase() as any)
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: aData } = await (getSupabase() as any).from('analyses').select('*')
      const analysisMap = new Map<string, Analysis>()
      if (aData) aData.forEach((a: Analysis) => analysisMap.set(a.product_id, a))

      setProducts(
        (pData || []).map((p: Product) => ({
          ...p,
          analysis: analysisMap.get(p.id),
        }))
      )
      setLoading(false)
    }
    load()
  }, [])

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
        aVal = (a as any)[sortKey] ?? 0
        bVal = (b as any)[sortKey] ?? 0
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

  function SortHeader({ label, sortKey: sk }: { label: string; sortKey: SortKey }) {
    const isActive = sortKey === sk
    return (
      <TableHead
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

  if (loading) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-6">Produkte</h2>
        <p className="text-sm text-zinc-500">Lade Produkte...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Produkte</h2>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Suchen..."
            className="pl-8 text-xs h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {['all', 'A', 'B', 'C', 'Ablehnen'].map((t) => (
            <Button
              key={t}
              variant={tierFilter === t ? 'secondary' : 'ghost'}
              size="sm"
              className={`text-xs h-8 ${tierFilter === t ? '' : 'text-zinc-500'}`}
              onClick={() => setTierFilter(t)}
            >
              {t === 'all' ? 'Alle' : tierLabel(t)}
            </Button>
          ))}
        </div>
        <p className="text-xs text-zinc-400 ml-auto">{filtered.length} Produkte</p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 dark:bg-zinc-800/50">
              <TableHead className="text-xs font-medium">Produkt</TableHead>
              <TableHead className="text-xs font-medium">Marke</TableHead>
              <TableHead className="text-xs font-medium">ASIN</TableHead>
              <SortHeader label="Preis" sortKey="price_eur" />
              <SortHeader label="Verkäufe" sortKey="asin_sales" />
              <SortHeader label="Umsatz" sortKey="asin_revenue" />
              <TableHead className="text-xs font-medium text-right">Rating</TableHead>
              <TableHead className="text-xs font-medium text-right">Reviews</TableHead>
              <TableHead className="text-xs font-medium text-right">FBA</TableHead>
              <SortHeader label="Score" sortKey="opportunity_score" />
              <TableHead className="text-xs font-medium text-right">Tier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow
                key={p.id}
                className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                onClick={() => router.push(`/produkte/${p.id}`)}
              >
                <TableCell className="max-w-[220px] truncate text-xs">
                  {p.product_details}
                </TableCell>
                <TableCell className="text-xs">{p.brand}</TableCell>
                <TableCell className="text-xs font-mono text-zinc-500">{p.asin}</TableCell>
                <TableCell className="text-xs text-right">{formatEur(p.price_eur)}</TableCell>
                <TableCell className="text-xs text-right">{formatNumber(p.asin_sales)}</TableCell>
                <TableCell className="text-xs text-right">{formatEur(p.asin_revenue)}</TableCell>
                <TableCell className="text-xs text-right">{p.rating ?? '–'}</TableCell>
                <TableCell className="text-xs text-right">{formatNumber(p.review_count)}</TableCell>
                <TableCell className="text-xs text-right">
                  {p.is_fba ? (
                    <span className="text-green-600 dark:text-green-400">Ja</span>
                  ) : (
                    <span className="text-zinc-400">Nein</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-right font-medium">
                  {p.analysis?.opportunity_score ?? '–'}
                </TableCell>
                <TableCell className="text-xs text-right">
                  {p.analysis?.product_tier && (
                    <Badge
                      style={{
                        backgroundColor: tierColor(p.analysis.product_tier) + '20',
                        color: tierColor(p.analysis.product_tier),
                        borderColor: tierColor(p.analysis.product_tier) + '40',
                      }}
                      variant="outline"
                    >
                      {tierLabel(p.analysis.product_tier)}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

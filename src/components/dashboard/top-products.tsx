'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { tierColor, tierLabel } from '@/lib/scoring'
import type { Product, Analysis } from '@/types'

interface TopProductsProps {
  products: (Product & { analysis?: Analysis })[]
  title: string
  sortBy: 'sales' | 'score'
}

export function TopProducts({ products, title, sortBy }: TopProductsProps) {
  const sorted = [...products].sort((a, b) => {
    if (sortBy === 'sales') return (b.asin_sales ?? 0) - (a.asin_sales ?? 0)
    return (b.analysis?.opportunity_score ?? 0) - (a.analysis?.opportunity_score ?? 0)
  })

  const top = sorted.slice(0, 5)

  const formatEur = (v: number | null) =>
    v ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v) : '–'

  const formatNumber = (v: number | null) =>
    v ? new Intl.NumberFormat('de-DE').format(v) : '–'

  return (
    <div>
      <h3 className="text-sm font-medium mb-3 text-zinc-700 dark:text-zinc-300">{title}</h3>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 dark:bg-zinc-800/50">
              <TableHead className="text-xs font-medium">Produkt</TableHead>
              <TableHead className="text-xs font-medium text-right">Marke</TableHead>
              <TableHead className="text-xs font-medium text-right">Verkäufe</TableHead>
              <TableHead className="text-xs font-medium text-right">Umsatz</TableHead>
              {sortBy === 'score' && (
                <TableHead className="text-xs font-medium text-right">Score</TableHead>
              )}
              <TableHead className="text-xs font-medium text-right">Tier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {top.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="max-w-[200px] truncate text-xs">
                  {p.product_details}
                </TableCell>
                <TableCell className="text-xs text-right text-zinc-500">{p.brand}</TableCell>
                <TableCell className="text-xs text-right">{formatNumber(p.asin_sales)}</TableCell>
                <TableCell className="text-xs text-right">{formatEur(p.asin_revenue)}</TableCell>
                {sortBy === 'score' && (
                  <TableCell className="text-xs text-right font-medium">
                    {p.analysis?.opportunity_score ?? '–'}
                  </TableCell>
                )}
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

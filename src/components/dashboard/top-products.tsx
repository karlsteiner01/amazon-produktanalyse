'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { tierColor, tierLabel } from '@/lib/scoring'
import type { Product, Analysis } from '@/types'
import { ArrowUpRight, PackageSearch, Trophy } from 'lucide-react'

interface TopProductsProps {
  products: (Product & { analysis?: Analysis })[]
  title: string
  sortBy: 'sales' | 'score'
}

function ProductThumb({ product }: { product: Product }) {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-white p-1 shadow-sm dark:bg-muted">
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.product_details ? `${product.product_details} Produktbild` : 'Produktbild'}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      ) : (
        <PackageSearch className="size-5 text-muted-foreground" />
      )}
    </div>
  )
}

export function TopProducts({ products, title, sortBy }: TopProductsProps) {
  const router = useRouter()
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
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-border/80 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Trophy className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {sortBy === 'sales' ? 'Nach Verkaufsvolumen sortiert' : 'Nach Score priorisiert'}
            </p>
          </div>
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground" />
      </div>

      <div className="divide-y divide-border">
        {top.map((product, index) => {
          const tier = product.analysis?.product_tier
          const score = product.analysis?.opportunity_score ?? 0

          return (
            <button
              key={product.id}
              type="button"
              className="grid w-full gap-2 px-4 py-2 text-left transition-colors hover:bg-muted/45 md:grid-cols-[1fr_auto] md:items-center"
              onClick={() => router.push(`/produkte/${product.id}`)}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {index + 1}
                </div>
                <ProductThumb product={product} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-5">
                    {product.product_details || 'Unbekanntes Produkt'}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{product.brand || product.asin}</span>
                    {tier && <TierBadge tier={tier} />}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pl-[3.75rem] text-right md:w-[14rem] md:pl-0">
                <Metric
                  label={sortBy === 'score' ? 'Score' : 'Verkäufe'}
                  value={sortBy === 'score' ? (score ? String(score) : '–') : formatNumber(product.asin_sales)}
                />
                <Metric label="Umsatz" value={formatEur(product.asin_revenue)} />
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-muted-foreground">
        {label}
      </div>
      <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function TierBadge({ tier }: { tier: Analysis['product_tier'] }) {
  return (
    <Badge
      style={{
        backgroundColor: tierColor(tier) + '20',
        color: tierColor(tier),
        borderColor: tierColor(tier) + '40',
      }}
      variant="outline"
      className="text-xs"
    >
      {tierLabel(tier)}
    </Badge>
  )
}

'use client'

import { Card, CardContent } from '@/components/ui/card'

interface KpiCardsProps {
  productCount: number
  totalSales: number
  totalRevenue: number
  avgPrice: number
  avgRating: number
  fbaCount: number
}

export function KpiCards({
  productCount,
  totalSales,
  totalRevenue,
  avgPrice,
  avgRating,
  fbaCount,
}: KpiCardsProps) {
  const formatEur = (v: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v)

  const formatNumber = (v: number) =>
    new Intl.NumberFormat('de-DE').format(v)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Produkte</p>
          <p className="text-xl font-semibold">{productCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Geschätzte Verkäufe</p>
          <p className="text-xl font-semibold">{formatNumber(totalSales)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Geschätzter Umsatz</p>
          <p className="text-xl font-semibold">{formatEur(totalRevenue)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Durchschnittspreis</p>
          <p className="text-xl font-semibold">{formatEur(avgPrice)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Bewertung</p>
          <p className="text-xl font-semibold">
            {avgRating ? `${avgRating.toFixed(1)} Sterne` : '–'}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">FBA Anteil</p>
          <p className="text-xl font-semibold">{fbaCount} / {productCount}</p>
        </CardContent>
      </Card>
    </div>
  )
}

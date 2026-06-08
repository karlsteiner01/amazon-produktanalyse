'use client'

import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, Boxes, Euro, PackageCheck, ShoppingCart, Star } from 'lucide-react'

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

  const formatDecimal = (v: number) =>
    new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v)

  const fbaShare = productCount ? Math.round((fbaCount / productCount) * 100) : 0
  const revenuePerProduct = productCount ? totalRevenue / productCount : 0
  const cards = [
    {
      label: 'Produkte',
      value: formatNumber(productCount),
      helper: `${formatNumber(fbaCount)} FBA-Angebote im Set`,
      tone: 'text-sky-600 dark:text-sky-300',
      icon: Boxes,
    },
    {
      label: 'Geschätzte Verkäufe',
      value: formatNumber(totalSales),
      helper: 'Monatlicher Sales-Pool',
      tone: 'text-emerald-600 dark:text-emerald-300',
      icon: ShoppingCart,
    },
    {
      label: 'Geschätzter Umsatz',
      value: formatEur(totalRevenue),
      helper: `${formatEur(revenuePerProduct)} je Produkt`,
      tone: 'text-amber-600 dark:text-amber-300',
      icon: Euro,
    },
    {
      label: 'Durchschnittspreis',
      value: formatEur(avgPrice),
      helper: avgPrice >= 15 && avgPrice <= 80 ? 'Guter Preisbereich' : 'Preisbereich prüfen',
      tone: 'text-violet-600 dark:text-violet-300',
      icon: BarChart3,
    },
    {
      label: 'Bewertung',
      value: avgRating ? formatDecimal(avgRating) : '–',
      helper: avgRating && avgRating < 4.5 ? 'Verbesserungspotenzial' : 'Starke Reviews',
      tone: 'text-rose-600 dark:text-rose-300',
      icon: Star,
    },
    {
      label: 'FBA Anteil',
      value: `${fbaShare}%`,
      helper: `${fbaCount} von ${productCount} Produkten`,
      tone: 'text-teal-600 dark:text-teal-300',
      icon: PackageCheck,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className="metric-card">
            <CardContent className="flex min-h-[154px] flex-col p-4">
              <div className="flex min-h-10 items-start justify-between gap-3">
                <p className="max-w-[10rem] text-xs font-medium leading-5 text-muted-foreground">
                  {card.label}
                </p>
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted ${card.tone}`}>
                  <Icon className="size-4" />
                </div>
              </div>
              <p className="mt-4 whitespace-nowrap text-2xl font-semibold leading-none tabular-nums tracking-normal text-foreground">
                {card.value}
              </p>
              <div className="mt-auto border-t border-border pt-3">
                <p className="text-xs leading-5 text-muted-foreground">
                {card.helper}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

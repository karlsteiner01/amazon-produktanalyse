import type { CsvParsedProduct } from '@/types'

export interface ProductScores {
  demand_score: number
  revenue_score: number
  competition_score: number
  margin_score: number
  improvement_score: number
  risk_score: number
  opportunity_score: number
  product_tier: 'A' | 'B' | 'C' | 'Ablehnen'
}

export function computeScores(products: CsvParsedProduct[]): Map<string, ProductScores> {
  const scores = new Map<string, ProductScores>()
  const n = products.length
  if (n === 0) return scores

  const salesValues = products.map((p) => p.asin_sales ?? 0)
  const revenueValues = products.map((p) => p.asin_revenue ?? 0)
  const bsrValues = products.map((p) => p.bsr ?? 0)
  const reviewValues = products.map((p) => p.review_count ?? 0)
  const sellerValues = products.map((p) => p.active_sellers ?? 1)
  const priceValues = products.map((p) => p.price_eur ?? 0)
  const ratingValues = products.map((p) => p.rating ?? 4.0)

  const salesMax = Math.max(...salesValues, 1)
  const salesMin = Math.min(...salesValues, 0)
  const salesRange = salesMax - salesMin || 1

  const revenueMax = Math.max(...revenueValues, 1)
  const revenueMin = Math.min(...revenueValues, 0)
  const revenueRange = revenueMax - revenueMin || 1

  const bsrMax = Math.max(...bsrValues, 1)
  const bsrMin = Math.min(...bsrValues, 0)
  const bsrRange = bsrMax - bsrMin || 1

  const reviewMax = Math.max(...reviewValues, 1)
  const sellerMax = Math.max(...sellerValues, 1)

  for (let i = 0; i < n; i++) {
    const p = products[i]

    const demandSales = ((p.asin_sales ?? 0) - salesMin) / salesRange * 50
    const bsrNorm = 1 - ((p.bsr ?? bsrMax) - bsrMin) / bsrRange
    const demandScore = Math.min(demandSales * 0.7 + bsrNorm * 30, 100)

    const revenueScore = Math.min(
      ((p.asin_revenue ?? 0) - revenueMin) / revenueRange * 100,
      100
    )

    const reviewInv = 1 - (p.review_count ?? 0) / reviewMax
    const sellerInv = 1 - ((p.active_sellers ?? 1) - 1) / Math.max(sellerMax - 1, 1)
    const ratingComp = 1 - (p.rating ?? 4.0) / 5.0
    const competitionScore = Math.min(
      reviewInv * 40 + sellerInv * 40 + ratingComp * 20,
      100
    )

    const price = p.price_eur ?? 0
    let marginScore = 50
    if (price >= 14.99 && price <= 80) {
      marginScore = 80 + (price - 14.99) / (80 - 14.99) * 20
    } else if (price > 0 && price < 14.99) {
      marginScore = (price / 14.99) * 50
    } else if (price > 80) {
      marginScore = 80
    }
    marginScore = Math.min(marginScore, 100)

    if (p.fees_eur && price > 0) {
      const feeRatio = p.fees_eur / price
      marginScore = marginScore * (1 - feeRatio * 0.5)
    }
    marginScore = Math.max(0, Math.min(marginScore, 100))

    const rating = p.rating ?? 4.0
    let improvementScore = 50
    if (rating >= 4.0 && rating <= 4.6) {
      improvementScore = 100
    } else if (rating < 4.0) {
      improvementScore = 100 * (1 - (4.0 - rating) / 4.0)
    } else {
      improvementScore = 100 * (1 - (rating - 4.6) / 0.4)
    }
    improvementScore = Math.max(0, Math.min(improvementScore, 100))

    let riskScore = 50
    if (p.is_fba) riskScore += 10
    if ((p.active_sellers ?? 0) <= 2) riskScore += 15
    if (p.weight_kg && p.weight_kg < 1.0) riskScore += 10
    if (p.weight_kg && p.weight_kg > 5.0) riskScore -= 20
    if (p.bestseller) riskScore -= 15
    riskScore = Math.max(0, Math.min(riskScore, 100))

    const opportunityScore = Math.min(
      demandScore * 0.25 +
      revenueScore * 0.15 +
      competitionScore * 0.20 +
      marginScore * 0.20 +
      improvementScore * 0.10 +
      riskScore * 0.10,
      100
    )

    let tier: 'A' | 'B' | 'C' | 'Ablehnen'
    if (opportunityScore >= 75) tier = 'A'
    else if (opportunityScore >= 60) tier = 'B'
    else if (opportunityScore >= 40) tier = 'C'
    else tier = 'Ablehnen'

    scores.set(p.asin, {
      demand_score: Math.round(demandScore),
      revenue_score: Math.round(revenueScore),
      competition_score: Math.round(competitionScore),
      margin_score: Math.round(marginScore),
      improvement_score: Math.round(improvementScore),
      risk_score: Math.round(riskScore),
      opportunity_score: Math.round(opportunityScore),
      product_tier: tier,
    })
  }

  return scores
}

export function tierLabel(tier: string): string {
  const labels: Record<string, string> = {
    A: 'Stark prüfen',
    B: 'Interessant',
    C: 'Beobachten',
    Ablehnen: 'Nicht verfolgen',
  }
  return labels[tier] || tier
}

export function tierColor(tier: string): string {
  const colors: Record<string, string> = {
    A: '#10b981',
    B: '#f59e0b',
    C: '#f97316',
    Ablehnen: '#ef4444',
  }
  return colors[tier] || '#6b7280'
}

import type { CsvParsedProduct } from '@/types'

// ============================================================================
// Tuning-Parameter — alle Stellschrauben an einem Ort.
// Absolute Schwellen statt reiner Min/Max-Normierung: ein Score bedeutet etwas
// für sich allein, nicht nur "das Beste in dieser Datei".
// ============================================================================
export interface ScoringConfig {
  cogsPct: number // angenommener Wareneinsatz als Anteil vom Verkaufspreis
  feeFallbackPct: number // Referral-Fee-Schätzung, wenn keine Gebühr in der CSV steht
  feeFallbackFix: number // pauschale FBA-Gebühr (€), wenn unbekannt
}

export const DEFAULT_CONFIG: ScoringConfig = {
  cogsPct: 0.3,
  feeFallbackPct: 0.15,
  feeFallbackFix: 3.5,
}

// ---- Hilfsfunktionen ------------------------------------------------------

// Stückweise lineare Interpolation über [input, score]-Stützpunkte.
function lerpScore(value: number, anchors: [number, number][]): number {
  if (value <= anchors[0][0]) return anchors[0][1]
  const last = anchors[anchors.length - 1]
  if (value >= last[0]) return last[1]
  for (let i = 0; i < anchors.length - 1; i++) {
    const [x0, y0] = anchors[i]
    const [x1, y1] = anchors[i + 1]
    if (value >= x0 && value <= x1) {
      const t = (value - x0) / (x1 - x0)
      return y0 + t * (y1 - y0)
    }
  }
  return last[1]
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))

// ============================================================================
// Varianten-Gruppierung
// Helium listet jede ASIN einzeln — aber Farb-/Größen-Varianten eines Produkts
// teilen sich BSR, Reviews und die "übergeordneten" Verkaufs-/Umsatzzahlen.
// Wir fassen sie zu EINEM Eltern-Produkt zusammen, damit dieselbe Chance nicht
// mehrfach in der Liste auftaucht.
// ============================================================================
export interface ParentProduct {
  key: string
  representative: CsvParsedProduct // die meistverkaufte Variante
  variants: CsvParsedProduct[]
  variant_count: number
  sales: number // Familien-Nachfrage (Eltern-Verkäufe, sonst Summe)
  revenue: number // Familien-Umsatz
  review_count: number
  rating: number | null
  bsr: number | null
  price: number | null
}

function parentKey(p: CsvParsedProduct): string {
  // Varianten eines Eltern-Produkts teilen Marke + identische Eltern-Kennzahlen.
  if (p.parent_sales != null && p.parent_revenue != null) {
    return `${p.brand}|${p.parent_sales}|${p.parent_revenue}`
  }
  return `asin:${p.asin}` // keine Eltern-Daten → eigenständig
}

export function groupParents(products: CsvParsedProduct[]): ParentProduct[] {
  const groups = new Map<string, CsvParsedProduct[]>()
  for (const p of products) {
    const key = parentKey(p)
    const arr = groups.get(key)
    if (arr) arr.push(p)
    else groups.set(key, [p])
  }

  const parents: ParentProduct[] = []
  for (const [key, variants] of groups) {
    const rep = variants.reduce((best, v) =>
      (v.asin_sales ?? 0) > (best.asin_sales ?? 0) ? v : best
    )
    const sumSales = variants.reduce((s, v) => s + (v.asin_sales ?? 0), 0)
    const sumRevenue = variants.reduce((s, v) => s + (v.asin_revenue ?? 0), 0)
    parents.push({
      key,
      representative: rep,
      variants,
      variant_count: variants.length,
      sales: rep.parent_sales ?? sumSales,
      revenue: rep.parent_revenue ?? sumRevenue,
      review_count: rep.review_count ?? 0,
      rating: rep.rating,
      bsr: rep.bsr,
      price: rep.price_eur,
    })
  }
  return parents
}

// ============================================================================
// Einzel-Dimensionen (jeweils 0–100, absolut interpretierbar)
// ============================================================================

// Nachfrage: monatliche Verkäufe (Eltern-Ebene).
function demandScore(sales: number): number {
  return lerpScore(sales, [
    [0, 0], [50, 22], [150, 48], [400, 70], [1000, 88], [2500, 100],
  ])
}

// Umsatzpotenzial: monatlicher Umsatz in €.
function revenueScore(revenue: number): number {
  return lerpScore(revenue, [
    [0, 0], [2000, 28], [5000, 52], [10000, 70], [25000, 87], [60000, 100],
  ])
}

// Einstiegschance: hoch = leicht reinzukommen (wenig Review-Mauer).
// Reviews sind die eigentliche Eintrittsbarriere auf Amazon.
function competitionEase(reviews: number, sellers: number | null): number {
  let ease = lerpScore(reviews, [
    [0, 100], [50, 92], [200, 78], [500, 60], [1000, 44],
    [3000, 20], [7000, 6], [15000, 2],
  ])
  // Sehr viele Verkäufer = Commodity / Preiskampf → leichter Abschlag.
  if (sellers != null) {
    if (sellers > 15) ease -= 12
    else if (sellers > 8) ease -= 6
  }
  return clamp(ease)
}

export interface MarginResult {
  eur: number | null
  pct: number | null
  score: number
}

export interface MarginBreakdown {
  price: number
  fee: number
  cogs: number
  eur: number
  pct: number
}

// Nachvollziehbare Margen-Aufschlüsselung für die Detailansicht.
export function marginBreakdown(
  price: number | null,
  fees: number | null,
  cfg: ScoringConfig = DEFAULT_CONFIG
): MarginBreakdown | null {
  if (!price || price <= 0) return null
  const fee = fees != null ? fees : price * cfg.feeFallbackPct + cfg.feeFallbackFix
  const cogs = price * cfg.cogsPct
  const eur = price - fee - cogs
  return { price, fee, cogs, eur, pct: eur / price }
}

// Echte (geschätzte) Marge: VK − Amazon-Gebühren − Wareneinsatz.
function marginParts(
  price: number | null,
  fees: number | null,
  cfg: ScoringConfig
): MarginResult {
  if (!price || price <= 0) return { eur: null, pct: null, score: 40 }
  const fee = fees != null ? fees : price * cfg.feeFallbackPct + cfg.feeFallbackFix
  const cogs = price * cfg.cogsPct
  const eur = price - fee - cogs
  const pct = eur / price
  let score = lerpScore(eur, [
    [-5, 0], [0, 8], [2, 24], [4, 46], [7, 68], [12, 88], [20, 100],
  ])
  // Dünne prozentuale Marge zusätzlich abstrafen (Risiko bei Kostenschwankung).
  if (pct < 0.1) score *= 0.6
  else if (pct < 0.18) score *= 0.85
  return { eur, pct, score: clamp(score) }
}

// Verbesserungspotenzial: wie schlagbar ist der Platzhirsch?
// Mittelmäßige Bewertung + schwaches Listing (wenige Bilder / kurzer Titel)
// = viel Raum, mit einem besseren Produkt/Listing zu gewinnen.
function improvementScore(
  rating: number | null,
  images: number | null,
  titleLen: number | null
): number {
  const ratingRoom =
    rating == null
      ? 50
      : lerpScore(rating, [
          [3.5, 100], [4.0, 86], [4.2, 72], [4.4, 52],
          [4.6, 28], [4.8, 10], [5.0, 0],
        ])
  const imgWeak =
    images == null
      ? 30
      : lerpScore(images, [[1, 100], [4, 80], [5, 62], [6, 45], [7, 22], [8, 10], [9, 4]])
  const titleWeak =
    titleLen == null
      ? 20
      : lerpScore(titleLen, [[0, 100], [60, 90], [100, 60], [150, 30], [180, 12], [200, 4]])
  // Die schwächste Listing-Dimension treibt die Verbesserbarkeit.
  const listingWeak = Math.max(imgWeak, titleWeak)
  return clamp(0.6 * ratingRoom + 0.4 * listingWeak)
}

// Machbarkeit: lässt sich das Produkt gut handhaben (FBA, Kapital, Marge)?
function feasibilityScore(
  price: number | null,
  weight: number | null,
  sizeCategory: string | null,
  bestseller: boolean
): number {
  let s = 100
  if (weight != null) {
    if (weight > 5) s -= 35
    else if (weight > 2) s -= 20
    else if (weight > 1) s -= 8
  }
  if (sizeCategory && /übergröße|oversize|sperrig|groß/i.test(sizeCategory)) s -= 12
  if (price != null) {
    if (price < 8) s -= 30 // Margenfalle bei sehr günstigen Produkten
    else if (price < 12) s -= 12
    if (price > 120) s -= 18 // kapitalintensiv
    else if (price > 80) s -= 8
  }
  if (bestseller) s -= 8 // Bestseller = etablierter Platzhirsch
  return clamp(s)
}

// ============================================================================
// Gesamt-Bewertung — zwei Linsen + empfohlene Strategie pro Produkt
// ============================================================================
export type ProductTier = 'A' | 'B' | 'C' | 'Meiden'
export type ProductPlay = 'Verkaufen' | 'Verbessern' | 'Beides' | 'Meiden'

export interface ProductScores {
  demand_score: number
  revenue_score: number
  competition_score: number // hoch = leichter Einstieg
  margin_score: number
  improvement_score: number
  feasibility_score: number
  sell_score: number // "sofort verkaufen / Me-too"
  improve_score: number // "verbessern & verkaufen"
  opportunity_score: number // max(sell, improve)
  product_tier: ProductTier
  play: ProductPlay
  margin_eur: number | null
  margin_pct: number | null
}

export function scoreParent(
  parent: ParentProduct,
  cfg: ScoringConfig = DEFAULT_CONFIG
): ProductScores {
  const rep = parent.representative
  const demand = demandScore(parent.sales)
  const revenue = revenueScore(parent.revenue)
  const competition = competitionEase(parent.review_count, rep.active_sellers)
  const margin = marginParts(parent.price, rep.fees_eur, cfg)
  const improvement = improvementScore(parent.rating, rep.image_count, rep.title_length)
  const feasibility = feasibilityScore(
    parent.price,
    rep.weight_kg,
    rep.size_category,
    rep.bestseller
  )

  // Linse 1 — Verkaufen (Me-too): braucht Nachfrage UND eine echte Lücke in
  // der Review-Mauer. Wettbewerb zählt hier voll.
  let sell =
    demand * 0.3 +
    revenue * 0.15 +
    competition * 0.3 +
    margin.score * 0.18 +
    feasibility * 0.07

  // Linse 2 — Verbessern: Nachfrage + großes Verbesserungspotenzial. Wettbewerb
  // zählt weniger (man differenziert sich), aber eine riesige Mauer dämpft auch das.
  let improve =
    demand * 0.27 +
    revenue * 0.1 +
    improvement * 0.37 +
    margin.score * 0.16 +
    feasibility * 0.1
  if (competition < 20) improve *= 0.85

  sell = clamp(sell)
  improve = clamp(improve)
  const opportunity = Math.max(sell, improve)

  let tier: ProductTier
  if (opportunity >= 72) tier = 'A'
  else if (opportunity >= 56) tier = 'B'
  else if (opportunity >= 40) tier = 'C'
  else tier = 'Meiden'

  let play: ProductPlay
  if (opportunity < 40) play = 'Meiden'
  else if (improve > sell + 6) play = 'Verbessern'
  else if (sell > improve + 6) play = 'Verkaufen'
  else play = 'Beides'

  return {
    demand_score: Math.round(demand),
    revenue_score: Math.round(revenue),
    competition_score: Math.round(competition),
    margin_score: Math.round(margin.score),
    improvement_score: Math.round(improvement),
    feasibility_score: Math.round(feasibility),
    sell_score: Math.round(sell),
    improve_score: Math.round(improve),
    opportunity_score: Math.round(opportunity),
    product_tier: tier,
    play,
    margin_eur: margin.eur != null ? Math.round(margin.eur * 100) / 100 : null,
    margin_pct: margin.pct != null ? Math.round(margin.pct * 1000) / 10 : null,
  }
}

// Eltern-Produkte inkl. Scores — die Basis für die neue UI.
export interface ScoredParent extends ParentProduct {
  scores: ProductScores
}

export function analyzeProducts(
  products: CsvParsedProduct[],
  cfg: ScoringConfig = DEFAULT_CONFIG
): ScoredParent[] {
  return groupParents(products)
    .map((parent) => ({ ...parent, scores: scoreParent(parent, cfg) }))
    .sort((a, b) => b.scores.opportunity_score - a.scores.opportunity_score)
}

// Rückwärtskompatibel: jede Varianten-ASIN bekommt den Score ihres Eltern-Produkts.
export function computeScores(
  products: CsvParsedProduct[],
  cfg: ScoringConfig = DEFAULT_CONFIG
): Map<string, ProductScores> {
  const scores = new Map<string, ProductScores>()
  for (const parent of groupParents(products)) {
    const s = scoreParent(parent, cfg)
    for (const variant of parent.variants) scores.set(variant.asin, s)
  }
  return scores
}

// ---- Labels & Farben ------------------------------------------------------

export function tierLabel(tier: string): string {
  const labels: Record<string, string> = {
    A: 'Top-Kandidat',
    B: 'Interessant',
    C: 'Beobachten',
    Meiden: 'Meiden',
  }
  return labels[tier] || tier
}

export function tierColor(tier: string): string {
  const colors: Record<string, string> = {
    A: '#10b981', // emerald
    B: '#3b82f6', // blue
    C: '#f59e0b', // amber
    Meiden: '#94a3b8', // slate
  }
  return colors[tier] || '#6b7280'
}

export function playLabel(play: string): string {
  const labels: Record<string, string> = {
    Verkaufen: 'Sofort verkaufen',
    Verbessern: 'Verbessern & verkaufen',
    Beides: 'Beides möglich',
    Meiden: 'Meiden',
  }
  return labels[play] || play
}

export function playColor(play: string): string {
  const colors: Record<string, string> = {
    Verkaufen: '#0ea5e9', // sky
    Verbessern: '#8b5cf6', // violet
    Beides: '#14b8a6', // teal
    Meiden: '#94a3b8', // slate
  }
  return colors[play] || '#6b7280'
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { computeScores } from '@/lib/scoring'
import type { CsvParsedProduct, Product } from '@/types'

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 500 })
  }

  const supabase = createClient(url, key)

  const { data: products, error } = await supabase
    .from('products')
    .select('*')

  if (error || !products) {
    return NextResponse.json({ error: error?.message || 'Keine Produkte' }, { status: 500 })
  }

  const productRows = (products || []) as unknown as Product[]
  const parsed: CsvParsedProduct[] = productRows.map((p) => ({
    product_details: p.product_details || '',
    asin: p.asin || '',
    url: p.url || '',
    image_url: p.image_url || null,
    brand: p.brand || '',
    price_eur: p.price_eur || null,
    asin_sales: p.asin_sales || null,
    asin_revenue: p.asin_revenue || null,
    bsr: p.bsr || null,
    fees_eur: p.fees_eur || null,
    active_sellers: p.active_sellers || null,
    rating: p.rating || null,
    review_count: p.review_count || null,
    is_fba: p.is_fba || false,
    weight_kg: p.weight_kg || null,
    category: p.category || null,
    seller: p.seller || null,
    seller_region: p.seller_region || null,
    fulfillment: p.fulfillment || null,
    title_length: p.title_length || null,
    image_count: p.image_count || null,
    sponsored: p.sponsored || false,
    bestseller: p.bestseller || false,
    seller_age_months: p.seller_age_months || null,
  }))

  const scores = computeScores(parsed)
  let created = 0

  for (const p of productRows) {
    const s = scores.get(p.asin)
    if (!s) continue

    const { error: upsertError } = await supabase.from('analyses').upsert(
      {
        product_id: p.id,
        opportunity_score: s.opportunity_score,
        product_tier: s.product_tier,
        demand_score: s.demand_score,
        revenue_score: s.revenue_score,
        competition_score: s.competition_score,
        margin_score: s.margin_score,
        improvement_score: s.improvement_score,
        risk_score: s.risk_score,
      },
      { onConflict: 'product_id' }
    )

    if (!upsertError) created++
  }

  return NextResponse.json({
    success: true,
    products: productRows.length,
    analyses_created: created,
  })
}

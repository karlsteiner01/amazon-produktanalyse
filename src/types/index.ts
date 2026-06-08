export interface Product {
  id: string
  created_at: string
  asin: string
  product_details: string
  url: string
  image_url: string | null
  brand: string
  price_eur: number | null
  asin_sales: number | null
  asin_revenue: number | null
  bsr: number | null
  fees_eur: number | null
  active_sellers: number | null
  rating: number | null
  review_count: number | null
  is_fba: boolean
  weight_kg: number | null
  category: string | null
  seller: string | null
  seller_region: string | null
  fulfillment: string | null
  title_length: number | null
  image_count: number | null
  sponsored: boolean
  bestseller: boolean
  seller_age_months: number | null
  import_id: string | null
}

export interface Analysis {
  id: string
  created_at: string
  product_id: string
  opportunity_score: number
  product_tier: 'A' | 'B' | 'C' | 'Ablehnen'
  demand_note: string | null
  competition_note: string | null
  improvement_ideas: string[] | null
  risks: string[] | null
  decision: string | null
  full_analysis: string | null
  demand_score: number
  revenue_score: number
  competition_score: number
  margin_score: number
  improvement_score: number
  risk_score: number
}

export interface CsvImport {
  id: string
  created_at: string
  filename: string
  product_count: number
  status: 'processing' | 'completed' | 'failed'
  error_message: string | null
}

export interface ProductRow {
  [key: string]: string | undefined
  Anzeigereihenfolge?: string
  Produktdetails?: string
  ASIN?: string
  URL?: string
  'Bild-URL'?: string
  Marke?: string
  'Preis  €'?: string
  'Preis €'?: string
  'Verkäufe der übergeordneten Ebene'?: string
  'ASIN Verkäufe'?: string
  'Kürzliche Einkäufe'?: string
  'Umsatz der übergeordneten Ebene'?: string
  'ASIN Umsatz'?: string
  'Titel Zeichen Anzahl'?: string
  BSR?: string
  'Land/Region des Verkäufers'?: string
  'Gebühren  €'?: string
  'Gebühren €'?: string
  'Aktive Verkäufer'?: string
  Bewertungen?: string
  Bewertungsanzahl?: string
  Bilder?: string
  'Neubewertungs-Geschwindigkeit'?: string
  BuyBox?: string
  Kategorie?: string
  'Größen-Kategorie'?: string
  Fulfillment?: string
  Abmessungen?: string
  Gewicht?: string
  'ABA Meistgeklickt'?: string
  Erstellungsdatum?: string
  Gesponsert?: string
  Bestseller?: string
  'Verkäuferalter (Mo.)'?: string
  Verkäufer?: string
}

export interface CsvParsedProduct {
  product_details: string
  asin: string
  url: string
  image_url: string | null
  brand: string
  price_eur: number | null
  asin_sales: number | null
  asin_revenue: number | null
  bsr: number | null
  fees_eur: number | null
  active_sellers: number | null
  rating: number | null
  review_count: number | null
  is_fba: boolean
  weight_kg: number | null
  category: string | null
  seller: string | null
  seller_region: string | null
  fulfillment: string | null
  title_length: number | null
  image_count: number | null
  sponsored: boolean
  bestseller: boolean
  seller_age_months: number | null
}

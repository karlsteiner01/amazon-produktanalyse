-- Supabase SQL Schema for Amazon Produktanalyse
-- Run this in the Supabase SQL Editor

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  asin TEXT NOT NULL,
  product_details TEXT DEFAULT '',
  url TEXT DEFAULT '',
  image_url TEXT,
  brand TEXT DEFAULT '',
  price_eur DECIMAL(10,2),
  asin_sales INTEGER,
  asin_revenue DECIMAL(12,2),
  bsr INTEGER,
  fees_eur DECIMAL(10,2),
  active_sellers INTEGER,
  rating DECIMAL(3,1),
  review_count INTEGER,
  is_fba BOOLEAN DEFAULT FALSE,
  weight_kg DECIMAL(10,4),
  category TEXT,
  seller TEXT,
  seller_region TEXT,
  fulfillment TEXT,
  title_length INTEGER,
  image_count INTEGER,
  sponsored BOOLEAN DEFAULT FALSE,
  bestseller BOOLEAN DEFAULT FALSE,
  seller_age_months INTEGER,
  import_id UUID,
  UNIQUE(asin)
);

CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  opportunity_score INTEGER DEFAULT 0,
  product_tier TEXT DEFAULT 'C',
  demand_note TEXT,
  competition_note TEXT,
  improvement_ideas JSONB,
  risks JSONB,
  decision TEXT,
  full_analysis TEXT,
  demand_score INTEGER DEFAULT 0,
  revenue_score INTEGER DEFAULT 0,
  competition_score INTEGER DEFAULT 0,
  margin_score INTEGER DEFAULT 0,
  improvement_score INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0
);

CREATE TABLE csv_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  filename TEXT NOT NULL,
  product_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing',
  error_message TEXT
);

-- Indexes
CREATE INDEX idx_products_asin ON products(asin);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_created ON products(created_at DESC);
CREATE INDEX idx_analyses_product ON analyses(product_id);
CREATE INDEX idx_analyses_score ON analyses(opportunity_score DESC);
CREATE INDEX idx_analyses_created ON analyses(created_at DESC);

-- Row Level Security (for public access with anon key)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (since this is a single-user app)
CREATE POLICY "Allow all products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all analyses" ON analyses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all imports" ON csv_imports FOR ALL USING (true) WITH CHECK (true);

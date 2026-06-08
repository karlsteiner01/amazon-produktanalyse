import type { CsvParsedProduct, ProductRow } from '@/types'

function parseGermanFloat(value: string | null | undefined): number | null {
  if (!value || value === 'N/A' || value === '' || value === '-') return null
  let str = value.trim().replace('€', '').replace(/\s/g, '')
  if (str === '' || str === '-') return null
  if (str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.')
  } else if (str.includes('.')) {
    const dotCount = (str.match(/\./g) || []).length
    if (dotCount > 1) {
      str = str.replace(/\./g, '')
    } else {
      const withoutDot = str.replace('.', '')
      if (!isNaN(Number(withoutDot)) && !str.endsWith('.') && str.length > 4) {
        str = withoutDot
      }
    }
  }
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

function parseGermanInt(value: string | null | undefined): number | null {
  if (!value || value === 'N/A' || value === '' || value === '-') return null
  let str = value.trim().replace('€', '').replace(/\s/g, '')
  if (str === '' || str === '-') return null
  str = str.replace(/\./g, '').replace(/,/g, '')
  const num = parseInt(str, 10)
  return isNaN(num) ? null : num
}

function parseBool(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim().toLowerCase()
  return v === 'ja' || v === 'yes' || v === 'true' || v === '1'
}

function isFba(value: string | null | undefined): boolean {
  if (!value) return false
  return value.trim().toLowerCase().includes('fba')
}

export function parseCsvRows(rows: ProductRow[]): CsvParsedProduct[] {
  const products: CsvParsedProduct[] = []

  for (const row of rows) {
    const product: CsvParsedProduct = {
      product_details: row.Produktdetails || '',
      asin: row.ASIN || '',
      url: row.URL || '',
      image_url: row['Bild-URL'] || null,
      brand: row.Marke || '',
      price_eur: parseGermanFloat(row['Preis  €'] || row['Preis €']),
      asin_sales: parseGermanInt(row['ASIN Verkäufe']),
      asin_revenue: parseGermanFloat(row['ASIN Umsatz']),
      bsr: parseGermanInt(row.BSR),
      fees_eur: parseGermanFloat(row['Gebühren  €'] || row['Gebühren €']),
      active_sellers: parseGermanInt(row['Aktive Verkäufer']),
      rating: parseGermanFloat(row.Bewertungen),
      review_count: parseGermanInt(row.Bewertungsanzahl),
      is_fba: isFba(row.Fulfillment),
      weight_kg: parseGermanFloat(row.Gewicht),
      category: row.Kategorie || null,
      seller: row.Verkäufer || null,
      seller_region: row['Land/Region des Verkäufers'] || null,
      fulfillment: row.Fulfillment || null,
      title_length: parseGermanInt(row['Titel Zeichen Anzahl']),
      image_count: parseGermanInt(row.Bilder),
      sponsored: parseBool(row.Gesponsert),
      bestseller: parseBool(row.Bestseller),
      seller_age_months: parseGermanInt(row['Verkäuferalter (Mo.)']),
    }

    if (!product.asin) continue
    products.push(product)
  }

  return products
}

export function parseCsvText(text: string): ProductRow[] {
  const lines = text.split('\n').filter((l) => l.trim())
  if (lines.length < 2) return []

  const header = parseCsvLine(lines[0])
  const rows: ProductRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    if (values.length === 0) continue
    const row: ProductRow = {}
    header.forEach((col, idx) => {
      row[col] = values[idx] || undefined
    })
    rows.push(row)
  }

  return rows
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const next = line[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }
  result.push(current.trim())

  return result
}

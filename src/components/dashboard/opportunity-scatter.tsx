'use client'

import { useRouter } from 'next/navigation'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceArea,
} from 'recharts'
import type { ScoredParent } from '@/lib/scoring'
import { playColor, playLabel } from '@/lib/scoring'

interface OpportunityScatterProps {
  parents: ScoredParent[]
}

interface Point {
  x: number
  y: number
  z: number
  asin: string
  name: string
  brand: string
  play: string
  reviews: number
  opportunity: number
  margin: number | null
}

const PLAYS = ['Verkaufen', 'Verbessern', 'Beides', 'Meiden'] as const

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0].payload
  return (
    <div className="max-w-64 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
      <p className="line-clamp-2 text-xs font-semibold leading-4">{p.name}</p>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        <span className="text-muted-foreground">Preis</span>
        <span className="text-right font-medium tabular-nums">{p.x.toFixed(2)} €</span>
        <span className="text-muted-foreground">Verkäufe/Mo.</span>
        <span className="text-right font-medium tabular-nums">{p.y.toLocaleString('de-DE')}</span>
        <span className="text-muted-foreground">Reviews</span>
        <span className="text-right font-medium tabular-nums">{p.reviews.toLocaleString('de-DE')}</span>
        <span className="text-muted-foreground">Marge/Stück</span>
        <span className="text-right font-medium tabular-nums">
          {p.margin != null ? `${p.margin.toFixed(2)} €` : '–'}
        </span>
        <span className="text-muted-foreground">Score</span>
        <span className="text-right font-medium tabular-nums">{p.opportunity}/100</span>
      </div>
      <div
        className="mt-2 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold"
        style={{ backgroundColor: playColor(p.play) + '22', color: playColor(p.play) }}
      >
        {playLabel(p.play)}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">Klicken für Details →</p>
    </div>
  )
}

export function OpportunityScatter({ parents }: OpportunityScatterProps) {
  const router = useRouter()

  const points: Point[] = parents
    .filter((p) => (p.price ?? 0) > 0 && p.sales > 0)
    .map((p) => ({
      x: p.price as number,
      y: p.sales,
      z: Math.max(p.review_count, 1),
      asin: p.representative.asin,
      name: p.representative.product_details || p.representative.asin,
      brand: p.representative.brand,
      play: p.scores.play,
      reviews: p.review_count,
      opportunity: p.scores.opportunity_score,
      margin: p.scores.margin_eur,
    }))

  if (points.length === 0) {
    return (
      <section className="panel p-5">
        <h3 className="text-sm font-semibold">Chancen-Karte</h3>
        <p className="mt-2 text-sm text-muted-foreground">Keine Daten mit Preis & Verkäufen.</p>
      </section>
    )
  }

  const maxSales = Math.max(...points.map((p) => p.y))
  const maxPrice = Math.max(...points.map((p) => p.x))

  return (
    <section className="panel p-4 sm:p-5">
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Chancen-Karte</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Preis × Nachfrage. <strong>Blasengröße = Review-Mauer</strong> (Konkurrenz).
            Kleine Blasen weit oben = viel Nachfrage, wenig Konkurrenz.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {PLAYS.map((play) => (
            <div key={play} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: playColor(play) }} />
              {playLabel(play)}
            </div>
          ))}
        </div>
      </div>

      <div className="h-[340px] w-full sm:h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 16, bottom: 28, left: 8 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            {/* Sweet-Spot: mittlerer Preis, hohe Nachfrage */}
            <ReferenceArea
              x1={15}
              x2={Math.min(80, maxPrice)}
              y1={Math.min(300, maxSales)}
              y2={maxSales}
              fill="var(--primary)"
              fillOpacity={0.06}
              stroke="var(--primary)"
              strokeOpacity={0.18}
              strokeDasharray="4 4"
            />
            <XAxis
              type="number"
              dataKey="x"
              name="Preis"
              unit=" €"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              label={{ value: 'Preis (€)', position: 'insideBottom', offset: -16, fontSize: 11, fill: 'var(--muted-foreground)' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Verkäufe"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              width={48}
              label={{ value: 'Verkäufe / Monat', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--muted-foreground)' }}
            />
            <ZAxis type="number" dataKey="z" range={[80, 900]} name="Reviews" />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'var(--muted-foreground)' }} />
            <Scatter
              data={points}
              onClick={(d: unknown) => {
                const asin = (d as Point | undefined)?.asin
                if (asin) router.push(`/produkte/${asin}`)
              }}
              className="cursor-pointer"
            >
              {points.map((p) => (
                <Cell
                  key={p.asin}
                  fill={playColor(p.play)}
                  fillOpacity={0.6}
                  stroke={playColor(p.play)}
                  strokeWidth={1.5}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

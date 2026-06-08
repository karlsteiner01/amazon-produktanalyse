'use client'

import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import type { Analysis } from '@/types'

interface RadarChartProps {
  analysis: Analysis
}

export default function RadarChart({ analysis }: RadarChartProps) {
  const data = [
    { category: 'Nachfrage', value: analysis.demand_score },
    { category: 'Umsatz', value: analysis.revenue_score },
    { category: 'Konkurrenz', value: analysis.competition_score },
    { category: 'Marge', value: analysis.margin_score },
    { category: 'Verbesserung', value: analysis.improvement_score },
    { category: 'Risiko', value: analysis.risk_score },
  ]

  return (
    <div className="panel p-4">
      <div className="mb-3">
        <h4 className="text-sm font-semibold">Score Radar</h4>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Je weiter die Fläche nach außen geht, desto stärker ist der Kandidat in diesem Bereich.
        </p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadar data={data}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="var(--primary)"
              fill="var(--primary)"
              fillOpacity={0.18}
              strokeWidth={2}
            />
          </RechartsRadar>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 rounded-lg border border-border bg-muted/25 p-3">
        <p className="text-xs font-semibold">So liest du den Radar</p>
        <div className="mt-2 grid gap-2 text-xs leading-5 text-muted-foreground">
          <p>0 bedeutet schwach, 100 bedeutet stark. Eine große, gleichmäßige Fläche ist besser als ein einzelner Ausreißer.</p>
          <p>Nachfrage, Umsatz und Marge zeigen die Marktstärke. Konkurrenz ist hoch, wenn der Druck durch Reviews und Verkäufer geringer ist.</p>
          <p>Verbesserung zeigt, ob du dich mit einem besseren Produkt absetzen kannst. Risiko ist hoch, wenn das Produkt eher gut handhabbar wirkt.</p>
        </div>
      </div>
    </div>
  )
}

'use client'

import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import type { ProductScores } from '@/lib/scoring'

interface RadarChartProps {
  scores: ProductScores
}

export default function RadarChart({ scores }: RadarChartProps) {
  const data = [
    { category: 'Nachfrage', value: scores.demand_score },
    { category: 'Umsatz', value: scores.revenue_score },
    { category: 'Einstiegschance', value: scores.competition_score },
    { category: 'Marge', value: scores.margin_score },
    { category: 'Verbesserung', value: scores.improvement_score },
    { category: 'Machbarkeit', value: scores.feasibility_score },
  ]

  return (
    <div className="panel p-4">
      <h4 className="text-sm font-semibold">Score-Radar</h4>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Alle Achsen: höher = besser. Eine große, gleichmäßige Fläche ist stark.
      </p>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadar data={data} outerRadius="72%">
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
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
    </div>
  )
}

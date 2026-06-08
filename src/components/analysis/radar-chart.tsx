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
    <div className="border rounded-lg p-4">
      <h4 className="text-xs font-medium text-zinc-500 mb-3">Score Radar</h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadar data={data}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
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
              stroke="#2563eb"
              fill="#2563eb"
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
          </RechartsRadar>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

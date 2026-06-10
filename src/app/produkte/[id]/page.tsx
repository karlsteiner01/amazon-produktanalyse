'use client'

import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useData, findParentByAsin } from '@/lib/store'
import { marginBreakdown, tierColor, tierLabel, playColor, playLabel } from '@/lib/scoring'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ProductThumb } from '@/components/product-thumb'
import {
  ArrowLeft, ExternalLink, Euro, ShoppingCart, Package, Star,
  Check, AlertTriangle, Image as ImageIcon, Type, Users, Layers,
} from 'lucide-react'

const RadarChart = dynamic(() => import('@/components/analysis/radar-chart'), { ssr: false })

const eur = (v: number | null | undefined) =>
  v != null ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v) : '–'
const num = (v: number | null | undefined) =>
  v != null ? new Intl.NumberFormat('de-DE').format(v) : '–'

interface Lever {
  ok: boolean
  icon: typeof Check
  label: string
  detail: string
}

export default function ProduktDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { ready, parents, config } = useData()
  const id = params.id as string

  if (!ready) {
    return <div className="panel p-8"><p className="text-sm text-muted-foreground">Lade Produkt…</p></div>
  }

  const parent = findParentByAsin(parents, id)
  if (!parent) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => router.push('/produkte')}>
          <ArrowLeft className="size-3.5" /> Zurück
        </Button>
        <div className="panel p-8"><p className="text-sm text-muted-foreground">Produkt nicht gefunden.</p></div>
      </div>
    )
  }

  const rep = parent.representative
  const s = parent.scores
  const margin = marginBreakdown(parent.price, rep.fees_eur, config)

  const quickStats = [
    { label: 'Preis', value: eur(parent.price), icon: Euro, tone: 'text-amber-600 dark:text-amber-300' },
    { label: 'Verkäufe/Mo', value: num(parent.sales), icon: ShoppingCart, tone: 'text-emerald-600 dark:text-emerald-300' },
    { label: 'Umsatz/Mo', value: eur(parent.revenue), icon: Package, tone: 'text-sky-600 dark:text-sky-300' },
    { label: 'Rating', value: parent.rating != null ? `${parent.rating}★` : '–', icon: Star, tone: 'text-rose-600 dark:text-rose-300' },
  ]

  // Verbesserungs-Hebel: wo ist der Platzhirsch schlagbar?
  const levers: Lever[] = [
    {
      ok: (parent.rating ?? 5) >= 4.5,
      icon: Star,
      label: `Bewertung ${parent.rating ?? '–'}★`,
      detail: (parent.rating ?? 5) >= 4.5 ? 'Kunden zufrieden — schwer über Qualität zu schlagen' : 'Unzufriedene Kunden — über Qualität angreifbar',
    },
    {
      ok: (rep.image_count ?? 0) >= 7,
      icon: ImageIcon,
      label: `${rep.image_count ?? '–'} Produktbilder`,
      detail: (rep.image_count ?? 0) >= 7 ? 'Vollständige Bildergalerie' : 'Listing-Lücke: <7 Bilder — mit besseren Bildern überholbar',
    },
    {
      ok: (rep.title_length ?? 0) >= 150,
      icon: Type,
      label: `Titel ${rep.title_length ?? '–'} Zeichen`,
      detail: (rep.title_length ?? 0) >= 150 ? 'Titel SEO-optimiert' : 'Kurzer Titel — Keyword-/SEO-Potenzial',
    },
    {
      ok: parent.review_count < 500,
      icon: Users,
      label: `${num(parent.review_count)} Reviews`,
      detail: parent.review_count < 500 ? 'Niedrige Review-Mauer — leichter Einstieg' : 'Hohe Review-Mauer — Einstieg schwieriger',
    },
  ]

  const playExplain: Record<string, string> = {
    Verkaufen: 'Klarer Einstiegs-Kandidat: genug Nachfrage und die Konkurrenz ist (noch) schwach genug, um mit einem vergleichbaren Produkt mitzuverkaufen.',
    Verbessern: 'Hier lohnt Differenzierung: Nachfrage ist da, aber der Platzhirsch hat Schwächen (Bewertung/Listing), die du mit einem besseren Produkt ausnutzen kannst.',
    Beides: 'Funktioniert in beide Richtungen — du kannst direkt einsteigen oder dich mit einem besseren Produkt absetzen.',
    Meiden: 'Eher nicht verfolgen: zu wenig Nachfrage, zu dünne Marge oder eine zu hohe Eintrittsbarriere.',
  }

  const subScores = [
    { label: 'Nachfrage', value: s.demand_score },
    { label: 'Umsatzpotenzial', value: s.revenue_score },
    { label: 'Einstiegschance', value: s.competition_score },
    { label: 'Marge', value: s.margin_score },
    { label: 'Verbesserungspot.', value: s.improvement_score },
    { label: 'Machbarkeit', value: s.feasibility_score },
  ]

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => router.push('/produkte')}>
        <ArrowLeft className="size-3.5" /> Zurück
      </Button>

      {/* Kopf */}
      <section className="panel overflow-hidden">
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_240px] lg:p-6">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-border bg-muted/50 font-mono text-muted-foreground">{rep.asin}</Badge>
              <Badge
                variant="outline"
                style={{ backgroundColor: playColor(s.play) + '1a', color: playColor(s.play), borderColor: playColor(s.play) + '40' }}
              >
                {playLabel(s.play)}
              </Badge>
              <Badge
                variant="outline"
                style={{ backgroundColor: tierColor(s.product_tier) + '1a', color: tierColor(s.product_tier), borderColor: tierColor(s.product_tier) + '40' }}
              >
                {tierLabel(s.product_tier)}
              </Badge>
              {parent.variant_count > 1 && (
                <Badge variant="outline" className="gap-1 border-border text-muted-foreground">
                  <Layers className="size-3" /> {parent.variant_count} Varianten
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-semibold leading-tight sm:text-2xl">{rep.product_details}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{rep.brand || 'Keine Marke'} · {rep.category || 'Keine Kategorie'}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {quickStats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="rounded-lg border border-border bg-muted/25 p-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`size-4 ${stat.tone}`} />
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                    <p className="mt-2 text-lg font-semibold tabular-nums">{stat.value}</p>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex items-center justify-center rounded-lg border border-border bg-white p-4 dark:bg-muted/30">
            {rep.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={rep.image_url} alt={rep.product_details || ''} className="max-h-52 max-w-full object-contain" loading="lazy" />
            ) : (
              <Package className="size-12 text-muted-foreground" />
            )}
          </div>
        </div>
        {rep.url && (
          <div className="flex justify-end border-t border-border/80 bg-muted/30 px-5 py-3">
            <a href={rep.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted">
              <ExternalLink className="size-3.5" /> Auf Amazon ansehen
            </a>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Margenrechnung */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Margenrechnung (geschätzt)</CardTitle>
            </CardHeader>
            <CardContent>
              {margin ? (
                <>
                  <div className="space-y-2 text-sm">
                    <Row label="Verkaufspreis" value={eur(margin.price)} />
                    <Row label={`Amazon-Gebühren${rep.fees_eur != null ? '' : ' (geschätzt)'}`} value={`− ${eur(margin.fee)}`} muted />
                    <Row label={`Wareneinsatz (${Math.round(config.cogsPct * 100)} %)`} value={`− ${eur(margin.cogs)}`} muted />
                    <Separator className="my-1" />
                    <Row
                      label="Marge je Stück"
                      value={`${eur(margin.eur)}  (${Math.round(margin.pct * 100)} %)`}
                      strong
                      tone={margin.eur < 3 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
                    />
                  </div>
                  <p className="mt-3 rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-[11px] leading-4 text-muted-foreground">
                    Wareneinsatz oben rechts (Marge-Annahme) einstellbar. Bei {num(parent.sales)} Verkäufen/Mo
                    entspricht das ca. <strong>{eur(margin.eur * parent.sales)}</strong> Rohertrag pro Monat
                    für die ganze Familie.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Kein Preis vorhanden.</p>
              )}
            </CardContent>
          </Card>

          {/* Verbesserungs-Hebel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Wo ist der Platzhirsch schlagbar?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {levers.map((l) => {
                  const Icon = l.icon
                  return (
                    <div key={l.label} className="flex gap-2.5 rounded-lg border border-border/70 bg-muted/25 p-3">
                      <div className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${l.ok ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>
                        {l.ok ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}
                      </div>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-xs font-medium"><Icon className="size-3.5 text-muted-foreground" /> {l.label}</p>
                        <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{l.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Varianten */}
          {parent.variant_count > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Varianten dieser Familie ({parent.variant_count})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {[...parent.variants].sort((a, b) => (b.asin_sales ?? 0) - (a.asin_sales ?? 0)).map((v) => (
                    <div key={v.asin} className="flex items-center gap-3 py-2">
                      <ProductThumb src={v.image_url} title={v.product_details} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{v.product_details}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{v.asin}</p>
                      </div>
                      <div className="shrink-0 text-right text-xs">
                        <p className="font-medium tabular-nums">{eur(v.price_eur)}</p>
                        <p className="text-[11px] text-muted-foreground tabular-nums">{num(v.asin_sales)} Verk.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Rechte Spalte: Scores + Radar */}
        <div className="space-y-6">
          <Card className="metric-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Strategie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/25 p-3 text-center">
                  <p className="text-[11px] text-muted-foreground">Verkaufen</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color: '#0ea5e9' }}>{s.sell_score}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/25 p-3 text-center">
                  <p className="text-[11px] text-muted-foreground">Verbessern</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color: '#8b5cf6' }}>{s.improve_score}</p>
                </div>
              </div>
              <div className="mt-3 rounded-lg p-3 text-xs leading-5" style={{ backgroundColor: playColor(s.play) + '14', color: playColor(s.play) }}>
                <strong>{playLabel(s.play)}.</strong>{' '}
                <span className="text-foreground/70">{playExplain[s.play]}</span>
              </div>
              <Separator className="my-3" />
              <div className="space-y-2">
                {subScores.map((sub) => (
                  <div key={sub.label} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">{sub.label}</span>
                      <span className="font-medium tabular-nums">{sub.value}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${sub.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <RadarChart scores={s} />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, muted, strong, tone }: { label: string; value: string; muted?: boolean; strong?: boolean; tone?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${muted ? 'text-muted-foreground' : ''} ${strong ? 'font-semibold' : ''}`}>{label}</span>
      <span className={`tabular-nums ${strong ? 'font-bold' : 'font-medium'} ${tone ?? ''}`}>{value}</span>
    </div>
  )
}

'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react'
import type { CsvParsedProduct } from '@/types'
import {
  analyzeProducts,
  type ScoredParent,
  type ScoringConfig,
  DEFAULT_CONFIG,
} from '@/lib/scoring'

// ============================================================================
// Client-seitiger Daten-Store (localStorage).
// Parsen + Scoren + Ansehen läuft komplett ohne Datenbank-Roundtrip:
// Imports sind sofort sichtbar, funktionieren offline und brauchen kein Supabase.
// (Supabase/Cloud-Sync kann später als optionale Schicht andocken — Phase 2.)
// ============================================================================

export interface StoredImport {
  id: string
  filename: string
  created_at: string
  products: CsvParsedProduct[]
}

interface PersistedState {
  imports: StoredImport[]
  selectedImportId: string | null
  config: ScoringConfig
}

const STORAGE_KEY = 'apa:v1'

interface DataContextValue {
  ready: boolean
  imports: StoredImport[]
  selectedImportId: string | null
  config: ScoringConfig
  /** Rohprodukte im aktuellen Scope (gewählter Import oder alle). */
  scopedProducts: CsvParsedProduct[]
  /** Bewertete Eltern-Produkte im Scope, nach Opportunity sortiert. */
  parents: ScoredParent[]
  addImport: (filename: string, products: CsvParsedProduct[]) => string
  deleteImport: (id: string) => void
  selectImport: (id: string | null) => void
  setConfig: (patch: Partial<ScoringConfig>) => void
  clearAll: () => void
}

const DataContext = createContext<DataContextValue | null>(null)

function loadState(): PersistedState {
  if (typeof window === 'undefined') {
    return { imports: [], selectedImportId: null, config: DEFAULT_CONFIG }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { imports: [], selectedImportId: null, config: DEFAULT_CONFIG }
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    return {
      imports: parsed.imports ?? [],
      selectedImportId: parsed.selectedImportId ?? null,
      config: { ...DEFAULT_CONFIG, ...(parsed.config ?? {}) },
    }
  } catch {
    return { imports: [], selectedImportId: null, config: DEFAULT_CONFIG }
  }
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [imports, setImports] = useState<StoredImport[]>([])
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null)
  const [config, setConfigState] = useState<ScoringConfig>(DEFAULT_CONFIG)

  // Hydrieren nach dem Mount (vermeidet SSR-Hydration-Mismatch).
  useEffect(() => {
    const s = loadState()
    setImports(s.imports)
    setSelectedImportId(s.selectedImportId)
    setConfigState(s.config)
    setReady(true)
  }, [])

  // Bei jeder Änderung persistieren.
  useEffect(() => {
    if (!ready) return
    const state: PersistedState = { imports, selectedImportId, config }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // localStorage voll/blockiert — Daten bleiben zumindest in dieser Session.
    }
  }, [ready, imports, selectedImportId, config])

  const addImport = useCallback(
    (filename: string, products: CsvParsedProduct[]) => {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `imp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const record: StoredImport = {
        id,
        filename,
        created_at: new Date().toISOString(),
        products,
      }
      setImports((prev) => [record, ...prev])
      setSelectedImportId(id)
      return id
    },
    []
  )

  const deleteImport = useCallback((id: string) => {
    setImports((prev) => prev.filter((i) => i.id !== id))
    setSelectedImportId((cur) => (cur === id ? null : cur))
  }, [])

  const selectImport = useCallback((id: string | null) => {
    setSelectedImportId(id)
  }, [])

  const setConfig = useCallback((patch: Partial<ScoringConfig>) => {
    setConfigState((prev) => ({ ...prev, ...patch }))
  }, [])

  const clearAll = useCallback(() => {
    setImports([])
    setSelectedImportId(null)
  }, [])

  const scopedProducts = useMemo(() => {
    const selected = selectedImportId
      ? imports.filter((i) => i.id === selectedImportId)
      : imports
    return selected.flatMap((i) => i.products)
  }, [imports, selectedImportId])

  const parents = useMemo(
    () => analyzeProducts(scopedProducts, config),
    [scopedProducts, config]
  )

  const value = useMemo<DataContextValue>(
    () => ({
      ready,
      imports,
      selectedImportId,
      config,
      scopedProducts,
      parents,
      addImport,
      deleteImport,
      selectImport,
      setConfig,
      clearAll,
    }),
    [
      ready,
      imports,
      selectedImportId,
      config,
      scopedProducts,
      parents,
      addImport,
      deleteImport,
      selectImport,
      setConfig,
      clearAll,
    ]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData muss innerhalb von <DataProvider> verwendet werden')
  return ctx
}

/** Findet ein bewertetes Eltern-Produkt anhand einer (Varianten-)ASIN. */
export function findParentByAsin(
  parents: ScoredParent[],
  asin: string
): ScoredParent | undefined {
  return parents.find(
    (p) =>
      p.representative.asin === asin ||
      p.variants.some((v) => v.asin === asin)
  )
}

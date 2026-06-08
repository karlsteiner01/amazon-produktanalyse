import { createClient } from '@supabase/supabase-js'

let client: ReturnType<typeof createClient> | null = null

interface SupabaseErrorLike {
  message: string
}

interface QueryResult {
  data: unknown
  error: SupabaseErrorLike | null
}

interface LooseQuery extends PromiseLike<QueryResult> {
  select(columns?: string): LooseQuery
  insert(values: unknown): LooseQuery
  update(values: unknown): LooseQuery
  upsert(values: unknown, options?: unknown): LooseQuery
  delete(): LooseQuery
  eq(column: string, value: unknown): LooseQuery
  in(column: string, values: readonly unknown[]): LooseQuery
  order(column: string, options?: unknown): LooseQuery
  limit(count: number): LooseQuery
  single(): LooseQuery
}

interface LooseSupabaseClient {
  from(table: string): LooseQuery
}

export function getSupabase(): LooseSupabaseClient {
  if (client) return client as unknown as LooseSupabaseClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url.includes('placeholder')) {
    throw new Error('Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local setzen')
  }

  client = createClient(url, key)
  return client as unknown as LooseSupabaseClient
}

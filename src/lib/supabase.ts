import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** null until .env.local holds the project URL and publishable key (see .env.example). */
export const supabase: SupabaseClient<Database> | null =
  url && publishableKey ? createClient<Database>(url, publishableKey) : null

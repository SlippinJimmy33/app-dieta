import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../lib/database.types'
import type { GoalsApi, LogApi } from './types'

export function createSupabaseLogApi(client: SupabaseClient<Database>): LogApi {
  return {
    async listEntries(day) {
      const { data, error } = await client.from('log_entries').select('*').eq('eaten_on', day).order('created_at')
      if (error) throw error
      return data
    },

    async addEntry(entry) {
      const { data, error } = await client.from('log_entries').insert(entry).select().single()
      if (error) throw error
      return data
    },

    async updateEntry(id, changes) {
      const { data, error } = await client.from('log_entries').update(changes).eq('id', id).select().single()
      if (error) throw error
      return data
    },

    async deleteEntry(id) {
      const { error } = await client.from('log_entries').delete().eq('id', id)
      if (error) throw error
    },
  }
}

export function createSupabaseGoalsApi(client: SupabaseClient<Database>): GoalsApi {
  return {
    async goalFor(day) {
      const { data, error } = await client
        .from('nutrition_goals')
        .select('*')
        .lte('valid_from', day)
        .order('valid_from', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      if (data) return data

      // Days before the very first goal use that first goal, rather than showing "no goal".
      const first = await client
        .from('nutrition_goals')
        .select('*')
        .order('valid_from', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (first.error) throw first.error
      return first.data
    },

    async saveGoal(from, values) {
      const { data, error } = await client
        .from('nutrition_goals')
        .upsert({ valid_from: from, ...values }, { onConflict: 'user_id,valid_from' })
        .select()
        .single()
      if (error) throw error
      return data
    },
  }
}

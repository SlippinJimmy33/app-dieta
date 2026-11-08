import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../lib/database.types'
import type { PantryApi } from './types'

export function createSupabasePantryApi(client: SupabaseClient<Database>): PantryApi {
  return {
    async listCategories() {
      const { data, error } = await client.from('food_categories').select('*').order('sort_order').order('name')
      if (error) throw error
      return data
    },

    async listFoods() {
      const { data, error } = await client.from('foods').select('*').is('archived_at', null).order('name')
      if (error) throw error
      return data
    },

    async createFood(input) {
      const { data, error } = await client.from('foods').insert(input).select().single()
      if (error) throw error
      return data
    },

    async updateFood(id, input) {
      const { data, error } = await client.from('foods').update(input).eq('id', id).select().single()
      if (error) throw error
      return data
    },

    async archiveFood(id) {
      const { error } = await client.from('foods').update({ archived_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
  }
}

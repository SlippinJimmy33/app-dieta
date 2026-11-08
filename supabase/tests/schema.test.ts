// @vitest-environment node
import { PGlite } from '@electric-sql/pglite'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '..')
const ALICE = '00000000-0000-4000-8000-00000000000a'
const BOB = '00000000-0000-4000-8000-00000000000b'

let db: PGlite

async function asUser<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`)
  try {
    return await fn()
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`)
  }
}

async function rows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await db.query<T>(sql, params)).rows
}

async function insertFood(name: string, values = { kcal: 89, protein_g: 1.1, carbs_g: 22.8, fat_g: 0.3 }) {
  const [food] = await rows<{ id: string }>(
    'insert into public.foods (name, kcal, protein_g, carbs_g, fat_g) values ($1, $2, $3, $4, $5) returning id',
    [name, values.kcal, values.protein_g, values.carbs_g, values.fat_g],
  )
  return food.id
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(readFileSync(join(root, 'tests', 'supabase-stubs.sql'), 'utf8'))
  const migrations = readdirSync(join(root, 'migrations')).filter((f) => f.endsWith('.sql')).sort()
  for (const file of migrations) {
    await db.exec(readFileSync(join(root, 'migrations', file), 'utf8'))
  }
  await db.query('insert into auth.users (id, email) values ($1, $2), ($3, $4)', [ALICE, 'a@test', BOB, 'b@test'])
}, 60_000)

afterAll(async () => {
  await db?.close()
})

describe('signup', () => {
  it('creates a profile and the default categories for each new user', async () => {
    const profiles = await asUser(ALICE, () => rows<{ id: string }>('select id from public.profiles'))
    expect(profiles).toEqual([{ id: ALICE }])

    const categories = await asUser(ALICE, () =>
      rows<{ name: string }>('select name from public.food_categories order by sort_order'),
    )
    expect(categories.map((c) => c.name)).toEqual([
      'Fruita',
      'Verdura',
      'Cereals',
      'Proteïna',
      'Làctics',
      'Greixos',
      'Dolç',
      'Begudes',
    ])
  })
})

describe('row level security', () => {
  it('hides other users rows', async () => {
    await asUser(BOB, () => insertFood('Formatge de Bob'))
    const seenByAlice = await asUser(ALICE, () => rows('select * from public.foods where name = $1', ['Formatge de Bob']))
    expect(seenByAlice).toHaveLength(0)
  })

  it('rejects writing rows on behalf of another user', async () => {
    await expect(
      asUser(ALICE, () =>
        db.query('insert into public.foods (user_id, name, kcal, protein_g, carbs_g, fat_g) values ($1, $2, 1, 0, 0, 0)', [
          BOB,
          'Intrús',
        ]),
      ),
    ).rejects.toThrow(/row-level security/)
  })

  it('cannot update or delete other users rows (silently affects 0 rows)', async () => {
    const [bobFood] = await asUser(BOB, () => rows<{ id: string }>('select id from public.foods limit 1'))
    const updated = await asUser(ALICE, () =>
      db.query("update public.foods set name = 'hacked' where id = $1", [bobFood.id]),
    )
    const deleted = await asUser(ALICE, () => db.query('delete from public.foods where id = $1', [bobFood.id]))
    expect(updated.affectedRows).toBe(0)
    expect(deleted.affectedRows).toBe(0)
  })

  it('anonymous visitors see nothing', async () => {
    await db.exec('set role anon')
    try {
      expect(await rows('select * from public.foods')).toHaveLength(0)
      expect(await rows('select * from public.profiles')).toHaveLength(0)
    } finally {
      await db.exec('reset role')
    }
  })

  it('refuses to link a food to another user category', async () => {
    const [bobCategory] = await asUser(BOB, () => rows<{ id: string }>('select id from public.food_categories limit 1'))
    await expect(
      asUser(ALICE, () =>
        db.query(
          "insert into public.foods (name, category_id, kcal, protein_g, carbs_g, fat_g) values ('Robada', $1, 1, 0, 0, 0)",
          [bobCategory.id],
        ),
      ),
    ).rejects.toThrow(/foods_category_same_user/)
  })

  it('refuses to log another user food', async () => {
    const [bobFood] = await asUser(BOB, () => rows<{ id: string }>('select id from public.foods limit 1'))
    await expect(
      asUser(ALICE, () =>
        db.query("insert into public.log_entries (eaten_on, meal, food_id, food_name, grams, kcal, protein_g, carbs_g, fat_g) values ('2026-10-11', 'dinar', $1, '', 100, 0, 0, 0, 0)", [
          bobFood.id,
        ]),
      ),
    ).rejects.toThrow(/not found for this user/)
  })
})

describe('foods', () => {
  it('rejects impossible nutrient values', async () => {
    await expect(
      asUser(ALICE, () => insertFood('Impossible', { kcal: 500, protein_g: 60, carbs_g: 50, fat_g: 10 })),
    ).rejects.toThrow(/foods_macros_fit_100g/)
    await expect(
      asUser(ALICE, () => insertFood('Massa kcal', { kcal: 950, protein_g: 0, carbs_g: 0, fat_g: 100 })),
    ).rejects.toThrow(/foods_kcal_check/)
  })

  it('does not allow two active foods with the same name (case-insensitive)', async () => {
    await asUser(ALICE, () => insertFood('Iogurt'))
    await expect(asUser(ALICE, () => insertFood('iogurt'))).rejects.toThrow(/foods_unique_active_name/)
  })

  it('keeps the food when its category is deleted', async () => {
    const id = await asUser(ALICE, async () => {
      const [cat] = await rows<{ id: string }>("insert into public.food_categories (name) values ('Temporal') returning id")
      const [food] = await rows<{ id: string }>(
        "insert into public.foods (name, category_id, kcal, protein_g, carbs_g, fat_g) values ('Kiwi', $1, 61, 1.1, 14.7, 0.5) returning id",
        [cat.id],
      )
      await db.query('delete from public.food_categories where id = $1', [cat.id])
      return food.id
    })
    const [food] = await asUser(ALICE, () => rows<{ category_id: string | null; user_id: string }>('select category_id, user_id from public.foods where id = $1', [id]))
    expect(food).toEqual({ category_id: null, user_id: ALICE })
  })

  it('a recipe cannot contain itself', async () => {
    await expect(
      asUser(ALICE, async () => {
        const id = await insertFood('Plat circular')
        await db.query('insert into public.recipe_ingredients (recipe_id, ingredient_id, grams) values ($1, $1, 100)', [id])
      }),
    ).rejects.toThrow(/recipe_not_its_own_ingredient/)
  })
})

describe('log entries', () => {
  type Entry = { food_name: string; grams: string; kcal: string; protein_g: string; food_id: string | null; meal: string }

  it('computes the snapshot on the server and ignores client values', async () => {
    const entry = await asUser(ALICE, async () => {
      const foodId = await insertFood('Plàtan')
      const [e] = await rows<Entry>(
        "insert into public.log_entries (eaten_on, meal, food_id, food_name, grams, kcal, protein_g, carbs_g, fat_g) values ('2026-10-11', 'esmorzar', $1, 'trampa', 120, 1, 999, 0, 0) returning *",
        [foodId],
      )
      return e
    })
    expect(entry.food_name).toBe('Plàtan')
    expect(Number(entry.kcal)).toBe(106.8)
    expect(Number(entry.protein_g)).toBe(1.32)
  })

  it('keeps the original snapshot when only the meal changes, and recomputes when grams change', async () => {
    const result = await asUser(ALICE, async () => {
      const foodId = await insertFood('Poma', { kcal: 52, protein_g: 0.3, carbs_g: 14, fat_g: 0.2 })
      const [e] = await rows<{ id: string }>(
        "insert into public.log_entries (eaten_on, meal, food_id, food_name, grams, kcal, protein_g, carbs_g, fat_g) values ('2026-10-11', 'esmorzar', $1, '', 180, 0, 0, 0, 0) returning id",
        [foodId],
      )
      // The user later corrects the food values; an old entry must not change by itself.
      await db.query('update public.foods set kcal = 60 where id = $1', [foodId])
      const [moved] = await rows<Entry>("update public.log_entries set meal = 'berenar', kcal = 5 where id = $1 returning *", [e.id])
      const [resized] = await rows<Entry>('update public.log_entries set grams = 100 where id = $1 returning *', [e.id])
      return { moved, resized }
    })
    expect(result.moved.meal).toBe('berenar')
    expect(Number(result.moved.kcal)).toBe(93.6)
    expect(Number(result.resized.kcal)).toBe(60)
  })

  it('keeps history when the food is deleted', async () => {
    const entry = await asUser(ALICE, async () => {
      const foodId = await insertFood('Mel', { kcal: 304, protein_g: 0.3, carbs_g: 82, fat_g: 0 })
      const [e] = await rows<{ id: string }>(
        "insert into public.log_entries (eaten_on, meal, food_id, food_name, grams, kcal, protein_g, carbs_g, fat_g) values ('2026-10-11', 'esmorzar', $1, '', 20, 0, 0, 0, 0) returning id",
        [foodId],
      )
      await db.query('delete from public.foods where id = $1', [foodId])
      const [after] = await rows<Entry>('select * from public.log_entries where id = $1', [e.id])
      // Grams can still be edited afterwards: the snapshot is rescaled.
      const [resized] = await rows<Entry>('update public.log_entries set grams = 40 where id = $1 returning *', [e.id])
      return { after, resized }
    })
    expect(entry.after.food_id).toBeNull()
    expect(entry.after.food_name).toBe('Mel')
    expect(Number(entry.after.kcal)).toBe(60.8)
    expect(Number(entry.resized.kcal)).toBe(121.6)
  })

  it('requires a food on insert', async () => {
    await expect(
      asUser(ALICE, () =>
        db.query("insert into public.log_entries (eaten_on, meal, food_name, grams, kcal, protein_g, carbs_g, fat_g) values ('2026-10-11', 'dinar', 'x', 100, 0, 0, 0, 0)"),
      ),
    ).rejects.toThrow(/needs a food/)
  })
})

describe('food photos storage', () => {
  it('lets users write only inside their own folder', async () => {
    await asUser(ALICE, () => db.query("insert into storage.objects (bucket_id, name) values ('food-photos', $1)", [`${ALICE}/poma.webp`]))
    await expect(
      asUser(ALICE, () => db.query("insert into storage.objects (bucket_id, name) values ('food-photos', $1)", [`${BOB}/poma.webp`])),
    ).rejects.toThrow(/row-level security/)
    await expect(
      asUser(ALICE, () => db.query("insert into storage.objects (bucket_id, name) values ('food-photos', 'poma.webp')")),
    ).rejects.toThrow(/row-level security/)
    const seenByBob = await asUser(BOB, () => rows("select * from storage.objects where bucket_id = 'food-photos'"))
    expect(seenByBob).toHaveLength(0)
  })
})

describe('account deletion', () => {
  it('removes every row of the user', async () => {
    await db.query('delete from auth.users where id = $1', [BOB])
    for (const table of ['profiles', 'food_categories', 'foods', 'log_entries', 'nutrition_goals']) {
      const column = table === 'profiles' ? 'id' : 'user_id'
      const left = await rows(`select 1 from public.${table} where ${column} = $1`, [BOB])
      expect(left, table).toHaveLength(0)
    }
  })
})

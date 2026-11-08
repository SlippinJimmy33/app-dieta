-- F1 schema. Shaped so later phases plug in without reworking these tables:
--   F2 recipes  -> foods.kind = 'recipe' + recipe_ingredients (already here)
--   F2 meal tags -> derived from log_entries.meal frequency (indexed by food)
--   F2 glycemic  -> foods.glycemic_index / fiber_g / sugar_g
--   F3 notes     -> foods.notes; feelings/day context will be new tables pointing at log_entries / dates

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  time_zone text not null default 'Europe/Madrid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per change of goals, so past days keep the goal they had.
create table public.nutrition_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  valid_from date not null,
  kcal integer not null check (kcal between 500 and 10000),
  protein_g numeric(6, 1) not null check (protein_g between 0 and 1000),
  carbs_g numeric(6, 1) not null check (carbs_g between 0 and 1000),
  fat_g numeric(6, 1) not null check (fat_g between 0 and 1000),
  created_at timestamptz not null default now(),
  unique (user_id, valid_from)
);

create table public.food_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, name),
  -- Target for composite FKs that guarantee a food never points at another user's category.
  unique (id, user_id)
);

-- Nutrient values are always per 100 g; portions are scaled from them.
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  category_id uuid,
  kind text not null default 'simple' check (kind in ('simple', 'recipe')),
  kcal numeric(5, 1) not null check (kcal between 0 and 900),
  protein_g numeric(5, 2) not null check (protein_g between 0 and 100),
  carbs_g numeric(5, 2) not null check (carbs_g between 0 and 100),
  fat_g numeric(5, 2) not null check (fat_g between 0 and 100),
  fiber_g numeric(5, 2) check (fiber_g between 0 and 100),
  sugar_g numeric(5, 2) check (sugar_g between 0 and 100),
  glycemic_index smallint check (glycemic_index between 0 and 110),
  unit_name text check (char_length(btrim(unit_name)) between 1 and 30),
  unit_grams numeric(7, 1) check (unit_grams > 0 and unit_grams <= 10000),
  photo_path text check (char_length(photo_path) <= 200),
  barcode text check (barcode ~ '^[0-9]{6,14}$'),
  source text not null default 'manual' check (source in ('manual', 'openfoodfacts')),
  notes text check (char_length(notes) <= 2000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint foods_macros_fit_100g check (protein_g + carbs_g + fat_g <= 100),
  constraint foods_sugar_within_carbs check (sugar_g is null or sugar_g <= carbs_g),
  constraint foods_unit_pair check ((unit_name is null) = (unit_grams is null)),
  constraint foods_category_same_user foreign key (category_id, user_id)
    references public.food_categories (id, user_id) on delete set null (category_id),
  unique (id, user_id)
);

create unique index foods_unique_active_name on public.foods (user_id, lower(name)) where archived_at is null;
create unique index foods_unique_active_barcode on public.foods (user_id, barcode)
  where barcode is not null and archived_at is null;
create index foods_category_id_idx on public.foods (category_id);

-- F2: a recipe is a food built from other foods.
create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recipe_id uuid not null,
  ingredient_id uuid not null,
  grams numeric(7, 1) not null check (grams > 0 and grams <= 10000),
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint recipe_not_its_own_ingredient check (recipe_id <> ingredient_id),
  constraint recipe_ingredients_recipe_fk foreign key (recipe_id, user_id)
    references public.foods (id, user_id) on delete cascade,
  constraint recipe_ingredients_ingredient_fk foreign key (ingredient_id, user_id)
    references public.foods (id, user_id) on delete restrict
);

create index recipe_ingredients_recipe_idx on public.recipe_ingredients (recipe_id);
create index recipe_ingredients_ingredient_idx on public.recipe_ingredients (ingredient_id);

-- A logged portion. Name and nutrients are a snapshot taken from the food when logged,
-- so editing or deleting a food never rewrites past days.
create table public.log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  eaten_on date not null,
  meal text not null check (meal in ('esmorzar', 'dinar', 'berenar', 'sopar', 'altres')),
  food_id uuid,
  food_name text not null,
  grams numeric(7, 1) not null check (grams > 0 and grams <= 5000),
  kcal numeric(7, 1) not null check (kcal >= 0),
  protein_g numeric(7, 2) not null check (protein_g >= 0),
  carbs_g numeric(7, 2) not null check (carbs_g >= 0),
  fat_g numeric(7, 2) not null check (fat_g >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint log_entries_food_same_user foreign key (food_id, user_id)
    references public.foods (id, user_id) on delete set null (food_id)
);

create index log_entries_user_day_idx on public.log_entries (user_id, eaten_on);
create index log_entries_food_idx on public.log_entries (food_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger foods_updated_at before update on public.foods
  for each row execute function public.set_updated_at();
create trigger log_entries_updated_at before update on public.log_entries
  for each row execute function public.set_updated_at();

-- The server computes the snapshot; whatever the client sends for name/kcal/macros is ignored.
create function public.fill_log_entry_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  f public.foods%rowtype;
  factor numeric;
begin
  if tg_op = 'UPDATE' and new.food_id is null then
    -- The food was deleted (FK set null) or detached: keep the snapshot, rescaled if grams changed.
    factor := new.grams / old.grams;
    new.food_name := old.food_name;
    new.kcal := round(old.kcal * factor, 1);
    new.protein_g := round(old.protein_g * factor, 2);
    new.carbs_g := round(old.carbs_g * factor, 2);
    new.fat_g := round(old.fat_g * factor, 2);
    return new;
  end if;

  if tg_op = 'UPDATE' and new.food_id = old.food_id and new.grams = old.grams then
    -- Only meal/date changed: never re-price an old entry.
    new.food_name := old.food_name;
    new.kcal := old.kcal;
    new.protein_g := old.protein_g;
    new.carbs_g := old.carbs_g;
    new.fat_g := old.fat_g;
    return new;
  end if;

  if new.food_id is null then
    raise exception 'A log entry needs a food' using errcode = '23502';
  end if;

  select * into f from public.foods where id = new.food_id and user_id = new.user_id;
  if not found then
    raise exception 'Food % not found for this user', new.food_id using errcode = '23503';
  end if;

  factor := new.grams / 100;
  new.food_name := f.name;
  new.kcal := round(f.kcal * factor, 1);
  new.protein_g := round(f.protein_g * factor, 2);
  new.carbs_g := round(f.carbs_g * factor, 2);
  new.fat_g := round(f.fat_g * factor, 2);
  return new;
end;
$$;

create trigger log_entries_snapshot before insert or update on public.log_entries
  for each row execute function public.fill_log_entry_snapshot();

-- New account: profile (name from the signup form, trimmed and length-capped) + default categories.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(left(btrim(new.raw_user_meta_data ->> 'display_name'), 60), ''));
  insert into public.food_categories (user_id, name, sort_order)
  select new.id, c.name, c.ord
  from unnest(array['Fruita', 'Verdura', 'Cereals', 'Proteïna', 'Làctics', 'Greixos', 'Dolç', 'Begudes'])
    with ordinality as c (name, ord);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row level security: every row is visible and writable only by its owner.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.nutrition_goals enable row level security;
alter table public.food_categories enable row level security;
alter table public.foods enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.log_entries enable row level security;

-- Profiles are created by the signup trigger and removed with the account.
create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "nutrition_goals: own rows" on public.nutrition_goals
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "food_categories: own rows" on public.food_categories
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "foods: own rows" on public.foods
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "recipe_ingredients: own rows" on public.recipe_ingredients
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "log_entries: own rows" on public.log_entries
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

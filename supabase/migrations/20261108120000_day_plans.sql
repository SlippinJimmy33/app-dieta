-- Recommendations: how the user's day looks (activities, meal times, bedtime), one row per day.
-- The app derives each meal's mode (pre-workout, focus, sleep…) from it; overrides keep manual choices.

create table public.day_plans (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  -- [{ "kind": "deepwork" | "forca" | "cardio" | "esport", "start": "HH:MM", "minutes": 15..600 }]
  activities jsonb not null default '[]' check (jsonb_typeof(activities) = 'array' and jsonb_array_length(activities) <= 12),
  -- { "esmorzar": "HH:MM", ... } — only the meals whose time differs from the default
  meal_times jsonb not null default '{}' check (jsonb_typeof(meal_times) = 'object'),
  -- { "dinar": "focus", ... } — modes the user picked by hand
  mode_overrides jsonb not null default '{}' check (jsonb_typeof(mode_overrides) = 'object'),
  bedtime time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create trigger day_plans_updated_at before update on public.day_plans
  for each row execute function public.set_updated_at();

alter table public.day_plans enable row level security;

create policy "day_plans: own rows" on public.day_plans
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

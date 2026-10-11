-- Meal planning. meal_prefs: the family's meal settings plus each person's own plan (calories, macros, diet).
-- recipes: AI meal ideas (scaled to who they're for) and the ones a family chose; chosen ingredients go to the Groceries reminder list.
create table meal_prefs (
  family_id uuid primary key references families on delete cascade,
  meals text[] not null default '{breakfast,lunch,dinner,snacks}',
  diets text[] not null default '{}', avoid text[] not null default '{}', notes text check (length(notes) <= 500),
  ideas_count int not null default 4 check (ideas_count between 1 and 10), max_minutes int, budget text,
  people jsonb not null default '{}', -- { "<member slug>": { "on": true, "meals": [...], "diet": "keto", "calories": 2000, "protein": 150, "carbs": 150, "fat": 70 } }
  updated_at timestamptz not null default now()
);
alter table meal_prefs enable row level security;
create policy "family reads meal prefs" on meal_prefs for select using (family_id in (select my_family_ids()));
create policy "parents add meal prefs" on meal_prefs for insert with check (family_id in (select my_family_ids()) and i_am_parent());
create policy "parents change meal prefs" on meal_prefs for update using (family_id in (select my_family_ids()) and i_am_parent()) with check (family_id in (select my_family_ids()) and i_am_parent());

create table recipes (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references families on delete cascade,
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snacks')), for_whom text not null default 'family',
  title text not null, summary text, minutes int, servings numeric not null default 1,
  calories int, protein int, carbs int, fat int, -- per serving
  ingredients jsonb not null default '[]', -- [{ "name": "milk", "qty": 2, "unit": "cups", "aisle": "Dairy and eggs" }] for all servings
  steps text[] not null default '{}', tags text[] not null default '{}',
  planned_for date, chosen_at timestamptz, created_at timestamptz not null default now()
);
create index on recipes (family_id, created_at desc);
create index on recipes (family_id, planned_for) where planned_for is not null;
alter table recipes enable row level security;
create policy "family access" on recipes for all using (family_id in (select my_family_ids())) with check (family_id in (select my_family_ids()));

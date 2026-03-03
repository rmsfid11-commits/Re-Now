-- Dream 테이블
create table if not exists dream_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  title text,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  span text not null check (span in ('yearly', 'monthly')),
  target_date date not null,
  title text not null,
  description text,
  is_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 트리거
create or replace trigger trg_dream_entries_updated
  before update on dream_entries for each row execute function update_updated_at();
create or replace trigger trg_goals_updated
  before update on goals for each row execute function update_updated_at();

-- RLS
alter table dream_entries enable row level security;
alter table goals enable row level security;
create policy "Users own dream_entries" on dream_entries for all using (auth.uid() = user_id);
create policy "Users own goals" on goals for all using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_dream_entries_user on dream_entries(user_id, date);
create index if not exists idx_goals_user on goals(user_id, span);

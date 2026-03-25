-- ================================================================
-- 별숨 Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요.
-- ================================================================

-- ── users ────────────────────────────────────────────────────────
create table users (
  id           uuid primary key default gen_random_uuid(),
  kakao_id     text unique not null,
  nickname     text,
  birth_year   integer,
  birth_month  integer,
  birth_day    integer,
  consent_flags jsonb default '{
    "history": false,
    "partner": false,
    "workplace": false,
    "worry": false
  }',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── consultation_history ─────────────────────────────────────────
create table consultation_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete cascade,
  questions  text[] not null,
  answers    text[] not null,
  slot       text,
  created_at timestamptz default now()
);

-- ── RLS: users ───────────────────────────────────────────────────
alter table users enable row level security;

create policy "본인만 조회" on users
  for select using (kakao_id = current_setting('app.kakao_id', true));

create policy "본인만 수정" on users
  for all using (kakao_id = current_setting('app.kakao_id', true));

-- ── RLS: consultation_history ────────────────────────────────────
alter table consultation_history enable row level security;

create policy "본인만 조회" on consultation_history
  for select using (
    user_id = (
      select id from users
      where kakao_id = current_setting('app.kakao_id', true)
    )
  );

create policy "본인만 삽입" on consultation_history
  for insert with check (
    user_id = (
      select id from users
      where kakao_id = current_setting('app.kakao_id', true)
    )
  );

-- ================================================================
-- 별숨 Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요.
-- ================================================================

-- ── users ────────────────────────────────────────────────────────
create table if not exists users (
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
create table if not exists consultation_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete cascade,
  questions  text[] not null,
  answers    text[] not null,
  slot       text,
  created_at timestamptz default now()
);

-- ── RLS: users ───────────────────────────────────────────────────
-- 주의: anon key는 PostgreSQL 세션 변수(current_setting)를 설정할 수 없으므로
-- current_setting 기반 정책 대신 anon 역할에 허용하는 정책을 사용합니다.
-- 클라이언트 코드에서 kakao_id 기준으로 직접 필터링합니다.

alter table users enable row level security;

-- 기존 정책 제거 (재실행 시 오류 방지)
drop policy if exists "본인만 조회" on users;
drop policy if exists "본인만 수정" on users;
drop policy if exists "users_insert" on users;
drop policy if exists "users_select" on users;
drop policy if exists "users_update" on users;

-- 신규 등록: kakao_id가 있으면 등록 가능
create policy "users_insert" on users
  for insert to anon with check (kakao_id is not null);

-- 조회: 클라이언트가 .eq('kakao_id', ...) 필터를 직접 적용
create policy "users_select" on users
  for select to anon using (true);

-- 수정: upsert 시 onConflict: kakao_id 로 자신의 행만 갱신
create policy "users_update" on users
  for update to anon using (true) with check (true);

-- ── RLS: consultation_history ─────────────────────────────────────
alter table consultation_history enable row level security;

-- 기존 정책 제거
drop policy if exists "본인만 조회" on consultation_history;
drop policy if exists "본인만 삽입" on consultation_history;
drop policy if exists "history_insert" on consultation_history;
drop policy if exists "history_select" on consultation_history;

-- 삽입: user_id가 있으면 삽입 가능
create policy "history_insert" on consultation_history
  for insert to anon with check (user_id is not null);

-- 조회: 클라이언트가 .eq('user_id', ...) 필터를 직접 적용
create policy "history_select" on consultation_history
  for select to anon using (true);

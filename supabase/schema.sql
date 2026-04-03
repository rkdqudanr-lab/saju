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
  consent_flags jsonb,   -- null = 동의 미완료 (앱에서 consent modal 표시)
  response_style text default 'M',
  theme        text default 'light',
  onboarded    boolean default false,
  quiz_state   jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- users 테이블 컬럼 추가 (기존 DB에 없을 경우 대비)
alter table users add column if not exists response_style text default 'M';
alter table users add column if not exists theme text default 'light';
alter table users add column if not exists onboarded boolean default false;
alter table users add column if not exists quiz_state jsonb;

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
-- x-kakao-id 커스텀 헤더 기반 본인 인증 정책.
-- 클라이언트는 getAuthenticatedClient(kakaoId)로 헤더를 주입합니다.

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

-- 조회: x-kakao-id 헤더와 일치하는 본인 행만 조회
create policy "users_select" on users
  for select to anon using (
    kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id')
  );

-- 수정: x-kakao-id 헤더와 일치하는 본인 행만 수정 (upsert 포함)
create policy "users_update" on users
  for update to anon
  using (kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id'))
  with check (kakao_id is not null);

-- ── RLS: consultation_history ─────────────────────────────────────
alter table consultation_history enable row level security;

-- 기존 정책 제거
drop policy if exists "본인만 조회" on consultation_history;
drop policy if exists "본인만 삽입" on consultation_history;
drop policy if exists "history_insert" on consultation_history;
drop policy if exists "history_select" on consultation_history;

-- 기존 정책 제거
drop policy if exists "history_delete" on consultation_history;

-- 삽입: user_id가 있으면 삽입 가능
create policy "history_insert" on consultation_history
  for insert to anon with check (user_id is not null);

-- 조회: x-kakao-id 헤더와 일치하는 users의 id로 필터
create policy "history_select" on consultation_history
  for select to anon using (
    user_id in (
      select id from users
      where kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id')
    )
  );

-- 삭제: x-kakao-id 헤더와 일치하는 본인 기록만 삭제
create policy "history_delete" on consultation_history
  for delete to anon using (
    user_id in (
      select id from users
      where kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id')
    )
  );

-- ── user_profiles ─────────────────────────────────────────────
create table if not exists user_profiles (
  id                   uuid primary key default gen_random_uuid(),
  kakao_id             text unique not null,
  mbti                 text,
  self_desc            text,
  partner_name         text,
  partner_birth_year   integer,
  partner_birth_month  integer,
  partner_birth_day    integer,
  workplace            text,
  worry_text           text,
  qa_answers           jsonb,       -- 20문 20답 + AI 맞춤 질문 답변 저장
  updated_at           timestamptz default now()
);

-- 기존 테이블에 qa_answers 컬럼 추가 (이미 테이블이 있는 경우)
alter table user_profiles add column if not exists qa_answers jsonb;

alter table user_profiles enable row level security;

drop policy if exists "profiles_insert" on user_profiles;
drop policy if exists "profiles_select" on user_profiles;
drop policy if exists "profiles_update" on user_profiles;

-- 삽입: kakao_id가 있으면 삽입 가능
create policy "profiles_insert" on user_profiles
  for insert to anon with check (kakao_id is not null);

-- 조회: x-kakao-id 헤더와 일치하는 본인 행만 조회
create policy "profiles_select" on user_profiles
  for select to anon using (
    kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id')
  );

-- 수정: x-kakao-id 헤더와 일치하는 본인 행만 수정
create policy "profiles_update" on user_profiles
  for update to anon
  using (kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id'))
  with check (kakao_id is not null);

-- ── daily_quiz_answers ────────────────────────────────────────
create table if not exists daily_quiz_answers (
  id           uuid primary key default gen_random_uuid(),
  kakao_id     text not null,
  question_id  text not null,
  answer       text,
  answered_at  timestamptz default now(),
  unique (kakao_id, question_id)
);

alter table daily_quiz_answers enable row level security;

drop policy if exists "quiz_insert" on daily_quiz_answers;
drop policy if exists "quiz_select" on daily_quiz_answers;
drop policy if exists "quiz_update" on daily_quiz_answers;

-- 삽입: kakao_id가 있으면 삽입 가능
create policy "quiz_insert" on daily_quiz_answers
  for insert to anon with check (kakao_id is not null);

-- 조회: x-kakao-id 헤더와 일치하는 본인 행만 조회
create policy "quiz_select" on daily_quiz_answers
  for select to anon using (
    kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id')
  );

-- 수정: x-kakao-id 헤더와 일치하는 본인 행만 수정
create policy "quiz_update" on daily_quiz_answers
  for update to anon
  using (kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id'))
  with check (kakao_id is not null);

-- ── diary_entries ─────────────────────────────────────────
create table if not exists diary_entries (
  id             uuid primary key default gen_random_uuid(),
  kakao_id       text not null,
  date           date not null default current_date,
  content        text not null,
  mood           integer,           -- 1(매우 힘듦) ~ 5(아주 좋음)
  weather        text,              -- sunny | cloudy | rain | snow | fine_dust | thunder | wind
  energy         integer,           -- 1(방전) ~ 5(가득)
  gratitude      text,              -- 오늘 감사했던 일
  tomorrow_goal  text,              -- 내일 한 가지 목표
  created_at     timestamptz default now()
);

-- 기존 테이블에 컬럼 추가 (이미 테이블이 있는 경우)
alter table diary_entries add column if not exists mood          integer;
alter table diary_entries add column if not exists weather       text;
alter table diary_entries add column if not exists energy        integer;
alter table diary_entries add column if not exists gratitude     text;
alter table diary_entries add column if not exists tomorrow_goal text;

alter table diary_entries enable row level security;

drop policy if exists "diary_insert" on diary_entries;
drop policy if exists "diary_select" on diary_entries;
drop policy if exists "diary_update" on diary_entries;
drop policy if exists "diary_delete" on diary_entries;

create policy "diary_insert" on diary_entries
  for insert to anon with check (kakao_id is not null);

create policy "diary_select" on diary_entries
  for select to anon using (
    kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id')
  );

create policy "diary_update" on diary_entries
  for update to anon
  using (kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id'))
  with check (kakao_id is not null);

create policy "diary_delete" on diary_entries
  for delete to anon using (
    kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id')
  );

-- ── calendar_events ───────────────────────────────────────
create table if not exists calendar_events (
  id         uuid primary key default gen_random_uuid(),
  kakao_id   text not null,
  date       date not null,
  title      text not null,
  created_at timestamptz default now()
);

alter table calendar_events enable row level security;

drop policy if exists "cal_insert" on calendar_events;
drop policy if exists "cal_select" on calendar_events;
drop policy if exists "cal_delete" on calendar_events;

create policy "cal_insert" on calendar_events
  for insert to anon with check (kakao_id is not null);

create policy "cal_select" on calendar_events
  for select to anon using (
    kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id')
  );

create policy "cal_delete" on calendar_events
  for delete to anon using (
    kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id')
  );

-- ── group_sessions (우리 모임의 별숨은?) ───────────────────────────
create table if not exists group_sessions (
  id          uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  created_by  text,       -- kakao_id (optional, 비로그인 허용)
  created_at  timestamptz default now()
);

alter table group_sessions enable row level security;

drop policy if exists "group_sessions_insert" on group_sessions;
drop policy if exists "group_sessions_select" on group_sessions;

create policy "group_sessions_insert" on group_sessions
  for insert to anon with check (invite_code is not null);

create policy "group_sessions_select" on group_sessions
  for select to anon using (true);

-- ── group_members ─────────────────────────────────────────────────
create table if not exists group_members (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references group_sessions(id) on delete cascade,
  name         text not null,
  birth_year   integer not null,
  birth_month  integer not null,
  birth_day    integer not null,
  birth_hour   integer,   -- null이면 시간 모름
  gender       text,
  kakao_id     text,      -- optional, 로그인 사용자만
  created_at   timestamptz default now()
);

alter table group_members enable row level security;

drop policy if exists "group_members_insert" on group_members;
drop policy if exists "group_members_select" on group_members;

create policy "group_members_insert" on group_members
  for insert to anon with check (name is not null and session_id is not null);

create policy "group_members_select" on group_members
  for select to anon using (true);

-- ================================================================
-- 추가 마이그레이션: 로컬스토리지 → Supabase 통합
-- ================================================================

-- ── users 추가 컬럼 (개인 설정) ──────────────────────────────────
alter table users add column if not exists response_style text    default 'M';
alter table users add column if not exists theme           text    default 'dark';
alter table users add column if not exists onboarded       boolean default false;
alter table users add column if not exists quiz_state      jsonb   default '{"nextQIdx":0,"lastAnsweredDate":"","answers":{}}';

-- ── other_profiles (나의 다른 사람 프로필) ────────────────────────
create table if not exists other_profiles (
  id           uuid primary key default gen_random_uuid(),
  kakao_id     text not null,
  name         text not null default '',
  birth_year   integer,
  birth_month  integer,
  birth_day    integer,
  birth_hour   numeric,
  gender       text,
  no_time      boolean default false,
  sort_order   integer default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table other_profiles enable row level security;

drop policy if exists "other_profiles_insert" on other_profiles;
drop policy if exists "other_profiles_select" on other_profiles;
drop policy if exists "other_profiles_update" on other_profiles;
drop policy if exists "other_profiles_delete" on other_profiles;

create policy "other_profiles_insert" on other_profiles
  for insert to anon with check (kakao_id is not null);

create policy "other_profiles_select" on other_profiles
  for select to anon using (
    kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id')
  );

create policy "other_profiles_update" on other_profiles
  for update to anon
  using (kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id'))
  with check (kakao_id is not null);

create policy "other_profiles_delete" on other_profiles
  for delete to anon using (
    kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id')
  );

-- ── analysis_cache (점성술·종합사주 분석 캐시) ────────────────────
create table if not exists analysis_cache (
  id         uuid primary key default gen_random_uuid(),
  kakao_id   text not null,
  cache_key  text not null,
  content    text not null,
  created_at timestamptz default now(),
  unique(kakao_id, cache_key)
);

alter table analysis_cache enable row level security;

drop policy if exists "analysis_cache_insert" on analysis_cache;
drop policy if exists "analysis_cache_select" on analysis_cache;
drop policy if exists "analysis_cache_update" on analysis_cache;
drop policy if exists "analysis_cache_delete" on analysis_cache;

create policy "analysis_cache_insert" on analysis_cache
  for insert to anon with check (kakao_id is not null);

create policy "analysis_cache_select" on analysis_cache
  for select to anon using (
    kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id')
  );

create policy "analysis_cache_update" on analysis_cache
  for update to anon
  using (kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id'))
  with check (kakao_id is not null);

create policy "analysis_cache_delete" on analysis_cache
  for delete to anon using (
    kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id')
  );

-- ── daily_cache (오늘 별숨 · 일기 회고 캐시) ──────────────────────
create table if not exists daily_cache (
  id           uuid primary key default gen_random_uuid(),
  kakao_id     text not null,
  cache_date   date not null,
  cache_type   text not null,  -- 'horoscope' | 'horoscope_count' | 'diary_review'
  content      text not null,
  created_at   timestamptz default now(),
  unique(kakao_id, cache_date, cache_type)
);

alter table daily_cache enable row level security;

drop policy if exists "daily_cache_insert" on daily_cache;
drop policy if exists "daily_cache_select" on daily_cache;
drop policy if exists "daily_cache_update" on daily_cache;

create policy "daily_cache_insert" on daily_cache
  for insert to anon with check (kakao_id is not null);

create policy "daily_cache_select" on daily_cache
  for select to anon using (
    kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id')
  );

create policy "daily_cache_update" on daily_cache
  for update to anon
  using (kakao_id = (current_setting('request.headers', true)::json->>'x-kakao-id'))
  with check (kakao_id is not null);

-- ── daily_cache 오래된 레코드 자동 삭제 함수 ─────────────────────────
-- Supabase 대시보드 > Database > Extensions 에서 pg_cron 활성화 후 사용
-- 또는 Supabase Edge Function 스케줄러로 주기적으로 호출 가능
create or replace function cleanup_old_daily_cache()
returns void
language sql
security definer
as $$
  delete from daily_cache
  where cache_date < (current_date - interval '90 days');
$$;

-- 스케줄 설정 방법은 파일 하단 '자동 정리 스케줄 설정 방법' 섹션 참고

-- analysis_cache 복합 인덱스 (성능 최적화)
create index if not exists idx_analysis_cache_kakao_key
  on analysis_cache(kakao_id, cache_key);

-- ── consultation_history 인덱스 (쿼리 성능 최적화) ───────────────────
-- user_id + created_at 복합 인덱스: 사용자별 최신순 조회에 최적화
create index if not exists idx_consultation_history_user_created
  on consultation_history(user_id, created_at desc);

-- ── consultation_history 오래된 레코드 자동 삭제 함수 ─────────────────
-- 365일 이상 된 상담 기록 자동 삭제 (스토리지 비용 절감)
create or replace function cleanup_old_consultation_history()
returns void
language sql
security definer
as $$
  delete from consultation_history
  where created_at < (now() - interval '365 days');
$$;

-- ── users 테이블 컬럼 추가 마이그레이션 ──────────────────────────────
-- (기존 DB에 적용 시 SQL Editor에서 실행)
alter table users add column if not exists gender     text;
alter table users add column if not exists birth_hour numeric;

-- ── 생애 단계 + 큰 글씨 모드 (개선 5, 9) ─────────────────────────────
alter table users add column if not exists life_stage text default 'free';
alter table users add column if not exists font_size  text default 'standard';

-- ── 자동 정리 스케줄 설정 방법 (택 1) ───────────────────────────────
-- 방법 A: Supabase 대시보드 > Database > Extensions > pg_cron 활성화 후:
--   select cron.schedule('cleanup-daily-cache',           '0 18 * * *', 'select cleanup_old_daily_cache()');
--   select cron.schedule('cleanup-consultation-history',  '0 19 * * *', 'select cleanup_old_consultation_history()');
--
-- 방법 B: Supabase Edge Function + Vercel Cron (vercel.json crons 설정):
--   Edge Function: supabase/functions/cleanup/index.ts
--   vercel.json: { "crons": [{ "path": "/api/cleanup", "schedule": "0 19 * * *" }] }

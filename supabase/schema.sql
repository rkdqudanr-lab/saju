-- users 테이블
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  kakao_id text unique not null,
  nickname text,
  birth_year integer,
  birth_month integer,
  birth_day integer,
  consent_flags jsonb default '{ "history": false, "partner": false, "workplace": false, "worry": false }'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- consultation_history 테이블
create table if not exists consultation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  questions text[] not null,
  answers text[] not null,
  slot text,
  created_at timestamptz default now()
);

-- RLS 활성화
alter table users enable row level security;
alter table consultation_history enable row level security;

-- users RLS 정책
create policy "본인만 조회" on users
  for select using (kakao_id = current_setting('app.kakao_id', true));

create policy "본인만 upsert" on users
  for all using (kakao_id = current_setting('app.kakao_id', true));

-- consultation_history RLS 정책
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

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on users
  for each row execute function update_updated_at();

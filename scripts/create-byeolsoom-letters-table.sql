-- =====================================================
-- 별숨편지 테이블
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

CREATE TABLE IF NOT EXISTS byeolsoom_letters (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_kakao_id     TEXT NOT NULL,
  recipient_kakao_id  TEXT,                          -- 매칭 후 세팅
  content             TEXT NOT NULL CHECK (char_length(content) <= 500),
  reply_content       TEXT CHECK (char_length(reply_content) <= 500),
  reply_at            TIMESTAMPTZ,
  gender_pref         TEXT DEFAULT '상관없음',       -- '여성' | '남성' | '상관없음'
  sender_sun_sign     TEXT,                          -- 별자리 (예: 황소자리)
  sender_dom          TEXT,                          -- 오행 기운 (예: 목)
  sender_gender       TEXT,                          -- 편지 작성자 본인 성별
  compat_score        INT,                           -- 매칭 시 기운 점수
  status              TEXT DEFAULT 'pending'         -- 'pending' | 'matched' | 'replied'
                      CHECK (status IN ('pending','matched','replied')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS byeolsoom_letters_sender_idx    ON byeolsoom_letters(sender_kakao_id);
CREATE INDEX IF NOT EXISTS byeolsoom_letters_recipient_idx ON byeolsoom_letters(recipient_kakao_id);
CREATE INDEX IF NOT EXISTS byeolsoom_letters_status_idx    ON byeolsoom_letters(status);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_byeolsoom_letters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS byeolsoom_letters_updated_at_trigger ON byeolsoom_letters;
CREATE TRIGGER byeolsoom_letters_updated_at_trigger
  BEFORE UPDATE ON byeolsoom_letters
  FOR EACH ROW EXECUTE FUNCTION update_byeolsoom_letters_updated_at();

-- =====================================================
-- x-kakao-id 헤더 읽는 헬퍼 함수
-- =====================================================

CREATE OR REPLACE FUNCTION get_kakao_id()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    current_setting('request.headers', true)::json->>'x-kakao-id'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- RLS (Row Level Security) 정책
-- =====================================================

ALTER TABLE byeolsoom_letters ENABLE ROW LEVEL SECURITY;

-- pending 편지 목록 + 본인 편지 읽기
CREATE POLICY "letters_select" ON byeolsoom_letters
  FOR SELECT
  USING (
    status = 'pending'
    OR sender_kakao_id    = get_kakao_id()
    OR recipient_kakao_id = get_kakao_id()
  );

-- 본인만 편지 작성 가능
CREATE POLICY "letters_insert" ON byeolsoom_letters
  FOR INSERT
  WITH CHECK (sender_kakao_id = get_kakao_id());

-- 본인이 보낸/받은 편지만 업데이트 가능
CREATE POLICY "letters_update" ON byeolsoom_letters
  FOR UPDATE
  USING (
    sender_kakao_id    = get_kakao_id()
    OR recipient_kakao_id = get_kakao_id()
  );

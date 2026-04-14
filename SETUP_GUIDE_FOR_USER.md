# 추가 기능 수동 세팅 가이드 (Supabase & Web Push)

해당 문서는 최근 추가된 신규 기능(행운 부적 숍 갸차, 웹 푸시 알림)이 실제 배포 환경에서 완벽히 작동하기 위해 **관리자(소유자)**가 수동으로 진행해야 하는 세팅 사항을 정리한 문서입니다.

---

## 1. Supabase: 아이템 보관함(Inventory) 테이블 확인
별숨 숍(ShopPage)에서 뽑은 부적 등을 저장하기 위해 `user_shop_inventory` 테이블이 사용됩니다.
만약 이 테이블이 아직 없다면, Supabase SQL Editor에서 아래 코드를 실행해 생성해 주세요.

```sql
-- 유저의 아이템 보관함 테이블
CREATE TABLE IF NOT EXISTS public.user_shop_inventory (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    kakao_id text NOT NULL,
    item_id text NOT NULL, -- shop_items의 id 거나 새로 추가된 부적 id (talisman_1 등)
    is_equipped boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.user_shop_inventory ENABLE ROW LEVEL SECURITY;

-- 조회 정책 (본인 것만)
CREATE POLICY "Users can view own inventory" 
ON public.user_shop_inventory FOR SELECT 
USING (kakao_id = current_setting('request.headers')::json->>'x-kakao-id');

-- 삽입 정책 (본인 것만)
CREATE POLICY "Users can insert own inventory" 
ON public.user_shop_inventory FOR INSERT 
WITH CHECK (kakao_id = current_setting('request.headers')::json->>'x-kakao-id');
```

---

## 2. Supabase: 웹 푸시(Push Notification) 연동을 위한 구독 테이블 생성
사용자가 '설정 > 환경설정'에서 알림을 켰을 때(Push Permission Granted), 서버 측(Vercel)에서 해당 기기로 푸시를 쏘기 위해서는 브라우저가 생성한 `Subscription` 객체를 DB에 보관해야 합니다.
이를 위해 아래 테이블을 생성해 둡니다.

```sql
-- 푸시 알림 구독 정보 보관 테이블
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    kakao_id text NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 조회/삽입 정책
CREATE POLICY "Users can manage own subscriptions" 
ON public.push_subscriptions FOR ALL 
USING (kakao_id = current_setting('request.headers')::json->>'x-kakao-id');
```

---

## 3. 웹 푸시 알림(Web Push) 발송을 위한 Vercel / Node.js 백엔드 세팅

현재 프론트엔드(`SettingsPage.jsx`)에는 사용자의 알림 수신 동의를 받는 UI/UX가 완성되어 있습니다.
서버리스 함수나 Cron Job을 이용해 실제로 "배드타임 알림"을 발송하려면 아래 작업이 추가로 필요합니다.

1. **VAPID Keys 생성**
   - 터미널에서 `npx web-push generate-vapid-keys` 명령어로 발급한 Public/Private 키를 Vercel 환경변수(`VITE_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`)에 등록합니다.
2. **Service Worker 연동**
   - `src/sw.js` 쪽에 `self.addEventListener('push', ...)` 이벤트를 추가해 알림 팝업을 띄우는 로직을 작성합니다.
3. **구독 저장 API**
   - 클라이언트에서 얻어낸 권한 및 토큰 객체를 `supabase.from('push_subscriptions')`를 통해 저장하는 로직을 나중에 프론트엔드 함수에 추가로 연결하면 완벽합니다.

> 현 단계에서는 프론트엔드에 UI와 퍼미션 요청 기능만 예방(사전 준비) 형식으로 심어두었으니, 인프라 세팅 후 VAPID Key를 내려주시면 백엔드 연동을 완료할 수 있습니다.

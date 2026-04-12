// api/push.js — 별숨 Web Push 알림 전송 (Vercel Cron)
// 매일 KST 07:50 (UTC 22:50)에 실행됩니다.
// 환경변수: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
//           SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
//
// 알림 종류:
//   1. daily_horoscope — 오늘의 별숨 한 줄 운세
//   2. birthday_notice — 생일 당일 특별 운세
//   3. jeolgi_notice   — 절기 당일 알림

import webpush from 'web-push';
import { JEOLGI_TABLE } from '../lib/jeolgi.js';

// ─────────────────────────────────────────────────────────────
//  절기 이름 배열 (JEOLGI_TABLE 인덱스 순서)
// ─────────────────────────────────────────────────────────────
const JEOLGI_NAMES = [
  '입춘', '경칩', '청명', '입하', '망종', '소서',
  '입추', '백로', '한로', '입동', '대설', '소한',
];

/**
 * 오늘이 절기인지 확인하고, 절기명을 반환합니다.
 * @returns {string|null} 절기명 또는 null
 */
function getTodayJeolgi() {
  const now = new Date();
  // KST 기준 날짜
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth() + 1;
  const d = kst.getUTCDate();
  const table = JEOLGI_TABLE[y];
  if (!table) return null;
  for (let i = 0; i < table.length; i++) {
    const [jm, jd] = table[i];
    if (jm === m && jd === d) return JEOLGI_NAMES[i] || null;
  }
  return null;
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

// VAPID 설정
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT     || 'mailto:hello@byeolsoom.app';

/**
 * Supabase REST API 헬퍼 (service role key 사용, RLS 무시)
 */
async function supabaseFetch(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase 환경변수 없음');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });
  return res.json();
}

/**
 * Claude Haiku로 오늘의 운세 한 줄 생성 (80자 이내)
 */
async function generateDailyLine(sunSign, ilgan) {
  if (!ANTHROPIC_KEY) return '오늘도 별숨과 함께 좋은 하루 보내세요 ✦';

  const prompt = ilgan
    ? `${ilgan}일간 ${sunSign || ''}인 사람의 오늘 운세를 한 줄(60자 이내)로 말해줘. 구체적이고 긍정적으로. 이모지 1개만.`
    : `${sunSign || ''}자리의 오늘 운세를 한 줄(60자 이내)로 말해줘. 구체적이고 긍정적으로. 이모지 1개만.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text?.trim() || '오늘도 별숨과 함께 좋은 하루 보내세요 ✦';
  } catch {
    return '오늘도 별숨과 함께 좋은 하루 보내세요 ✦';
  }
}

/**
 * Web Push 전송
 */
async function sendPush(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (e) {
    // 410 Gone: 구독 만료 → 삭제 필요
    if (e.statusCode === 410) return 'expired';
    console.error('[별숨 Push] 전송 오류:', e?.message);
    return false;
  }
}

export default async function handler(req, res) {
  // Vercel Cron 인증: Authorization 헤더 검증
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET || ''}`) {
    // CRON_SECRET 없으면 로컬 테스트 허용
    if (process.env.CRON_SECRET) {
      return res.status(401).json({ error: '인증 실패' });
    }
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return res.status(500).json({ error: 'VAPID 키가 설정되지 않았어요' });
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  // daily_horoscope 알림이 켜진 유저 조회
  const users = await supabaseFetch(
    `users?select=kakao_id,push_subscription,notification_prefs,birth_year,birth_month,birth_day&notification_prefs->>daily_horoscope=eq.true&push_subscription=not.is.null`,
  );

  if (!Array.isArray(users) || users.length === 0) {
    return res.status(200).json({ sent: 0 });
  }

  let sent = 0;
  const expired = [];

  // 유저당 오늘 운세 생성 후 전송
  // (비용 최적화: 동일 출생 정보 그룹 캐싱은 추후 구현)
  for (const user of users) {
    if (!user.push_subscription) continue;

    let sub;
    try {
      sub = typeof user.push_subscription === 'string'
        ? JSON.parse(user.push_subscription)
        : user.push_subscription;
    } catch { continue; }

    const body = await generateDailyLine(null, null);

    const result = await sendPush(sub, {
      title: '✦ 오늘의 별숨',
      body,
      url: '/',
      tag: `daily-${new Date().toISOString().slice(0, 10)}`,
    });

    if (result === 'expired') expired.push(user.kakao_id);
    else if (result) sent++;
  }

  // 만료된 구독 정리
  if (expired.length > 0) {
    for (const kakaoId of expired) {
      await supabaseFetch(
        `users?kakao_id=eq.${encodeURIComponent(kakaoId)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ push_subscription: null }),
        },
      );
    }
  }

  // ── 생일 알림 ──────────────────────────────────────────────
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const todayMonth = kst.getUTCMonth() + 1;
  const todayDay   = kst.getUTCDate();

  const birthdayUsers = await supabaseFetch(
    `users?select=kakao_id,push_subscription,notification_prefs,birth_month,birth_day` +
    `&notification_prefs->>birthday_notice=eq.true&push_subscription=not.is.null` +
    `&birth_month=eq.${todayMonth}&birth_day=eq.${todayDay}`,
  );

  let sentBirthday = 0;
  if (Array.isArray(birthdayUsers)) {
    for (const u of birthdayUsers) {
      let sub;
      try { sub = typeof u.push_subscription === 'string' ? JSON.parse(u.push_subscription) : u.push_subscription; }
      catch { continue; }
      const result = await sendPush(sub, {
        title: '🎂 생일 축하해요!',
        body: '오늘은 특별한 날이에요. 별숨이 당신의 생일 운세를 준비했어요 ✦',
        url: '/',
        tag: `birthday-${todayMonth}-${todayDay}`,
      });
      if (result === true) sentBirthday++;
    }
  }

  // ── 절기 알림 ──────────────────────────────────────────────
  const jeolgiName = getTodayJeolgi();
  let sentJeolgi = 0;
  if (jeolgiName) {
    const jeolgiUsers = await supabaseFetch(
      `users?select=kakao_id,push_subscription,notification_prefs` +
      `&notification_prefs->>jeolgi_notice=eq.true&push_subscription=not.is.null`,
    );
    if (Array.isArray(jeolgiUsers)) {
      for (const u of jeolgiUsers) {
        let sub;
        try { sub = typeof u.push_subscription === 'string' ? JSON.parse(u.push_subscription) : u.push_subscription; }
        catch { continue; }
        const result = await sendPush(sub, {
          title: `🌿 오늘은 ${jeolgiName}이에요`,
          body: `계절의 전환점, 별숨이 오늘의 기운을 읽어드려요 ✦`,
          url: '/',
          tag: `jeolgi-${jeolgiName}-${kst.getUTCFullYear()}`,
        });
        if (result === true) sentJeolgi++;
      }
    }
  }

  return res.status(200).json({ sent, birthday: sentBirthday, jeolgi: sentJeolgi, expired: expired.length });
}

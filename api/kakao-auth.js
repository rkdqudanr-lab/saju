// api/kakao-auth.js
// 카카오 인가코드(code)로 액세스토큰 받고 유저정보 조회 → access/refresh 세션 발급
// 환경변수: KAKAO_REST_API_KEY, JWT_SECRET, SUPABASE_SERVICE_ROLE_KEY

import { establishLoginSession } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, redirectUri, keepLogin } = req.body;
  if (!code) return res.status(400).json({ error: 'code가 없어요' });
  // redirectUri는 인코딩 없이 토큰 요청 body에 보간되므로, 추가 파라미터 주입을
  // 막기 위해 &·?·#·공백이 없는 순수 http(s) URL만 허용한다.
  if (!redirectUri || !/^https?:\/\/[^\s&?#]+$/.test(redirectUri)) {
    return res.status(400).json({ error: 'redirectUri가 올바르지 않아요' });
  }

  const restKey = process.env.KAKAO_REST_API_KEY;
  if (!restKey) return res.status(500).json({ error: 'KAKAO_REST_API_KEY 환경변수를 설정해주세요' });

  try {
    // ── STEP 1: code → 액세스토큰 교환 ──
    // redirect_uri는 URLSearchParams 쓰면 자동 인코딩되어 KOE303 오류 발생
    // 직접 문자열로 조합해야 함
    const body = `grant_type=authorization_code&client_id=${restKey}&redirect_uri=${redirectUri}&code=${code}`;
    const ctrl1 = new AbortController();
    const t1 = setTimeout(() => ctrl1.abort(), 8000);
    let tokenRes;
    try {
      tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: ctrl1.signal,
      });
    } finally { clearTimeout(t1); }
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      console.error('토큰 교환 실패:', tokenData);
      return res.status(400).json({ error: tokenData.error_description || '토큰 교환 실패' });
    }

    // ── STEP 2: 액세스토큰 → 유저정보 ──
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 8000);
    let userRes;
    try {
      userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        signal: ctrl2.signal,
      });
    } finally { clearTimeout(t2); }
    const userData = await userRes.json();
    if (!userRes.ok) {
      return res.status(userRes.status).json({ error: '유저 정보 조회 실패' });
    }

    const kakaoId   = String(userData.id);
    const nickname  = userData.kakao_account?.profile?.nickname || '별님';
    let profileImage = userData.kakao_account?.profile?.thumbnail_image_url || null;
    if (profileImage && profileImage.startsWith('http://')) {
      profileImage = profileImage.replace('http://', 'https://');
    }

    // ── STEP 3: access / refresh 세션 발급 ──
    await establishLoginSession(req, res, { kakaoId, rememberLogin: keepLogin === true });

    return res.status(200).json({ id: kakaoId, nickname, profileImage });

  } catch (err) {
    console.error('카카오 인증 오류:', err);
    return res.status(500).json({ error: '인증 중 오류가 났어요 🌙' });
  }
}

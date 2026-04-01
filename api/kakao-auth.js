// api/kakao-auth.js
// 카카오 인가코드(code)로 액세스토큰 받고 유저정보 조회 → JWT 발급
// 환경변수: KAKAO_REST_API_KEY, JWT_SECRET

import { signJWT } from '../lib/jwt.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, redirectUri } = req.body;
  if (!code) return res.status(400).json({ error: 'code가 없어요' });

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
    const profileImage = userData.kakao_account?.profile?.thumbnail_image_url || null;

    // ── STEP 3: JWT 발급 (24시간 유효) ──
    const jwtSecret = process.env.JWT_SECRET;
    let token = null;
    if (jwtSecret) {
      token = signJWT({ sub: kakaoId, nickname }, jwtSecret, 86400);
    } else {
      // 로컬 개발 환경: JWT_SECRET 미설정 시 토큰 생략 (경고만 출력)
      console.warn('[별숨] JWT_SECRET 환경변수가 없어요. 토큰 없이 응답합니다.');
    }

    return res.status(200).json({ id: kakaoId, nickname, profileImage, token });

  } catch (err) {
    console.error('카카오 인증 오류:', err);
    return res.status(500).json({ error: '인증 중 오류가 났어요 🌙' });
  }
}

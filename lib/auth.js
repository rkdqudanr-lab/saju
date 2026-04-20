import { verifyJWT } from "./jwt.js";

// ── JWT 또는 kakao_id 기반 사용자 검증 ──
// 우선순위: Authorization: Bearer <JWT> → kakao_id 형식 검증 (하위 호환)
// JWT_SECRET 환경변수가 있으면 JWT 검증 활성화
export async function verifyUser(req) {
  const jwtSecret = process.env.JWT_SECRET;
  
  // JWT 검증 (Authorization 헤더)
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (jwtSecret) {
      const payload = verifyJWT(token, jwtSecret);
      if (payload?.sub) return { ok: true, kakaoId: payload.sub };
      return { ok: false };
    }
    // JWT_SECRET 미설정: 토큰이 있어도 형식만 검증(로컬 개발용)
    console.warn('[별숨] JWT_SECRET 없음 — Bearer 토큰 형식 검증만 수행');
  }

  // 하위 호환: body의 kakaoId로 검증 (JWT_SECRET 미설정 또는 토큰 없는 구 클라이언트)
  const kakaoId = req.body?.kakaoId;
  if (!kakaoId) return { ok: false };
  if (!/^\d{1,20}$/.test(String(kakaoId))) return { ok: false };

  // Supabase DB 조회 (환경변수가 있을 때만)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/users?select=kakao_id&kakao_id=eq.${encodeURIComponent(String(kakaoId))}&limit=1`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return { ok: true, kakaoId };
      return { ok: false };
    } catch (e) {
      console.error('[별숨] verifyUser Supabase 연결 오류:', e?.message);
      return { ok: false };
    }
  }
  // 환경변수 미설정 = 로컬 개발 환경
  return { ok: true, kakaoId };
}

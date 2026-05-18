import crypto from "crypto";
import { signJWT, verifyJWT } from "./jwt.js";

const ACCESS_COOKIE_NAME = "byeolsoom_jwt";
const REFRESH_COOKIE_NAME = "byeolsoom_refresh";
const ACCESS_TTL_SECONDS = 86400;
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30;

function getCookieValue(req, name) {
  const raw = req.headers?.cookie || "";
  if (!raw) return "";
  const parts = raw.split(/;\s*/);
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key !== name) continue;
    return decodeURIComponent(part.slice(idx + 1));
  }
  return "";
}

function getRequestToken(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
  const cookieToken = getCookieValue(req, ACCESS_COOKIE_NAME);
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  return cookieToken || bearerToken;
}

function getSecureCookieFlag() {
  return process.env.NODE_ENV === "production";
}

function serializeCookie(name, value, { maxAge = 0, httpOnly = true } = {}) {
  const parts = [
    `${name}=${value ? encodeURIComponent(value) : ""}`,
    "Path=/",
    `SameSite=Lax`,
    `Max-Age=${Math.max(0, Math.floor(maxAge))}`,
  ];
  if (httpOnly) parts.push("HttpOnly");
  if (getSecureCookieFlag()) parts.push("Secure");
  return parts.join("; ");
}

function appendCookies(res, cookies) {
  const list = Array.isArray(cookies) ? cookies : [cookies];
  const prev = res.getHeader("Set-Cookie");
  const next = Array.isArray(prev) ? prev : prev ? [prev] : [];
  res.setHeader("Set-Cookie", [...next, ...list]);
}

function getServiceConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return { supabaseUrl, supabaseKey };
}

async function serviceFetch(path, init = {}) {
  const config = getServiceConfig();
  if (!config) throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요해요.");
  return fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.supabaseKey,
      Authorization: `Bearer ${config.supabaseKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function generateOpaqueToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function getClientIp(req) {
  return (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "")
    .split(",")[0]
    .trim()
    .slice(0, 120);
}

function issueAccessToken(kakaoId) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || !kakaoId) return null;
  return signJWT({ sub: String(kakaoId) }, jwtSecret, ACCESS_TTL_SECONDS);
}

export function clearAuthCookies(res) {
  appendCookies(res, [
    serializeCookie(ACCESS_COOKIE_NAME, "", { maxAge: 0 }),
    serializeCookie(REFRESH_COOKIE_NAME, "", { maxAge: 0 }),
  ]);
}

function setAccessCookie(res, token) {
  appendCookies(res, serializeCookie(ACCESS_COOKIE_NAME, token || "", {
    maxAge: token ? ACCESS_TTL_SECONDS : 0,
  }));
}

function setRefreshCookie(res, token, maxAgeSeconds) {
  appendCookies(res, serializeCookie(REFRESH_COOKIE_NAME, token || "", {
    maxAge: token ? maxAgeSeconds : 0,
  }));
}

async function createRefreshSession(kakaoId, rememberLogin, req) {
  if (!rememberLogin || !kakaoId || !getServiceConfig()) return null;
  const token = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000).toISOString();
  const payload = {
    kakao_id: String(kakaoId),
    session_token_hash: hashToken(token),
    remember_login: true,
    expires_at: expiresAt,
    last_used_at: new Date().toISOString(),
    user_agent: String(req.headers["user-agent"] || "").slice(0, 500) || null,
    ip_address: getClientIp(req) || null,
  };

  const res = await serviceFetch("user_sessions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`refresh session create failed: ${res.status} ${text}`);
  }
  return { token, expiresAt };
}

async function loadRefreshSessionByHash(tokenHash) {
  if (!tokenHash || !getServiceConfig()) return null;
  const nowIso = new Date().toISOString();
  const query = [
    "select=id,kakao_id,expires_at,remember_login,ip_address",
    `session_token_hash=eq.${encodeURIComponent(tokenHash)}`,
    "revoked_at=is.null",
    `expires_at=gt.${encodeURIComponent(nowIso)}`,
    "limit=1",
  ].join("&");
  const res = await serviceFetch(`user_sessions?${query}`, {
    method: "GET",
    headers: { Prefer: "count=none" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`refresh session load failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

async function patchRefreshSession(id, patch) {
  if (!id || !getServiceConfig()) return;
  const res = await serviceFetch(`user_sessions?id=eq.${encodeURIComponent(String(id))}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`refresh session patch failed: ${res.status} ${text}`);
  }
}

async function revokeRefreshSessionByHash(tokenHash) {
  if (!tokenHash || !getServiceConfig()) return;
  const res = await serviceFetch(
    `user_sessions?session_token_hash=eq.${encodeURIComponent(tokenHash)}&revoked_at=is.null`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ revoked_at: new Date().toISOString() }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`refresh session revoke failed: ${res.status} ${text}`);
  }
}

async function lookupUserByKakaoId(kakaoId) {
  if (!kakaoId) return false;
  const config = getServiceConfig();
  if (!config) return true;
  try {
    const res = await serviceFetch(
      `users?select=kakao_id&kakao_id=eq.${encodeURIComponent(String(kakaoId))}&limit=1`,
      { method: "GET" },
    );
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  } catch (e) {
    console.error("[별숨] verifyUser Supabase 연결 오류:", e?.message);
    return false;
  }
}

async function refreshAuthSession(req, res) {
  const refreshToken = getCookieValue(req, REFRESH_COOKIE_NAME);
  if (!refreshToken) return { ok: false };
  if (!getServiceConfig()) return { ok: false };

  try {
    const currentHash = hashToken(refreshToken);
    const session = await loadRefreshSessionByHash(currentHash);
    if (!session?.kakao_id) {
      clearAuthCookies(res);
      return { ok: false };
    }

    const requestIp = getClientIp(req) || null;
    if (session.ip_address && requestIp && session.ip_address !== requestIp) {
      clearAuthCookies(res);
      return { ok: false };
    }

    const nextRefreshToken = generateOpaqueToken();
    const nextExpiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000).toISOString();
    await patchRefreshSession(session.id, {
      session_token_hash: hashToken(nextRefreshToken),
      expires_at: nextExpiresAt,
      last_used_at: new Date().toISOString(),
      user_agent: String(req.headers["user-agent"] || "").slice(0, 500) || null,
      ip_address: requestIp,
    });

    const accessToken = issueAccessToken(session.kakao_id);
    if (accessToken) setAccessCookie(res, accessToken);
    setRefreshCookie(res, nextRefreshToken, REFRESH_TTL_SECONDS);

    return { ok: true, kakaoId: String(session.kakao_id), refreshed: true };
  } catch (e) {
    console.error("[별숨] refresh 세션 갱신 오류:", e?.message || e);
    clearAuthCookies(res);
    return { ok: false };
  }
}

export function verifySessionToken(req) {
  const jwtSecret = process.env.JWT_SECRET;
  const token = getRequestToken(req);
  if (!token) return { ok: false };

  if (!jwtSecret) {
    // 로컬 개발 환경에서는 JWT_SECRET 없이도 세션 체크를 통과시킨다.
    return { ok: true, kakaoId: req.body?.kakaoId || null };
  }

  const payload = verifyJWT(token, jwtSecret);
  if (payload?.sub) return { ok: true, kakaoId: payload.sub };
  return { ok: false };
}

export async function authenticateRequest(req, res, options = {}) {
  const { allowBodyFallback = true } = options;

  const sessionResult = verifySessionToken(req);
  if (sessionResult.ok) return sessionResult;

  const refreshResult = await refreshAuthSession(req, res);
  if (refreshResult.ok) return refreshResult;

  if (!allowBodyFallback) return { ok: false };
  if (process.env.JWT_SECRET) return { ok: false };

  const kakaoId = req.body?.kakaoId;
  if (!kakaoId) return { ok: false };
  if (!/^\d{1,20}$/.test(String(kakaoId))) return { ok: false };

  const exists = await lookupUserByKakaoId(kakaoId);
  if (!exists) return { ok: false };
  return { ok: true, kakaoId: String(kakaoId), fallback: true };
}

export async function establishLoginSession(req, res, { kakaoId, rememberLogin = false } = {}) {
  const accessToken = issueAccessToken(kakaoId);
  if (accessToken) setAccessCookie(res, accessToken);
  else setAccessCookie(res, "");

  if (!rememberLogin) {
    setRefreshCookie(res, "", 0);
    return { ok: true, remembered: false };
  }

  try {
    const refreshSession = await createRefreshSession(kakaoId, true, req);
    if (!refreshSession?.token) {
      setRefreshCookie(res, "", 0);
      return { ok: true, remembered: false };
    }
    setRefreshCookie(res, refreshSession.token, REFRESH_TTL_SECONDS);
    return { ok: true, remembered: true };
  } catch (e) {
    console.error("[별숨] refresh 세션 생성 오류:", e?.message || e);
    setRefreshCookie(res, "", 0);
    return { ok: true, remembered: false };
  }
}

export async function logoutRequest(req, res) {
  const refreshToken = getCookieValue(req, REFRESH_COOKIE_NAME);
  if (refreshToken && getServiceConfig()) {
    try {
      await revokeRefreshSessionByHash(hashToken(refreshToken));
    } catch (e) {
      console.error("[별숨] refresh 세션 로그아웃 오류:", e?.message || e);
    }
  }
  clearAuthCookies(res);
}

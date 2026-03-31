// lib/jwt.js — 별숨 JWT 유틸 (native Node.js crypto, 외부 의존성 없음)
import crypto from 'crypto';

function b64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlDecode(str) {
  return Buffer.from(str, 'base64url').toString('utf8');
}

/**
 * JWT 발급 (HS256)
 * @param {object} payload - { sub, nickname, ... }
 * @param {string} secret  - JWT_SECRET 환경변수
 * @param {number} [expiresIn=86400] - 만료 시간 (초, 기본 24시간)
 */
export function signJWT(payload, secret, expiresIn = 86400) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + expiresIn }));
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${header}.${body}.${sig}`;
}

/**
 * JWT 검증 (HS256)
 * @returns {object|null} payload 또는 null(검증 실패/만료)
 */
export function verifyJWT(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

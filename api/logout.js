export default async function handler(_req, res) {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [
    'byeolsoom_jwt=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
  return res.status(200).json({ ok: true });
}

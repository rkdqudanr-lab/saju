// Canvas 기반 이미지 저장 유틸리티

const FONT = 'Pretendard,-apple-system,sans-serif';
const GOLD = '#C89030';

function getThemeColors(isDark) {
  return {
    bg: isDark ? '#0D0B14' : '#F7F4EF',
    t1: isDark ? '#F0EBF8' : '#1A1420',
    t3: isDark ? '#8A7FA0' : '#8A7FA0',
  };
}

function wrapText(ctx, text, maxW, fontSize, weight = '400') {
  ctx.font = `${weight} ${fontSize}px ${FONT}`;
  const lines = [];
  for (const para of (text || '').split('\n')) {
    if (!para.trim()) { lines.push(''); continue; }
    let line = '';
    for (const ch of para.split('')) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = ch; }
      else { line = test; }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function drawHeader(ctx, { gold, t3, today, subtitle }, PADDING) {
  ctx.font = `600 20px ${FONT}`;
  ctx.fillStyle = gold;
  ctx.fillText('byeolsoom  ✦', PADDING, 48);
  ctx.font = `400 14px ${FONT}`;
  ctx.fillStyle = t3;
  ctx.fillText(subtitle, PADDING, 70);
}

export function saveShareCard({ idx, q, parsedText, isDark, today }) {
  const SCALE = 2, W = 900, PADDING = 56;
  const { bg, t1, t3 } = getThemeColors(isDark);

  const measure = document.createElement('canvas');
  const mctx = measure.getContext('2d');
  const MAX_W = W - PADDING * 2;

  const qLines    = wrapText(mctx, q, MAX_W, 22, '700');
  const bodyLines = wrapText(mctx, parsedText, MAX_W, 17);
  const LINE_H_Q = 36, LINE_H_BODY = 30, GAP = 32;
  const totalH = 80 + GAP + qLines.length * LINE_H_Q + GAP + bodyLines.length * LINE_H_BODY + GAP * 2 + 48;

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE; canvas.height = totalH * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, totalH);
  ctx.fillStyle = GOLD; ctx.fillRect(0, 0, W, 4);
  drawHeader(ctx, { gold: GOLD, t3, today, subtitle: `${today.month}월 ${today.day}일의 이야기` }, PADDING);

  let y = 70 + GAP;
  ctx.font = `700 22px ${FONT}`; ctx.fillStyle = t1;
  qLines.forEach(line => { ctx.fillText(line, PADDING, y); y += LINE_H_Q; });

  y += 12;
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(W - PADDING, y); ctx.stroke();
  y += GAP;

  ctx.font = `400 17px ${FONT}`; ctx.fillStyle = t3;
  bodyLines.forEach(line => { ctx.fillText(line, PADDING, y); y += line === '' ? LINE_H_BODY * 0.6 : LINE_H_BODY; });

  y += GAP;
  ctx.font = `400 13px ${FONT}`;
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  ctx.fillText('✦ 별숨 - 사주와 별자리로 읽는 나의 운명', PADDING, y);

  const a = document.createElement('a');
  a.download = `byeolsoom_Q${idx + 1}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

export function saveProphecyImage({ text, period, isDark, today }) {
  const SCALE = 2, W = 900, PADDING = 56;
  const { bg, t1, t3 } = getThemeColors(isDark);

  const measure = document.createElement('canvas');
  const mctx = measure.getContext('2d');
  const MAX_W = W - PADDING * 2;

  const titleLines = wrapText(mctx, `${period}의 예언`, MAX_W, 22, '700');
  const bodyLines  = wrapText(mctx, text, MAX_W, 17);
  const LINE_H = 30;
  const totalH = 80 + 32 + titleLines.length * 36 + 32 + bodyLines.length * LINE_H + 64 + 48;

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE; canvas.height = totalH * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, totalH);
  ctx.fillStyle = GOLD; ctx.fillRect(0, 0, W, 4);
  drawHeader(ctx, { gold: GOLD, t3, today, subtitle: `별숨의 예언 · ${today.month}월 ${today.day}일` }, PADDING);

  let y = 70 + 32;
  ctx.font = `700 22px ${FONT}`; ctx.fillStyle = t1;
  titleLines.forEach(line => { ctx.fillText(line, PADDING, y); y += 36; });

  y += 12;
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(W - PADDING, y); ctx.stroke();
  y += 32;

  ctx.font = `400 17px ${FONT}`; ctx.fillStyle = t3;
  bodyLines.forEach(line => { ctx.fillText(line, PADDING, y); y += line === '' ? LINE_H * 0.6 : LINE_H; });

  y += 32;
  ctx.font = `400 13px ${FONT}`;
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  ctx.fillText('✦ 별숨 - 사주와 별자리로 읽는 나의 운명', PADDING, y);

  const a = document.createElement('a');
  a.download = 'byeolsoom_prophecy.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
}

export function saveCompatImage({ result, myF, partnerF, placeObj, score, isDark }) {
  const SCALE = 2, W = 900, PADDING = 56;
  const { bg, t1, t3 } = getThemeColors(isDark);

  const bubbles = result?.bubbles || [];
  const lineH   = 52;
  const totalH  = 80 + 32 + 60 + 32 + bubbles.length * lineH + 40 + 48;

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE; canvas.height = totalH * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, totalH);
  ctx.fillStyle = GOLD; ctx.fillRect(0, 0, W, 4);

  ctx.font = `600 20px ${FONT}`; ctx.fillStyle = GOLD;
  ctx.fillText('byeolsoom  ✦', PADDING, 48);
  ctx.font = `400 14px ${FONT}`; ctx.fillStyle = t3;
  ctx.fillText(`우리가 만나면 · ${placeObj.label}`, PADDING, 70);

  let y = 70 + 32;
  ctx.font = `700 26px ${FONT}`; ctx.fillStyle = t1;
  ctx.fillText(`${myF.name || 'A'} × ${partnerF.name || 'B'} — ${score}%`, PADDING, y);
  y += 60;

  ctx.font = `400 17px ${FONT}`;
  bubbles.forEach(b => {
    const isA   = b.who === 'A';
    const name  = isA ? (myF.name || 'A') : (partnerF.name || 'B');
    const label = name + ': ';
    ctx.fillStyle = isA ? GOLD : '#9B8EC4';
    const nameW = ctx.measureText(label).width;
    const xPos  = isA ? PADDING : W - PADDING - nameW - ctx.measureText(b.text).width;
    ctx.fillText(label, xPos, y);
    ctx.fillStyle = t3;
    ctx.fillText(b.text, isA ? PADDING + nameW : W - PADDING - ctx.measureText(b.text).width, y);
    y += lineH;
  });

  y += 8;
  ctx.font = `400 13px ${FONT}`;
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  ctx.fillText('✦ 별숨 - 사주와 별자리로 읽는 나의 운명', PADDING, y);

  const a = document.createElement('a');
  a.download = 'byeolsoom_compat.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
}

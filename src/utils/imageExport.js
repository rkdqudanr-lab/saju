// Canvas 기반 이미지 저장 유틸리티
// 인스타그램 사이즈(1080×1350, 4:5) 기준, 내용 넘치면 여러 장 분할

const FONT = 'Pretendard,-apple-system,sans-serif';
const GOLD = '#C89030';

// 인스타그램 4:5 포트레이트
const IG_W = 1080;
const IG_H = 1350;
const SCALE = 2;

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

function drawHeader(ctx, { gold, t3, subtitle }, PADDING) {
  ctx.font = `600 28px ${FONT}`;
  ctx.fillStyle = gold;
  ctx.fillText('byeolsoom  ✦', PADDING, 64);
  ctx.font = `400 20px ${FONT}`;
  ctx.fillStyle = t3;
  ctx.fillText(subtitle, PADDING, 92);
}

function downloadCanvas(canvas, filename) {
  const a = document.createElement('a');
  a.download = filename;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

// 둥근 사각형 helper
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function saveShareCard({ idx, q, parsedText, isDark, today }) {
  const PADDING = 72;
  const { bg, t1, t3 } = getThemeColors(isDark);

  const measure = document.createElement('canvas');
  const mctx = measure.getContext('2d');
  const MAX_W = IG_W - PADDING * 2;

  const qLines    = wrapText(mctx, q, MAX_W, 30, '700');
  const bodyLines = wrapText(mctx, parsedText, MAX_W, 22);

  const LINE_H_Q    = 46;
  const LINE_H_BODY = 38;
  const HEADER_H    = 120;
  const Q_BLOCK_H   = qLines.length * LINE_H_Q + 60;
  const FOOTER_H    = 60;
  const DIVIDER_H   = 40;

  const contentH = IG_H - HEADER_H - Q_BLOCK_H - DIVIDER_H - FOOTER_H;
  const linesPerPage = Math.max(1, Math.floor(contentH / LINE_H_BODY));
  const totalPages = Math.ceil(bodyLines.length / linesPerPage) || 1;

  for (let page = 0; page < totalPages; page++) {
    const pageBodyLines = bodyLines.slice(page * linesPerPage, (page + 1) * linesPerPage);

    const canvas = document.createElement('canvas');
    canvas.width = IG_W * SCALE;
    canvas.height = IG_H * SCALE;
    const ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);

    ctx.fillStyle = bg; ctx.fillRect(0, 0, IG_W, IG_H);
    ctx.fillStyle = GOLD; ctx.fillRect(0, 0, IG_W, 6);

    const subtitle = `${today.month}월 ${today.day}일의 이야기${totalPages > 1 ? ` (${page + 1}/${totalPages})` : ''}`;
    drawHeader(ctx, { gold: GOLD, t3, subtitle }, PADDING);

    let y = HEADER_H;
    ctx.font = `700 30px ${FONT}`; ctx.fillStyle = t1;
    qLines.forEach(line => { ctx.fillText(line, PADDING, y); y += LINE_H_Q; });

    y += 12;
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(IG_W - PADDING, y); ctx.stroke();
    y += DIVIDER_H;

    ctx.font = `400 22px ${FONT}`; ctx.fillStyle = t3;
    pageBodyLines.forEach(line => {
      ctx.fillText(line, PADDING, y);
      y += line === '' ? LINE_H_BODY * 0.6 : LINE_H_BODY;
    });

    ctx.font = `400 18px ${FONT}`;
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
    ctx.fillText('✦ 별숨 - 사주와 별자리로 읽는 나의 운명', PADDING, IG_H - 36);

    const suffix = totalPages > 1 ? `_${page + 1}of${totalPages}` : '';
    downloadCanvas(canvas, `byeolsoom_Q${idx + 1}${suffix}.png`);
  }
}

export function saveProphecyImage({ text, period, isDark, today }) {
  const PADDING = 72;
  const { bg, t1, t3 } = getThemeColors(isDark);

  const measure = document.createElement('canvas');
  const mctx = measure.getContext('2d');
  const MAX_W = IG_W - PADDING * 2;

  const titleLines = wrapText(mctx, `${period}의 예언`, MAX_W, 30, '700');
  const bodyLines  = wrapText(mctx, text, MAX_W, 22);

  const LINE_H_TITLE = 46;
  const LINE_H_BODY  = 38;
  const HEADER_H = 120;
  const TITLE_BLOCK_H = titleLines.length * LINE_H_TITLE + 60;
  const FOOTER_H = 60;
  const DIVIDER_H = 40;

  const contentH = IG_H - HEADER_H - TITLE_BLOCK_H - DIVIDER_H - FOOTER_H;
  const linesPerPage = Math.max(1, Math.floor(contentH / LINE_H_BODY));
  const totalPages = Math.ceil(bodyLines.length / linesPerPage) || 1;

  for (let page = 0; page < totalPages; page++) {
    const pageBodyLines = bodyLines.slice(page * linesPerPage, (page + 1) * linesPerPage);

    const canvas = document.createElement('canvas');
    canvas.width = IG_W * SCALE;
    canvas.height = IG_H * SCALE;
    const ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);

    ctx.fillStyle = bg; ctx.fillRect(0, 0, IG_W, IG_H);
    ctx.fillStyle = GOLD; ctx.fillRect(0, 0, IG_W, 6);

    const subtitle = `별숨의 예언 · ${today.month}월 ${today.day}일${totalPages > 1 ? ` (${page + 1}/${totalPages})` : ''}`;
    drawHeader(ctx, { gold: GOLD, t3, subtitle }, PADDING);

    let y = HEADER_H;
    ctx.font = `700 30px ${FONT}`; ctx.fillStyle = t1;
    titleLines.forEach(line => { ctx.fillText(line, PADDING, y); y += LINE_H_TITLE; });

    y += 12;
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(IG_W - PADDING, y); ctx.stroke();
    y += DIVIDER_H;

    ctx.font = `400 22px ${FONT}`; ctx.fillStyle = t3;
    pageBodyLines.forEach(line => {
      ctx.fillText(line, PADDING, y);
      y += line === '' ? LINE_H_BODY * 0.6 : LINE_H_BODY;
    });

    ctx.font = `400 18px ${FONT}`;
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
    ctx.fillText('✦ 별숨 - 사주와 별자리로 읽는 나의 운명', PADDING, IG_H - 36);

    const suffix = totalPages > 1 ? `_${page + 1}of${totalPages}` : '';
    downloadCanvas(canvas, `byeolsoom_prophecy${suffix}.png`);
  }
}

export function saveCompatImage({ result, myF, partnerF, placeObj, score, isDark }) {
  const PADDING = 72;
  const { bg, t1, t3 } = getThemeColors(isDark);

  const bubbles = result?.bubbles || [];
  const LINE_H  = 64;
  const HEADER_H = 120;
  const TITLE_BLOCK_H = 80;
  const FOOTER_H = 60;

  const contentH = IG_H - HEADER_H - TITLE_BLOCK_H - FOOTER_H;
  const bubblesPerPage = Math.max(1, Math.floor(contentH / LINE_H));
  const totalPages = Math.ceil(bubbles.length / bubblesPerPage) || 1;

  for (let page = 0; page < totalPages; page++) {
    const pageBubbles = bubbles.slice(page * bubblesPerPage, (page + 1) * bubblesPerPage);

    const canvas = document.createElement('canvas');
    canvas.width = IG_W * SCALE;
    canvas.height = IG_H * SCALE;
    const ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);

    ctx.fillStyle = bg; ctx.fillRect(0, 0, IG_W, IG_H);
    ctx.fillStyle = GOLD; ctx.fillRect(0, 0, IG_W, 6);

    ctx.font = `600 28px ${FONT}`; ctx.fillStyle = GOLD;
    ctx.fillText('byeolsoom  ✦', PADDING, 64);
    ctx.font = `400 20px ${FONT}`; ctx.fillStyle = t3;
    ctx.fillText(`우리가 만나면 · ${placeObj.label}${totalPages > 1 ? ` (${page + 1}/${totalPages})` : ''}`, PADDING, 92);

    let y = HEADER_H;
    ctx.font = `700 34px ${FONT}`; ctx.fillStyle = t1;
    ctx.fillText(`${myF.name || 'A'} × ${partnerF.name || 'B'} — ${score}%`, PADDING, y);
    y += TITLE_BLOCK_H;

    ctx.font = `400 22px ${FONT}`;
    pageBubbles.forEach(b => {
      const isA   = b.who === 'A';
      const name  = isA ? (myF.name || 'A') : (partnerF.name || 'B');
      const label = name + ': ';
      ctx.fillStyle = isA ? GOLD : '#9B8EC4';
      const nameW = ctx.measureText(label).width;
      const xPos  = isA ? PADDING : IG_W - PADDING - nameW - ctx.measureText(b.text).width;
      ctx.fillText(label, xPos, y);
      ctx.fillStyle = t3;
      ctx.fillText(b.text, isA ? PADDING + nameW : IG_W - PADDING - ctx.measureText(b.text).width, y);
      y += LINE_H;
    });

    ctx.font = `400 18px ${FONT}`;
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
    ctx.fillText('✦ 별숨 - 사주와 별자리로 읽는 나의 운명', PADDING, IG_H - 36);

    const suffix = totalPages > 1 ? `_${page + 1}of${totalPages}` : '';
    downloadCanvas(canvas, `byeolsoom_compat${suffix}.png`);
  }
}

export function saveChatImage({ chatHistory, isDark, today }) {
  const PADDING = 72;
  const { bg, t1, t3 } = getThemeColors(isDark);

  const measure = document.createElement('canvas');
  const mctx = measure.getContext('2d');
  const MAX_W = IG_W - PADDING * 2 - 60;

  const LINE_H       = 34;
  const BUBBLE_PAD_V = 18;
  const BUBBLE_GAP   = 20;
  const ROLE_H       = 28;
  const HEADER_H     = 120;
  const FOOTER_H     = 60;

  // 채팅 메시지를 렌더링 블록으로 변환
  const blocks = [];
  for (const msg of chatHistory) {
    const isAi = msg.role === 'ai';
    const textLines = wrapText(mctx, msg.text, MAX_W - 40, 20);
    const bubbleH = textLines.length * LINE_H + BUBBLE_PAD_V * 2;
    const blockH  = ROLE_H + bubbleH + BUBBLE_GAP;
    blocks.push({ isAi, lines: textLines, bubbleH, blockH });
  }

  // 페이지 분할
  const contentH = IG_H - HEADER_H - FOOTER_H;
  const pages = [[]];
  let usedH = 0;
  for (const block of blocks) {
    if (usedH + block.blockH > contentH && pages[pages.length - 1].length > 0) {
      pages.push([]);
      usedH = 0;
    }
    pages[pages.length - 1].push(block);
    usedH += block.blockH;
  }

  const totalPages = pages.length;

  for (let page = 0; page < totalPages; page++) {
    const canvas = document.createElement('canvas');
    canvas.width = IG_W * SCALE;
    canvas.height = IG_H * SCALE;
    const ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);

    ctx.fillStyle = bg; ctx.fillRect(0, 0, IG_W, IG_H);
    ctx.fillStyle = GOLD; ctx.fillRect(0, 0, IG_W, 6);

    const subtitle = `별숨과의 대화 · ${today.month}월 ${today.day}일${totalPages > 1 ? ` (${page + 1}/${totalPages})` : ''}`;
    drawHeader(ctx, { gold: GOLD, t3, subtitle }, PADDING);

    let y = HEADER_H;
    for (const block of pages[page]) {
      const isAi = block.isAi;
      const bubbleX = isAi ? PADDING : PADDING + 80;
      const bubbleW = IG_W - PADDING * 2 - 80;

      // 역할 레이블
      ctx.font = `600 17px ${FONT}`;
      ctx.fillStyle = isAi ? GOLD : t3;
      ctx.fillText(isAi ? '✦ 별숨' : '나', bubbleX, y + 18);
      y += ROLE_H;

      // 말풍선 배경
      ctx.fillStyle = isAi
        ? (isDark ? 'rgba(200,144,48,0.12)' : 'rgba(200,144,48,0.08)')
        : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)');
      roundRect(ctx, bubbleX, y, bubbleW, block.bubbleH, 16);
      ctx.fill();

      // 텍스트
      ctx.font = `400 20px ${FONT}`;
      ctx.fillStyle = isAi ? t1 : t3;
      let ty = y + BUBBLE_PAD_V + 20;
      for (const line of block.lines) {
        ctx.fillText(line, bubbleX + 20, ty);
        ty += LINE_H;
      }
      y += block.bubbleH + BUBBLE_GAP;
    }

    ctx.font = `400 18px ${FONT}`;
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
    ctx.fillText('✦ 별숨 - 사주와 별자리로 읽는 나의 운명', PADDING, IG_H - 36);

    const suffix = totalPages > 1 ? `_${page + 1}of${totalPages}` : '';
    downloadCanvas(canvas, `byeolsoom_chat${suffix}.png`);
  }
}

// Canvas 기반 이미지 저장 유틸리티
// 인스타그램 사이즈(1080×1350, 4:5) 기준, 내용 넘치면 여러 장 분할

const FONT = 'Pretendard,-apple-system,sans-serif';
const GOLD = '#C89030';
const GOLD2 = '#E8B048';

// 오행 한글 이름
const ON_KO = { 목: '나무', 화: '불', 토: '흙', 금: '금', 수: '물' };

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

/**
 * 월간리포트 전용 이미지 저장
 * 텍스트가 길어도 글씨 크기를 줄여 한 장에 담거나 자동 다중 페이지로 저장
 */
export function saveReportImage({ reportText, isDark, today, name }) {
  const PADDING = 72;
  const { bg, t1, t3 } = getThemeColors(isDark);
  const MAX_W = IG_W - PADDING * 2;

  // [점수] [요약] 태그 strip
  const cleanText = (reportText || '')
    .replace(/\[점수\]\s*\d+\s*\n?/g, '')
    .replace(/\[요약\].*?(\n|$)/g, '')
    .trim();

  const measure = document.createElement('canvas');
  const mctx = measure.getContext('2d');

  // 텍스트 길이에 따라 폰트 크기 자동 조정 (18~22px)
  const charCount = cleanText.length;
  const bodyFontSize = charCount > 1200 ? 18 : charCount > 800 ? 20 : 22;
  const LINE_H_BODY = bodyFontSize * 1.85;

  const titleText = name ? `${name}님의 ${today.year}년 ${today.month}월 리포트` : `${today.year}년 ${today.month}월 리포트`;
  const titleLines = wrapText(mctx, titleText, MAX_W, 28, '700');
  const bodyLines = wrapText(mctx, cleanText, MAX_W, bodyFontSize);

  const HEADER_H = 120;
  const TITLE_BLOCK_H = titleLines.length * 44 + 50;
  const FOOTER_H = 60;
  const DIVIDER_H = 32;

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

    const subtitle = `별숨 월간리포트 · ${today.month}월${totalPages > 1 ? ` (${page + 1}/${totalPages})` : ''}`;
    drawHeader(ctx, { gold: GOLD, t3, subtitle }, PADDING);

    let y = HEADER_H;
    ctx.font = `700 28px ${FONT}`; ctx.fillStyle = t1;
    titleLines.forEach(line => { ctx.fillText(line, PADDING, y); y += 44; });

    y += 10;
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(IG_W - PADDING, y); ctx.stroke();
    y += DIVIDER_H;

    ctx.font = `400 ${bodyFontSize}px ${FONT}`; ctx.fillStyle = t3;
    pageBodyLines.forEach(line => {
      ctx.fillText(line, PADDING, y);
      y += line === '' ? LINE_H_BODY * 0.5 : LINE_H_BODY;
    });

    ctx.font = `400 18px ${FONT}`;
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
    ctx.fillText('✦ 별숨 - 사주와 별자리로 읽는 나의 운명', PADDING, IG_H - 36);

    const suffix = totalPages > 1 ? `_${page + 1}of${totalPages}` : '';
    downloadCanvas(canvas, `byeolsoom_report_${today.month}월${suffix}.png`);
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

// ─────────────────────────────────────────────────────────────
// 1:1 운세 공유 카드 (인스타 / 카카오 감성 정방형)
// ─────────────────────────────────────────────────────────────
export function saveFortuneCard({ name, sun, saju, today, summary, moodWord, isDark }) {
  const SIZE = 1080;
  const SCALE = 2;
  const PADDING = 80;

  const canvas = document.createElement('canvas');
  canvas.width = SIZE * SCALE;
  canvas.height = SIZE * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  // ── 배경 그라디언트 ──
  const bgGrad = ctx.createRadialGradient(SIZE / 2, SIZE / 2, 0, SIZE / 2, SIZE / 2, SIZE * 0.75);
  bgGrad.addColorStop(0, '#1A1628');
  bgGrad.addColorStop(1, '#0D0B14');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ── 상단 골드 바 ──
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 0, SIZE, 6);

  // ── 별 도트 장식 (랜덤하게 보이지만 seed 고정) ──
  const stars = [
    [120, 80, 2.5], [320, 55, 1.8], [520, 90, 2.2], [750, 70, 3],
    [900, 50, 1.5], [980, 120, 2], [60, 200, 1.8], [860, 180, 2.5],
    [440, 35, 1.5], [650, 110, 2], [200, 150, 1.2], [780, 95, 1.8],
  ];
  ctx.fillStyle = GOLD2 + '55';
  for (const [sx, sy, sr] of stars) {
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── 브랜드 + 날짜 (상단) ──
  ctx.font = `600 26px ${FONT}`;
  ctx.fillStyle = GOLD;
  ctx.fillText('byeolsoom  ✦', PADDING, 68);

  ctx.font = `400 20px ${FONT}`;
  ctx.fillStyle = '#8A7FA0';
  ctx.fillText(`${today.year}년 ${today.month}월 ${today.day}일`, PADDING, 98);

  // ── 얇은 구분선 ──
  ctx.strokeStyle = GOLD + '33';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, 120);
  ctx.lineTo(SIZE - PADDING, 120);
  ctx.stroke();

  // ── 이름 + 타이틀 ──
  const title = name ? `${name}에게 전하는` : '오늘 밤의';
  ctx.font = `400 30px ${FONT}`;
  ctx.fillStyle = '#8A7FA0';
  ctx.fillText(title, PADDING, 178);

  ctx.font = `700 48px ${FONT}`;
  ctx.fillStyle = '#F0EBF8';
  ctx.fillText('오늘의 별숨', PADDING, 240);

  // ── 칩 (사주 오행 + 별자리) ──
  const chips = [];
  if (saju?.dom) chips.push(`🀄 ${ON_KO[saju.dom] || saju.dom} 기운`);
  if (sun) chips.push(`${sun.s} ${sun.n}`);

  let chipX = PADDING;
  const chipY = 285;
  const CHIP_H = 36;
  const CHIP_PAD_X = 14;
  const CHIP_R = 10;
  ctx.font = `500 18px ${FONT}`;

  for (const chip of chips) {
    const chipW = ctx.measureText(chip).width + CHIP_PAD_X * 2;
    ctx.fillStyle = GOLD + '22';
    roundRect(ctx, chipX, chipY - 24, chipW, CHIP_H, CHIP_R);
    ctx.fill();
    ctx.strokeStyle = GOLD + '44';
    ctx.lineWidth = 1;
    roundRect(ctx, chipX, chipY - 24, chipW, CHIP_H, CHIP_R);
    ctx.stroke();
    ctx.fillStyle = GOLD2;
    ctx.fillText(chip, chipX + CHIP_PAD_X, chipY - 2);
    chipX += chipW + 10;
  }

  // ── 무드 워드 (중앙 강조) ──
  ctx.font = `700 52px ${FONT}`;
  ctx.fillStyle = GOLD2;
  const moodText = moodWord ? `${moodWord} 하루예요` : '별의 이야기';
  ctx.fillText(moodText, PADDING, 390);

  // ── 별빛 라인 구분선 ──
  const lineGrad = ctx.createLinearGradient(PADDING, 0, SIZE - PADDING, 0);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.3, GOLD + '66');
  lineGrad.addColorStop(0.7, GOLD + '66');
  lineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, 420);
  ctx.lineTo(SIZE - PADDING, 420);
  ctx.stroke();

  // ── 요약 텍스트 박스 ──
  const MAX_TEXT_W = SIZE - PADDING * 2 - 48;
  const summaryLines = summary
    ? wrapText(ctx, summary, MAX_TEXT_W, 24).slice(0, 6)
    : ['오늘의 별이 당신에게 전하는 이야기'];

  const BOX_PAD = 28;
  const LINE_H = 38;
  const boxH = summaryLines.length * LINE_H + BOX_PAD * 2;
  const boxY = 444;

  ctx.fillStyle = 'rgba(232,176,72,0.06)';
  roundRect(ctx, PADDING, boxY, SIZE - PADDING * 2, boxH, 16);
  ctx.fill();
  ctx.strokeStyle = GOLD + '33';
  ctx.lineWidth = 1;
  roundRect(ctx, PADDING, boxY, SIZE - PADDING * 2, boxH, 16);
  ctx.stroke();

  ctx.font = `400 24px ${FONT}`;
  ctx.fillStyle = '#C8BEDE';
  summaryLines.forEach((line, li) => {
    ctx.fillText(line, PADDING + BOX_PAD, boxY + BOX_PAD + 24 + li * LINE_H);
  });

  // ── 하단 브랜딩 ──
  ctx.font = `400 18px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillText('✦ 별숨 — 사주와 별자리로 읽는 나의 운명', PADDING, SIZE - 36);

  downloadCanvas(canvas, `byeolsoom_fortune_${today.month}${today.day}.png`);
}

// ─────────────────────────────────────────────────────────────
//  html2canvas 기반 DOM 캡처 (ShareCardTemplate 전용)
//  Vercel 서버리스 함수 미사용 — 100% 클라이언트 사이드
// ─────────────────────────────────────────────────────────────

/**
 * ShareCardTemplate DOM 노드를 html2canvas로 캡처하여 Base64 dataURL 반환
 * @param {React.RefObject} domRef  - ShareCardTemplate의 forwardedRef
 * @returns {Promise<string>}       - 'data:image/png;base64,...'
 */
export async function captureShareCard(domRef) {
  if (!domRef?.current) throw new Error('ShareCardTemplate ref가 없습니다.');
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(domRef.current, {
    useCORS: true,
    allowTaint: true,
    scale: 2,
    width: 1080,
    height: 1080,
    backgroundColor: null,
    logging: false,
  });
  return canvas.toDataURL('image/png');
}

/**
 * Base64 dataURL을 파일로 다운로드
 * @param {string} dataUrl
 * @param {string} filename
 */
export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.download = filename;
  a.href = dataUrl;
  a.click();
}

// ─────────────────────────────────────────────────────────────
//  별숨 통계 공유카드 (Canvas 기반, 1080×1350)
// ─────────────────────────────────────────────────────────────

/**
 * @param {object} p
 * @param {string} p.nickname
 * @param {number} p.total          - 총 상담 횟수
 * @param {Array}  p.catData        - [{label, value}, ...]
 * @param {Array}  p.monthData      - [{label, value}, ...]  최근 6개월
 * @param {object} p.slotCount      - {새벽, 오전, 오후, 저녁}
 * @param {number} p.guardianLevel
 * @param {number} p.currentBp
 * @param {boolean} p.isDark
 */
// ─────────────────────────────────────────────────────────────
//  대운 리포트 PDF export (html2canvas → jsPDF)
// ─────────────────────────────────────────────────────────────

/**
 * DaeunPage DOM을 html2canvas로 캡처해서 PDF로 저장합니다.
 * DaeunPage 최상위 div에 id="daeun-report-root" 가 있어야 합니다.
 * @param {string} nickname
 */
export async function saveDaeunPDF(nickname) {
  const el = document.getElementById('daeun-report-root');
  if (!el) throw new Error('daeun-report-root 요소를 찾을 수 없어요');

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#0D0B14',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const A4_W = 210; // mm
  const imgH = (canvas.height * A4_W) / canvas.width;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  pdf.addImage(imgData, 'PNG', 0, 0, A4_W, imgH);
  pdf.save(`별숨_대운리포트_${nickname || '나의별숨'}.pdf`);
}

export function saveStatsCard({ nickname, total, catData, monthData, slotCount, guardianLevel, currentBp, isDark }) {
  const PADDING = 72;
  const { bg, t1, t3 } = getThemeColors(isDark);

  const canvas = document.createElement('canvas');
  canvas.width = IG_W * SCALE;
  canvas.height = IG_H * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  // 배경
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, IG_W, IG_H);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 0, IG_W, 6);

  // 헤더
  drawHeader(ctx, { gold: GOLD, t3, subtitle: `${nickname}님의 별숨 사용 패턴` }, PADDING);

  let y = 130;

  // ── 총 상담 수 ──
  ctx.font = `800 80px ${FONT}`;
  ctx.fillStyle = GOLD;
  ctx.fillText(String(total), PADDING, y + 70);
  ctx.font = `400 24px ${FONT}`;
  ctx.fillStyle = t3;
  ctx.fillText('번의 별숨 상담', PADDING + ctx.measureText(String(total)).width + 14, y + 54);

  y += 110;

  // ── 구분선 ──
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(IG_W - PADDING, y); ctx.stroke();
  y += 40;

  // ── 상위 카테고리 ──
  ctx.font = `700 26px ${FONT}`;
  ctx.fillStyle = GOLD;
  ctx.fillText('✦ 가장 많이 물어본 주제', PADDING, y);
  y += 44;

  const TOP = catData.slice(0, 4);
  const maxCat = Math.max(1, ...TOP.map(d => d.value));
  const BAR_MAX_W = IG_W - PADDING * 2 - 180;
  TOP.forEach(d => {
    ctx.font = `400 22px ${FONT}`;
    ctx.fillStyle = t3;
    ctx.fillText(d.label, PADDING, y);
    const barW = Math.max(4, (d.value / maxCat) * BAR_MAX_W);
    roundRect(ctx, PADDING, y + 8, barW, 16, 8);
    ctx.fillStyle = GOLD;
    ctx.fill();
    ctx.font = `700 20px ${FONT}`;
    ctx.fillStyle = t1;
    ctx.fillText(`${d.value}회`, PADDING + barW + 12, y + 20);
    y += 52;
  });

  y += 10;
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(IG_W - PADDING, y); ctx.stroke();
  y += 40;

  // ── 시간대 패턴 ──
  ctx.font = `700 26px ${FONT}`;
  ctx.fillStyle = GOLD;
  ctx.fillText('✦ 시간대별 패턴', PADDING, y);
  y += 44;

  const SLOTS = ['새벽','오전','오후','저녁'];
  const SLOT_EMOJIS = { 새벽: '🌌', 오전: '🌅', 오후: '☀️', 저녁: '🌙' };
  const maxSlot = Math.max(1, ...SLOTS.map(s => slotCount[s] || 0));
  SLOTS.forEach(s => {
    const v = slotCount[s] || 0;
    const barW = Math.max(4, (v / maxSlot) * (BAR_MAX_W - 40));
    ctx.font = `400 22px ${FONT}`;
    ctx.fillStyle = t3;
    ctx.fillText(`${SLOT_EMOJIS[s]} ${s}`, PADDING, y);
    roundRect(ctx, PADDING + 100, y - 16, barW, 14, 7);
    ctx.fillStyle = '#4A8EC4';
    ctx.fill();
    ctx.font = `700 18px ${FONT}`;
    ctx.fillStyle = t1;
    ctx.fillText(`${v}회`, PADDING + 100 + barW + 10, y - 4);
    y += 48;
  });

  y += 6;
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(IG_W - PADDING, y); ctx.stroke();
  y += 40;

  // ── 수호자 레벨 & BP ──
  ctx.font = `700 26px ${FONT}`;
  ctx.fillStyle = GOLD;
  ctx.fillText('✦ 별숨 포인트', PADDING, y);
  y += 44;
  ctx.font = `800 52px ${FONT}`;
  ctx.fillStyle = GOLD2;
  ctx.fillText(`Lv.${guardianLevel}`, PADDING, y);
  ctx.font = `400 26px ${FONT}`;
  ctx.fillStyle = t3;
  ctx.fillText(`수호자 · ${currentBp} BP 보유`, PADDING + 110, y - 8);

  // 하단 브랜딩
  ctx.font = `400 18px ${FONT}`;
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  ctx.fillText('✦ 별숨 - 사주와 별자리로 읽는 나의 운명', PADDING, IG_H - 36);

  downloadCanvas(canvas, `byeolsoom_stats_${nickname}.png`);
}

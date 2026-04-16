import { useState } from "react";

// ── 오행 테마 정의 ──
const ELEMENT_THEMES = {
  목: { label: '목(木) — 봄의 기운', bg1: '#0D1A0D', bg2: '#1A2E1A', accent: '#4CAF7D', border: '#2E6B3E', emoji: '↑' },
  화: { label: '화(火) — 열정의 기운', bg1: '#1A0D0D', bg2: '#2E1A1A', accent: '#E85050', border: '#8B2020', emoji: '↑' },
  토: { label: '토(土) — 중심의 기운', bg1: '#1A1408', bg2: '#2E2410', accent: '#D4A027', border: '#7A5C10', emoji: '◇' },
  금: { label: '금(金) — 단단한 기운', bg1: '#141418', bg2: '#222228', accent: '#C0C0D0', border: '#7878A0', emoji: '◈' },
  수: { label: '수(水) — 지혜의 기운', bg1: '#080D1A', bg2: '#10182E', accent: '#4A7EC4', border: '#1A3A8B', emoji: '◇' },
};

const STICKERS = [
  { id: 'none', emoji: '∅', label: '없음' },
  { id: 'star', emoji: '✦', label: '별' },
  { id: 'moon', emoji: '☽', label: '달' },
  { id: 'flower', emoji: '✿', label: '꽃' },
  { id: 'sparkle', emoji: '✧', label: '반짝' },
];

function drawRoundRect(ctx, x, y, w, h, r) {
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

function saveEnhancedSajuCard({ name, saju, sun, theme, stickerId }) {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  // 배경 그라디언트
  const bgGrad = ctx.createLinearGradient(0, 0, 900, 600);
  bgGrad.addColorStop(0, theme.bg1);
  bgGrad.addColorStop(1, theme.bg2);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 900, 600);

  // 테두리
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 4;
  drawRoundRect(ctx, 16, 16, 868, 568, 20);
  ctx.stroke();

  // 상단 악센트 바
  const accentGrad = ctx.createLinearGradient(16, 0, 884, 0);
  accentGrad.addColorStop(0, 'transparent');
  accentGrad.addColorStop(0.5, theme.accent);
  accentGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = accentGrad;
  ctx.fillRect(16, 16, 868, 5);

  // 브랜드 로고
  ctx.font = '500 22px Pretendard, sans-serif';
  ctx.fillStyle = theme.accent;
  ctx.textAlign = 'center';
  ctx.fillText('✦ 별숨', 450, 80);

  // 이름
  ctx.font = 'bold 68px Pretendard, sans-serif';
  ctx.fillStyle = '#F0EBF8';
  ctx.textAlign = 'center';
  ctx.fillText(name, 450, 210);

  // 구분선
  ctx.beginPath();
  ctx.moveTo(270, 240);
  ctx.lineTo(630, 240);
  ctx.strokeStyle = theme.accent + '60';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 사주 정보
  ctx.font = '600 28px Pretendard, sans-serif';
  ctx.fillStyle = theme.accent;
  ctx.textAlign = 'center';
  ctx.fillText(`${saju.il.g}${saju.il.j} · ${saju.dom} 기운`, 450, 300);

  // 별자리
  ctx.font = '400 22px Pretendard, sans-serif';
  ctx.fillStyle = 'rgba(240,235,248,0.55)';
  ctx.textAlign = 'center';
  ctx.fillText(`${sun.n} (${sun.s})`, 450, 345);

  // 스티커 (canvas는 이모지 직접 지원)
  if (stickerId && stickerId !== 'none') {
    const stickerEmoji = { star: '✦', moon: '☽', flower: '✿', sparkle: '✧' }[stickerId] || '';
    ctx.font = '52px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(stickerEmoji, 862, 80);
  }

  // 하단 브랜딩
  ctx.font = '400 16px Pretendard, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.textAlign = 'left';
  ctx.fillText('byeolsoom.com', 50, 565);

  // 다운로드
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_사주명함_${dateStr}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

export default function SajuCardPage({ form, saju, sun, setStep, showToast }) {
  const defaultThemeKey = saju?.dom || '목';
  const [selectedTheme, setSelectedTheme] = useState(defaultThemeKey);
  const [selectedSticker, setSelectedSticker] = useState('none');

  if (!saju || !sun) {
    return (
      <div className="page">
        <div className="inner" style={{ textAlign: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 20, color: 'var(--gold)' }}>✦</div>
          <div style={{ fontSize: 'var(--md)', fontWeight: 700, marginBottom: 16 }}>명함 카드 만들기</div>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginBottom: 20 }}>
            생년월일을 입력해서<br/>당신의 사주 명함을 만들어봐요
          </div>
          <button className="res-btn" style={{ width: '100%' }} onClick={() => setStep(1)}>← 뒤로</button>
        </div>
      </div>
    );
  }

  const displayName = form?.name || form?.nickname || '나';

  const theme = ELEMENT_THEMES[selectedTheme] || ELEMENT_THEMES['목'];
  const stickerEmoji = STICKERS.find(s => s.id === selectedSticker)?.emoji || '';

  const handleSave = () => {
    try {
      saveEnhancedSajuCard({ name: displayName, saju, sun, theme, stickerId: selectedSticker });
      showToast?.('명함 카드가 저장되었어요', 'success');
    } catch (e) {
      console.error('명함 카드 저장 오류:', e);
      showToast?.('저장에 실패했어요...', 'error');
    }
  };

  return (
    <div className="page">
      <div className="inner" style={{ paddingTop: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '2rem', marginBottom: 10, color: 'var(--gold)' }}>◈</div>
          <div style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
            나의 사주 명함
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
            테마와 스티커로 꾸미고 저장해봐요
          </div>
        </div>

        {/* 명함 카드 미리보기 (CSS 렌더) */}
        <div style={{
          background: `linear-gradient(135deg, ${theme.bg1}, ${theme.bg2})`,
          border: `2px solid ${theme.border}`,
          borderRadius: 'var(--r2)', padding: '24px 20px',
          marginBottom: 20, aspectRatio: '1.5 / 1',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', gap: 10,
          textAlign: 'center', position: 'relative', transition: 'all .3s',
        }}>
          {/* 상단 악센트 바 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderRadius: '12px 12px 0 0',
            background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
          }} />
          {/* 스티커 */}
          {selectedSticker !== 'none' && (
            <div style={{ position: 'absolute', top: 12, right: 16, fontSize: '1.6rem' }}>
              {stickerEmoji}
            </div>
          )}
          {/* 브랜드 */}
          <div style={{ fontSize: 'var(--xs)', color: theme.accent, letterSpacing: '.15em', fontWeight: 600, position: 'absolute', top: 14 }}>
            ✦ 별숨
          </div>
          {/* 이름 */}
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#F0EBF8', lineHeight: 1.1 }}>
            {displayName}
          </div>
          {/* 구분선 */}
          <div style={{ width: 120, height: 1, background: `${theme.accent}60` }} />
          {/* 사주 정보 */}
          <div style={{ fontSize: 'var(--sm)', color: theme.accent, fontWeight: 700 }}>
            {saju.il.g}{saju.il.j} · {saju.dom} 기운
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'rgba(240,235,248,0.55)' }}>
            {sun.n} ({sun.s})
          </div>
        </div>

        {/* 오행 테마 선택 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>
            ✦ 오행 테마
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(ELEMENT_THEMES).map(([key, th]) => (
              <button
                key={key}
                onClick={() => setSelectedTheme(key)}
                style={{
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                  border: `1px solid ${selectedTheme === key ? th.accent : 'var(--line)'}`,
                  background: selectedTheme === key ? `${th.accent}22` : 'var(--bg2)',
                  color: selectedTheme === key ? th.accent : 'var(--t3)',
                  fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
                  transition: 'all .15s', fontWeight: selectedTheme === key ? 700 : 400,
                }}
              >
                {th.emoji} {key}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 5 }}>
            {theme.label}
          </div>
        </div>

        {/* 스티커 선택 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>
            ✦ 스티커
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {STICKERS.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSticker(s.id)}
                title={s.label}
                style={{
                  width: 42, height: 42, borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${selectedSticker === s.id ? 'var(--gold)' : 'var(--line)'}`,
                  background: selectedSticker === s.id ? 'var(--goldf)' : 'var(--bg2)',
                  fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .15s', fontFamily: 'var(--ff)',
                  color: s.id === 'none' ? 'var(--t4)' : 'inherit',
                }}
              >
                {s.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
          <button className="up-btn" onClick={handleSave}>
            ◈ 명함 카드 저장
          </button>
          <button className="res-btn" onClick={() => setStep(0)}>
            ← 홈으로
          </button>
        </div>
      </div>
    </div>
  );
}

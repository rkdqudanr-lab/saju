import { useState } from "react";

// ── 오행 테마 정의 ──
const ELEMENT_THEMES = {
  목: { label: '목(木) — 봄의 기운', bg1: '#0D1A0D', bg2: '#1A2E1A', accent: '#4CAF7D', border: '#2E6B3E', emoji: '🌿' },
  화: { label: '화(火) — 열정의 기운', bg1: '#1A0D0D', bg2: '#2E1A1A', accent: '#E85050', border: '#8B2020', emoji: '🔥' },
  토: { label: '토(土) — 중심의 기운', bg1: '#1A1408', bg2: '#2E2410', accent: '#D4A027', border: '#7A5C10', emoji: '🌾' },
  금: { label: '금(金) — 단단한 기운', bg1: '#141418', bg2: '#222228', accent: '#C0C0D0', border: '#7878A0', emoji: '⚔️' },
  수: { label: '수(水) — 지혜의 기운', bg1: '#080D1A', bg2: '#10182E', accent: '#4A7EC4', border: '#1A3A8B', emoji: '🌊' },
};

const STICKERS = [
  { id: 'none', emoji: '∅', label: '없음' },
  { id: 'star', emoji: '⭐', label: '별' },
  { id: 'moon', emoji: '🌙', label: '달' },
  { id: 'flower', emoji: '🌸', label: '꽃' },
  { id: 'sparkle', emoji: '✨', label: '반짝' },
];

import { saveEnhancedSajuCard } from '../utils/imageExport.js';

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
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>🎴</div>
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
            🎴 명함 카드 저장
          </button>
          <button className="res-btn" onClick={() => setStep(0)}>
            ← 홈으로
          </button>
        </div>
      </div>
    </div>
  );
}

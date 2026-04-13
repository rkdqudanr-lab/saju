import { saveSajuNameCard } from "../utils/constants.js";

export default function SajuCardPage({ form, saju, sun, setStep, showToast }) {
  if (!form?.name || !saju || !sun) {
    return (
      <div className="page">
        <div className="inner" style={{ textAlign: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: '2rem', marginBottom: 20 }}>🎴</div>
          <div style={{ fontSize: 'var(--md)', fontWeight: 700, marginBottom: 16 }}>
            명함 카드 만들기
          </div>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginBottom: 20 }}>
            생년월일을 입력해서<br/>당신의 사주 명함을 만들어봐요
          </div>
          <button className="res-btn" style={{ width: '100%' }} onClick={() => setStep(1)}>
            ← 뒤로
          </button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    try {
      saveSajuNameCard(form.name, saju, sun);
      showToast?.('명함 카드가 저장되었어요 🎴', 'info');
    } catch (e) {
      console.error('명함 카드 저장 오류:', e);
      showToast?.('저장에 실패했어요...', 'error');
    }
  };

  return (
    <div className="page">
      <div className="inner" style={{ paddingTop: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🎴</div>
          <div style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
            나의 사주 명함
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
            이 카드를 저장해서 나누어봐요
          </div>
        </div>

        {/* 명함 카드 미리보기 */}
        <div style={{
          background: 'var(--bg2)',
          border: '2px solid var(--acc)',
          borderRadius: 'var(--r2)',
          padding: 20,
          marginBottom: 16,
          aspectRatio: '1.5 / 1',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.03em' }}>
            {form.name}
          </div>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--gold)', fontWeight: 700 }}>
            {saju.il.g}{saju.il.j} · {saju.dom} 기운
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>
            {sun.n} ({sun.s})
          </div>
        </div>

        {/* 정보 표시 */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10, letterSpacing: '.04em' }}>
            ✦ 당신의 사주
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.8 }}>
            <div>일주: {saju.il.g}{saju.il.j}</div>
            <div>기질: {saju.dom} 기운</div>
            <div>별자리: {sun.n} ({sun.s})</div>
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

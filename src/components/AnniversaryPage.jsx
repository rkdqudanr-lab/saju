import { useState, useMemo } from "react";
import { getSaju, CG, JJ, CGH, JJH, OC, ON, ILGAN_DESC } from "../utils/saju.js";

const ANNIVERSARY_TYPES = [
  { key: "결혼기념일", emoji: "💍" },
  { key: "시험일",     emoji: "📚" },
  { key: "입사일",     emoji: "💼" },
  { key: "생일",       emoji: "🎂" },
  { key: "직접입력",   emoji: "✦" },
];

const FUTURE_TYPES = [
  { key: "면접·시험일", emoji: "🎯" },
  { key: "계약·서류일", emoji: "📝" },
  { key: "결혼 후보일", emoji: "💍" },
  { key: "여행·이동일", emoji: "✈️" },
  { key: "직접입력",    emoji: "✦" },
];

const CONTEXT_LINES = {
  결혼기념일: "이 날을 선택한 이유가 있었군요. 두 사람이 하나가 된 날의 기운을 살펴볼게요.",
  시험일:     "이 날을 선택한 이유가 있었군요. 그 날의 기운이 어떻게 당신에게 작용했는지 볼게요.",
  입사일:     "이 날을 선택한 이유가 있었군요. 새 출발의 기운이 어떤 의미를 품고 있는지 알아봐요.",
  생일:       "태어난 날의 기운은 평생 당신을 따라다녀요. 그 날의 별숨을 살펴봐요.",
  직접입력:   "이 날을 선택한 이유가 있었군요. 어떤 기운이 담겨 있는지 함께 볼게요.",
};

export default function AnniversaryPage({
  form, callApi, buildCtx,
  anniversaryDate, setAnniversaryDate,
  anniversaryType, setAnniversaryType,
  ANNIVERSARY_PROMPT,
}) {
  const [customLabel, setCustomLabel] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFutureMode, setIsFutureMode] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const parsed = useMemo(() => {
    if (!anniversaryDate) return null;
    const [y, m, d] = anniversaryDate.split('-').map(Number);
    if (!y || !m || !d) return null;
    try {
      const s = getSaju(y, m, d, 12);
      return { y, m, d, saju: s };
    } catch { return null; }
  }, [anniversaryDate]);

  const activeTypes = isFutureMode ? FUTURE_TYPES : ANNIVERSARY_TYPES;
  const typeLabel = anniversaryType === '직접입력' ? (customLabel || (isFutureMode ? '계획 중인 날' : '특별한 날')) : anniversaryType;

  const handleAskAI = async () => {
    if (!parsed) return;
    setLoading(true);
    setInterpretation('');
    try {
      const dateStr = `${parsed.y}년 ${parsed.m}월 ${parsed.d}일`;
      const sajuDesc = `간지 ${parsed.saju.il.gh}${parsed.saju.il.jh}, 오행 ${ON[parsed.saju.dom]} 기운`;
      const ctx = buildCtx ? buildCtx() : '';
      const prompt = ANNIVERSARY_PROMPT(typeLabel, `${dateStr} (${sajuDesc})`, isFutureMode);
      const result = await callApi(prompt + (ctx ? `\n\n[나의 사주 정보]\n${ctx}` : ''));
      setInterpretation(result);
    } catch {
      setInterpretation('별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page step-fade">
      <div className="inner">
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp3)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{isFutureMode ? '🔮' : '🎂'}</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
            {isFutureMode ? '미래 날짜 점보기' : '기념일 운세'}
          </h2>
          <p style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginTop: 6 }}>
            {isFutureMode ? '앞으로 다가올 날의 기운을 미리 살펴봐요' : '특별한 날의 기운을 사주로 살펴봐요'}
          </p>
        </div>

        {/* 과거/미래 모드 토글 */}
        <div style={{ display: 'flex', borderRadius: 40, overflow: 'hidden', border: '1px solid var(--line)', background: 'var(--bg2)', marginBottom: 'var(--sp3)' }}>
          {[{ label: '지난 날 돌아보기', future: false }, { label: '앞으로의 날 미리보기', future: true }].map(opt => (
            <button
              key={String(opt.future)}
              onClick={() => { setIsFutureMode(opt.future); setAnniversaryType(''); setInterpretation(''); }}
              style={{
                flex: 1, padding: '10px 8px', border: 'none', fontFamily: 'var(--ff)',
                fontSize: 'var(--xs)', fontWeight: isFutureMode === opt.future ? 700 : 400,
                cursor: 'pointer', transition: 'all .2s',
                background: isFutureMode === opt.future ? 'var(--goldf)' : 'transparent',
                color: isFutureMode === opt.future ? 'var(--gold)' : 'var(--t3)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 기념일 종류 선택 */}
        <div style={{ marginBottom: 'var(--sp3)' }}>
          <div className="lbl">어떤 날인가요?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {activeTypes.map(t => (
              <button
                key={t.key}
                onClick={() => setAnniversaryType(t.key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: anniversaryType === t.key ? '2px solid var(--gold)' : '1px solid var(--line)',
                  background: anniversaryType === t.key ? 'rgba(255,210,0,.1)' : 'var(--bg2)',
                  color: anniversaryType === t.key ? 'var(--gold)' : 'var(--t2)',
                  fontFamily: 'var(--ff)',
                  cursor: 'pointer',
                  fontSize: 'var(--sm)',
                  fontWeight: anniversaryType === t.key ? 700 : 400,
                }}
              >
                {t.emoji} {t.key}
              </button>
            ))}
          </div>
          {anniversaryType === '직접입력' && (
            <input
              className="inp"
              placeholder="직접 입력"
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              style={{ marginTop: 10 }}
            />
          )}
        </div>

        {/* 날짜 선택 */}
        <div style={{ marginBottom: 'var(--sp3)' }}>
          <div className="lbl">{isFutureMode ? '어떤 날짜인가요? (미래)' : '날짜를 선택하세요'}</div>
          <input
            type="date"
            className="inp"
            value={anniversaryDate}
            min={isFutureMode ? today : undefined}
            max={isFutureMode ? undefined : today}
            onChange={e => { setAnniversaryDate(e.target.value); setInterpretation(''); }}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
          {isFutureMode && (
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 6, lineHeight: 1.6 }}>
              계약일, 면접일, 발표일 등 중요한 예정 날짜를 입력해보세요
            </div>
          )}
        </div>

        {/* 날짜 사주 요약 */}
        {parsed && (
          <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r2)', padding: 'var(--sp3)', border: '1px solid var(--line)', marginBottom: 'var(--sp3)' }}>
            {anniversaryType && (
              <div style={{ fontSize: 'var(--sm)', color: 'var(--gold)', fontWeight: 600, marginBottom: 10, lineHeight: 1.6 }}>
                {CONTEXT_LINES[anniversaryType] || CONTEXT_LINES['직접입력']}
              </div>
            )}
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 2 }}>
              <div>날짜: <strong style={{ color: 'var(--t1)' }}>{parsed.y}년 {parsed.m}월 {parsed.d}일</strong></div>
              <div>일주(日柱): <strong style={{ color: 'var(--gold)' }}>{parsed.saju.il.gh}{parsed.saju.il.jh} ({parsed.saju.il.g}{parsed.saju.il.j})</strong></div>
              <div>주요 기운: <strong>{ON[parsed.saju.dom]}</strong>({parsed.saju.dom}) 기운</div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 4 }}>{ILGAN_DESC[parsed.saju.ilgan]}</div>
            </div>

            {/* 오행 시각화 바 */}
            <div style={{ marginTop: 12, display: 'flex', gap: 4, height: 8, borderRadius: 4, overflow: 'hidden' }}>
              {Object.entries(parsed.saju.or).map(([el, cnt]) => (
                <div
                  key={el}
                  style={{
                    flex: cnt,
                    background: OC[el] || '#888',
                    minWidth: cnt > 0 ? 4 : 0,
                    transition: 'flex 0.5s',
                  }}
                  title={`${el}: ${cnt}`}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {Object.entries(parsed.saju.or).filter(([, cnt]) => cnt > 0).map(([el, cnt]) => (
                <span key={el} style={{ fontSize: '0.65rem', color: OC[el], fontWeight: 600 }}>{el} ×{cnt}</span>
              ))}
            </div>
          </div>
        )}

        {/* AI 해석 버튼 */}
        {parsed && (
          <button
            className="btn-main"
            disabled={loading}
            onClick={handleAskAI}
            style={{ marginBottom: 'var(--sp3)' }}
          >
            {loading ? '별이 기운을 읽는 중 🌙' : (isFutureMode ? '✦ 이 날의 기운 미리보기' : '✦ AI 해석 받기')}
          </button>
        )}

        {/* AI 해석 결과 */}
        {interpretation && (
          <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r2)', padding: 'var(--sp3)', border: '1px solid var(--line)', fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.9, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {interpretation}
          </div>
        )}

        {!parsed && !anniversaryDate && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--t4)', fontSize: 'var(--sm)' }}>
            날짜를 선택하면 그날의 사주 기운을 분석해드려요
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { NAME_FORTUNE_PROMPT } from "../utils/constants.js";
import FeatureLoadingScreen from "./FeatureLoadingScreen.jsx";

// ═══════════════════════════════════════════════════════════
//  📛 이름 풀이 — 성명학으로 이름 속 기운 읽기
// ═══════════════════════════════════════════════════════════

// 한글 자음 획수 (성명학 기준)
const STROKE_MAP = {
  ㄱ:2, ㄴ:2, ㄷ:3, ㄹ:5, ㅁ:4, ㅂ:4, ㅅ:2, ㅇ:1, ㅈ:3, ㅊ:4, ㅋ:3, ㅌ:4, ㅍ:4, ㅎ:3,
  ㄲ:4, ㄸ:6, ㅃ:8, ㅆ:4, ㅉ:6,
};
// 한글 모음 획수
const VOWEL_STROKE = {
  ㅏ:2, ㅐ:3, ㅑ:3, ㅒ:4, ㅓ:2, ㅔ:3, ㅕ:3, ㅖ:4, ㅗ:2, ㅘ:4, ㅙ:5, ㅚ:3, ㅛ:3,
  ㅜ:2, ㅝ:4, ㅞ:5, ㅟ:3, ㅠ:3, ㅡ:1, ㅢ:2, ㅣ:1,
};

function decomposeHangul(char) {
  const code = char.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return null;
  const INITIALS  = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const VOWELS    = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  const FINALS    = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const initial = Math.floor(code / (21 * 28));
  const vowel   = Math.floor((code % (21 * 28)) / 28);
  const final   = code % 28;
  return { initial: INITIALS[initial], vowel: VOWELS[vowel], final: FINALS[final] };
}

function calcStrokes(name) {
  let total = 0;
  for (const char of name) {
    const d = decomposeHangul(char);
    if (!d) continue;
    total += (STROKE_MAP[d.initial] || 1);
    total += (VOWEL_STROKE[d.vowel]  || 1);
    if (d.final) total += (STROKE_MAP[d.final] || 1);
  }
  return total;
}

// 초성→오행 매핑 (성명학 기준)
const INITIAL_OHAENG = {
  ㄱ:'木', ㄲ:'木', ㅋ:'木',
  ㄴ:'火', ㄷ:'火', ㄸ:'火', ㄹ:'火',
  ㅁ:'土', ㅂ:'土', ㅍ:'土', ㅃ:'土',
  ㅅ:'金', ㅆ:'金', ㅈ:'金', ㅉ:'金', ㅊ:'金',
  ㅇ:'水', ㅎ:'水',
};

function getNameOhaeng(name) {
  const counts = { 木:0, 火:0, 土:0, 金:0, 水:0 };
  for (const char of name) {
    const d = decomposeHangul(char);
    if (!d) continue;
    const oh = INITIAL_OHAENG[d.initial];
    if (oh) counts[oh]++;
  }
  return Object.entries(counts).filter(([,v]) => v > 0).map(([k, v]) => `${k}(${v})`).join(' · ');
}

export default function NameFortunePage({ form, buildCtx, callApi: callApiProp, showToast }) {
  const [name, setName] = useState(form?.name || '');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const strokes = useMemo(() => name ? calcStrokes(name) : 0, [name]);
  const sounds  = useMemo(() => name ? getNameOhaeng(name) : '', [name]);

  const handleAnalyze = async () => {
    if (!name.trim()) { showToast('이름을 입력해주세요 ✦', 'info'); return; }
    if (!callApiProp) { showToast('로그인이 필요해요', 'info'); return; }
    setLoading(true);
    setResult('');
    try {
      const prompt = NAME_FORTUNE_PROMPT({ name, strokes, sounds, sajuCtx: '' });
      const text = await callApiProp(prompt);
      setResult(text);
    } catch {
      showToast('별이 잠시 쉬고 있어요. 다시 시도해봐요', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 오행별 색상
  const OHAENG_COLOR = { 木:'#7CB87A', 火:'#E8624A', 土:'#C8A84B', 金:'#8A9BB8', 水:'#6B9EC4' };

  if (loading) return <FeatureLoadingScreen type="name" />;

  return (
    <div className="page step-fade">
      <div className="inner">
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📛</div>
          <h2 style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)', margin: 0 }}>이름 풀이</h2>
          <p style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginTop: 6 }}>
            이름 속에 담긴 기운을 별숨이 읽어드릴게요
          </p>
        </div>

        {/* 이름 입력 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>
            ✦ 이름 입력 (한글)
          </div>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="예) 김별숨"
            maxLength={6}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 'var(--r1)',
              border: '1px solid var(--line)', background: 'var(--card)',
              color: 'var(--t1)', fontSize: '1.1rem', fontWeight: 600,
              boxSizing: 'border-box', letterSpacing: '.08em', textAlign: 'center',
            }}
          />
        </div>

        {/* 사주 분석 미리보기 */}
        {name.trim().length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20,
            animation: 'fadeUp .3s ease',
          }}>
            <div style={{ padding: '12px', borderRadius: 'var(--r1)', background: 'var(--card)', border: '1px solid var(--line)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 4 }}>획수 합계</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold)' }}>{strokes}획</div>
            </div>
            <div style={{ padding: '12px', borderRadius: 'var(--r1)', background: 'var(--card)', border: '1px solid var(--line)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 4 }}>이름 오행</div>
              <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)' }}>
                {sounds || '—'}
              </div>
            </div>
          </div>
        )}

        {/* 오행 설명 */}
        {name.trim().length > 0 && sounds && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20,
            animation: 'fadeUp .3s ease',
          }}>
            {Object.entries({ 木:'나무·성장', 火:'불·열정', 土:'흙·안정', 金:'쇠·결단', 水:'물·지혜' }).map(([oh, desc]) => {
              const active = sounds.includes(oh);
              return (
                <div key={oh} style={{
                  padding: '5px 10px', borderRadius: 20, fontSize: 'var(--xs)',
                  background: active ? `${OHAENG_COLOR[oh]}22` : 'var(--card)',
                  border: `1px solid ${active ? OHAENG_COLOR[oh] : 'var(--line)'}`,
                  color: active ? OHAENG_COLOR[oh] : 'var(--t4)',
                  fontWeight: active ? 600 : 400,
                }}>
                  {oh} {desc}
                </div>
              );
            })}
          </div>
        )}

        {/* 안내 */}
        <div style={{
          padding: '10px 14px', borderRadius: 'var(--r1)',
          background: 'var(--goldf)', border: '1px solid var(--acc)',
          fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.6, marginBottom: 20,
        }}>
          ✦ 성명학은 이름의 획수·오행·음양을 분석해 사주와의 조화를 살펴요.<br />
          좋고 나쁨을 판단하기보다, 이름 속 기운을 발견하는 관점으로 읽어주세요.
        </div>

        {/* 분석 버튼 */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !name.trim()}
          style={{
            width: '100%', padding: '13px', borderRadius: 'var(--r1)', cursor: 'pointer',
            background: loading || !name.trim() ? 'var(--line)' : 'linear-gradient(135deg, var(--gold), #c8953a)',
            color: loading || !name.trim() ? 'var(--t3)' : '#1a1208',
            fontWeight: 700, fontSize: 'var(--sm)', border: 'none', marginBottom: 24,
            transition: 'all .2s',
          }}
        >
          {loading ? '이름 속 기운을 읽는 중...' : '📛 이름 풀이 받기'}
        </button>

        {/* 결과 */}
        {result && (
          <div style={{
            background: 'var(--card)', border: '1px solid var(--line)',
            borderRadius: 'var(--r1)', padding: '16px', animation: 'fadeUp .4s ease',
          }}>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10 }}>
              ✦ 별숨의 이름 풀이 — {name}
            </div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {result}
            </div>

            {/* 다른 이름 분석 */}
            <button
              onClick={() => { setResult(''); setName(''); }}
              style={{
                marginTop: 16, padding: '8px 16px', borderRadius: 20,
                border: '1px solid var(--line)', background: 'transparent',
                color: 'var(--t3)', fontSize: 'var(--xs)', cursor: 'pointer',
              }}
            >
              다른 이름 분석하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

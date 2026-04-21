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
  const [tab, setTab] = useState('analyze'); // 'analyze' | 'create' | 'english'

  // ── 이름풀이 상태 ──
  const [name, setName] = useState(form?.name || '');
  const [hanja, setHanja] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  // ── 작명 상태 ──
  const [createLastName, setCreateLastName] = useState(form?.name?.charAt(0) || '');
  const [createResult, setCreateResult] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // ── 영어이름 상태 ──
  const [engName, setEngName] = useState(form?.name || '');
  const [engResult, setEngResult] = useState('');
  const [engLoading, setEngLoading] = useState(false);

  const strokes = useMemo(() => name ? calcStrokes(name) : 0, [name]);
  const sounds  = useMemo(() => name ? getNameOhaeng(name) : '', [name]);

  const handleAnalyze = async () => {
    if (!name.trim()) { showToast('이름을 입력해주세요 ✦', 'info'); return; }
    if (!callApiProp) { showToast('로그인이 필요해요', 'info'); return; }
    setLoading(true);
    setResult('');
    try {
      const prompt = NAME_FORTUNE_PROMPT({ name, hanja: hanja.trim(), strokes, sounds, sajuCtx: '' });
      const text = await callApiProp(prompt);
      setResult(text);
    } catch {
      showToast('별이 잠시 쉬고 있어요. 다시 시도해봐요', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateName = async () => {
    if (!callApiProp) { showToast('로그인이 필요해요', 'info'); return; }
    setCreateLoading(true);
    setCreateResult('');
    try {
      const sajuCtx = buildCtx?.() || '';
      const prompt = `사주 기반 작명을 부탁드려요.

${createLastName.trim() ? `성(姓): ${createLastName.trim()}` : '성은 자유롭게 제안해주세요.'}

${sajuCtx ? `[사주 정보]\n${sajuCtx}` : ''}

사주 오행 균형을 보완하고 강화하는 이름 후보 5가지를 한글로 추천해주세요.
각 이름에 대해:
1. 이름 (한글)
2. 한자 표기 (가능한 경우)
3. 획수 합계
4. 이름 오행 구성
5. 사주와의 조화 설명 (2-3줄)

따뜻하고 희망적인 에너지가 담긴 이름으로 추천해주세요.`;
      const text = await callApiProp(prompt, { isReport: true });
      setCreateResult(text);
    } catch {
      showToast('별이 잠시 쉬고 있어요. 다시 시도해봐요', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEngName = async () => {
    if (!engName.trim()) { showToast('이름을 입력해주세요 ✦', 'info'); return; }
    if (!callApiProp) { showToast('로그인이 필요해요', 'info'); return; }
    setEngLoading(true);
    setEngResult('');
    try {
      const sajuCtx = buildCtx?.() || '';
      const prompt = `이름과 사주를 기반으로 어울리는 영어 이름을 추천해주세요.

한국 이름: ${engName.trim()}

${sajuCtx ? `[사주 정보]\n${sajuCtx}` : ''}

다음 기준으로 영어 이름 5가지를 추천해주세요:
1. 한국 이름의 발음과 비슷하거나 의미가 통하는 이름
2. 사주 오행 기운과 어울리는 이름
3. 이름의 뜻과 기원 설명
4. 해당 이름이 이 사람에게 어울리는 이유

여자/남자 구분 없이 성별 중립적인 이름도 포함해 다양하게 추천해주세요.
친근하고 부르기 쉬운 영어 이름 위주로 추천해주세요.`;
      const text = await callApiProp(prompt, { isReport: true });
      setEngResult(text);
    } catch {
      showToast('별이 잠시 쉬고 있어요. 다시 시도해봐요', 'error');
    } finally {
      setEngLoading(false);
    }
  };

  // 오행별 색상
  const OHAENG_COLOR = { 木:'#7CB87A', 火:'#E8624A', 土:'#C8A84B', 金:'#8A9BB8', 水:'#6B9EC4' };

  if (loading || createLoading || engLoading) return <FeatureLoadingScreen type="name" />;

  return (
    <div className="page step-fade">
      <div className="inner">
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📛</div>
          <h2 style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)', margin: 0 }}>이름 별숨</h2>
          <p style={{ fontSize: 'var(--sm)', color: 'var(--t3)', marginTop: 6 }}>
            이름 풀이 · 작명 · 영어이름
          </p>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 'var(--r1)', padding: 3, border: '1px solid var(--line)', marginBottom: 20 }}>
          {[{ id: 'analyze', label: '이름 풀이' }, { id: 'create', label: '작명 추천' }, { id: 'english', label: '영어 이름' }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 'calc(var(--r1) - 2px)',
                border: 'none', fontFamily: 'var(--ff)', fontSize: 'var(--xs)',
                fontWeight: tab === t.id ? 700 : 400, cursor: 'pointer', transition: 'all .15s',
                background: tab === t.id ? 'var(--goldf)' : 'transparent',
                color: tab === t.id ? 'var(--gold)' : 'var(--t4)',
                outline: tab === t.id ? '1px solid var(--acc)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── 탭: 이름풀이 ── */}
        {tab === 'analyze' && <>
        {/* 이름 입력 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>
            ✦ 이름 입력
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="예) 김별숨"
              maxLength={6}
              style={{
                flex: 1, padding: '12px 14px', borderRadius: 'var(--r1)',
                border: '1px solid var(--line)', background: 'var(--card)',
                color: 'var(--t1)', fontSize: '1.1rem', fontWeight: 600,
                boxSizing: 'border-box', letterSpacing: '.08em', textAlign: 'center',
              }}
            />
            <input
              type="text"
              value={hanja}
              onChange={e => setHanja(e.target.value)}
              placeholder="한자 (선택)"
              maxLength={8}
              style={{
                flex: 1, padding: '12px 14px', borderRadius: 'var(--r1)',
                border: '1px solid var(--line)', background: 'var(--card)',
                color: 'var(--t1)', fontSize: '1rem', fontWeight: 600,
                boxSizing: 'border-box', letterSpacing: '.06em', textAlign: 'center',
              }}
            />
          </div>
          {hanja.trim() && (
            <div style={{ fontSize: '10px', color: 'var(--t4)', marginTop: 5, textAlign: 'right' }}>
              한자 이름: {hanja.trim()}
            </div>
          )}
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
              ✦ 별숨의 이름 풀이 — {name}{hanja.trim() ? ` (${hanja.trim()})` : ''}
            </div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {result}
            </div>

            {/* 다른 이름 분석 */}
            <button
              onClick={() => { setResult(''); setName(''); setHanja(''); }}
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
        </>}

        {/* ── 탭: 작명 추천 ── */}
        {tab === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              padding: '12px 14px', borderRadius: 'var(--r1)',
              background: 'var(--goldf)', border: '1px solid var(--acc)',
              fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.6,
            }}>
              ✦ 사주 오행 균형을 고려해 좋은 기운을 담은 이름 후보를 추천해드려요.
              한자와 획수까지 분석해드릴게요.
            </div>

            <div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 8 }}>
                ✦ 성(姓) 입력 (선택)
              </div>
              <input
                type="text"
                value={createLastName}
                onChange={e => setCreateLastName(e.target.value)}
                placeholder="예) 김, 이, 박 (비워두면 자유롭게 추천)"
                maxLength={3}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 'var(--r1)',
                  border: '1px solid var(--line)', background: 'var(--card)',
                  color: 'var(--t1)', fontSize: 'var(--sm)',
                  boxSizing: 'border-box', fontFamily: 'var(--ff)',
                }}
              />
            </div>

            <button
              onClick={handleCreateName}
              style={{
                width: '100%', padding: '13px', borderRadius: 'var(--r1)', cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--gold), #c8953a)',
                color: '#1a1208', fontWeight: 700, fontSize: 'var(--sm)', border: 'none',
              }}
            >
              ✦ 사주 기반 작명 받기
            </button>

            {createResult && (
              <div style={{
                background: 'var(--card)', border: '1px solid var(--line)',
                borderRadius: 'var(--r1)', padding: '16px', animation: 'fadeUp .4s ease',
              }}>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10 }}>
                  ✦ 별숨의 이름 추천
                </div>
                <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                  {createResult}
                </div>
                <button
                  onClick={() => setCreateResult('')}
                  style={{ marginTop: 12, padding: '7px 14px', borderRadius: 20, border: '1px solid var(--line)', background: 'transparent', color: 'var(--t3)', fontSize: 'var(--xs)', cursor: 'pointer' }}
                >
                  다시 추천받기
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 탭: 영어이름 ── */}
        {tab === 'english' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              padding: '12px 14px', borderRadius: 'var(--r1)',
              background: 'var(--goldf)', border: '1px solid var(--acc)',
              fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.6,
            }}>
              ✦ 내 이름의 기운과 사주에 어울리는 영어 이름을 찾아드려요.
              발음, 의미, 오행이 잘 맞는 이름을 추천해드릴게요.
            </div>

            <div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 8 }}>
                ✦ 내 이름 (한글)
              </div>
              <input
                type="text"
                value={engName}
                onChange={e => setEngName(e.target.value)}
                placeholder="예) 김별숨"
                maxLength={6}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 'var(--r1)',
                  border: '1px solid var(--line)', background: 'var(--card)',
                  color: 'var(--t1)', fontSize: '1.1rem', fontWeight: 600,
                  boxSizing: 'border-box', letterSpacing: '.06em', textAlign: 'center',
                  fontFamily: 'var(--ff)',
                }}
              />
            </div>

            <button
              onClick={handleEngName}
              disabled={!engName.trim()}
              style={{
                width: '100%', padding: '13px', borderRadius: 'var(--r1)', cursor: 'pointer',
                background: engName.trim() ? 'linear-gradient(135deg, var(--gold), #c8953a)' : 'var(--line)',
                color: engName.trim() ? '#1a1208' : 'var(--t3)',
                fontWeight: 700, fontSize: 'var(--sm)', border: 'none',
              }}
            >
              🌏 어울리는 영어 이름 받기
            </button>

            {engResult && (
              <div style={{
                background: 'var(--card)', border: '1px solid var(--line)',
                borderRadius: 'var(--r1)', padding: '16px', animation: 'fadeUp .4s ease',
              }}>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10 }}>
                  🌏 {engName}님에게 어울리는 영어 이름
                </div>
                <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                  {engResult}
                </div>
                <button
                  onClick={() => setEngResult('')}
                  style={{ marginTop: 12, padding: '7px 14px', borderRadius: 20, border: '1px solid var(--line)', background: 'transparent', color: 'var(--t3)', fontSize: 'var(--xs)', cursor: 'pointer' }}
                >
                  다시 추천받기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

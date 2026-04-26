import { useState, useCallback } from 'react';
import useWordTyping from '../hooks/useWordTyping.js';
import { TIMING } from '../utils/constants.js';
import FeatureLoadingScreen from './FeatureLoadingScreen.jsx';
import { saveConsultationHistoryEntry } from '../utils/consultationHistory.js';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { spendBP } from '../utils/gamificationLogic.js';
import { useAppStore } from '../store/useAppStore.js';
import FeatureResultSheet from './FeatureResultSheet.jsx';

const FEATURE_COST = 10;

const PROPHECY_TAGS = ['예언기간','점수','한줄예언','기간해석','동양관점','서양관점','교차해석','지금할일','피할일','별숨한마디'];

function parseProphecySections(text) {
  if (!text) return {};
  const result = {};
  for (let i = 0; i < PROPHECY_TAGS.length; i++) {
    const tag = `[${PROPHECY_TAGS[i]}]`;
    const start = text.indexOf(tag);
    if (start === -1) continue;
    const contentStart = start + tag.length;
    let end = text.length;
    for (let j = 0; j < PROPHECY_TAGS.length; j++) {
      if (j === i) continue;
      const nx = text.indexOf(`[${PROPHECY_TAGS[j]}]`, contentStart);
      if (nx !== -1 && nx < end) end = nx;
    }
    result[PROPHECY_TAGS[i]] = text.slice(contentStart, end).trim();
  }
  return result;
}

function ProphSectionCard({ eyebrow, body, highlight }) {
  if (!body) return null;
  return (
    <div style={{
      background: highlight ? 'linear-gradient(135deg,rgba(232,176,72,.1),rgba(200,160,255,.06))' : 'var(--card)',
      border: `1px solid ${highlight ? 'var(--acc)' : 'var(--line)'}`,
      borderRadius: 'var(--r1)', padding: '14px 16px', marginBottom: 10,
    }}>
      {eyebrow && <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, marginBottom: 8, letterSpacing: '.05em' }}>{eyebrow}</div>}
      <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.85, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{body}</div>
    </div>
  );
}

function ProphActionCard({ title, body }) {
  if (!body) return null;
  const items = body.split('\n').filter(l => l.trim()).map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r1)', padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, marginBottom: 10, letterSpacing: '.05em' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--gold)', fontWeight: 700, flexShrink: 0, fontSize: 'var(--xs)' }}>{i + 1}.</span>
            <span style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.7 }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PERIOD_OPTIONS = [
  { id: '1일', label: '1일', desc: '하루의 흐름', icon: 'moon' },
  { id: '3일', label: '3일', desc: '가까운 변화의 기운', icon: 'spark' },
  { id: '1개월', label: '1개월', desc: '가장 가까운 미래', icon: 'orb' },
  { id: '3개월', label: '3개월', desc: '관계와 진로의 변곡점', icon: 'planet' },
  { id: '1년', label: '1년', desc: '크게 열리는 미래의 문', icon: 'galaxy' },
  { id: '10년', label: '10년', desc: '오래 남을 삶의 흐름', icon: 'sun' },
  { id: '30년', label: '30년', desc: '인생의 깊은 장면', icon: 'comet' },
];

function ProphecyIcon({ kind = 'orb', size = 28 }) {
  const stroke = 'rgba(232,176,72,0.92)';
  const fill = 'rgba(232,176,72,0.18)';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      {kind === 'moon' && (
        <>
          <circle cx="16" cy="16" r="10" fill={fill} />
          <path d="M20 6a9 9 0 1 0 0 20a8 8 0 1 1 0-20Z" fill={stroke} />
          <circle cx="23.5" cy="11" r="1.4" fill={stroke} />
        </>
      )}
      {kind === 'spark' && (
        <>
          <path d="M16 4l2.5 8 7.5 4-7.5 4L16 28l-2.5-8L6 16l7.5-4Z" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <circle cx="24.5" cy="8" r="1.5" fill={stroke} />
          <circle cx="8.5" cy="24" r="1.3" fill={stroke} />
        </>
      )}
      {kind === 'orb' && (
        <>
          <circle cx="16" cy="16" r="10" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <circle cx="16" cy="16" r="4" fill="none" stroke={stroke} strokeWidth="1.2" />
          <path d="M6 16h20M16 6v20" stroke={stroke} strokeWidth="1.1" opacity="0.7" />
        </>
      )}
      {kind === 'planet' && (
        <>
          <circle cx="16" cy="16" r="7" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <ellipse cx="16" cy="16" rx="13" ry="4.7" fill="none" stroke={stroke} strokeWidth="1.2" />
          <circle cx="25.5" cy="12" r="1.4" fill={stroke} />
        </>
      )}
      {kind === 'galaxy' && (
        <>
          <path d="M7 18c2-6 15-9 18-3c2 4-2 8-7 9c-6 1-10-2-11-6Z" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <circle cx="16" cy="16" r="2" fill={stroke} />
          <circle cx="10" cy="11" r="1.2" fill={stroke} />
          <circle cx="23" cy="21" r="1.2" fill={stroke} />
        </>
      )}
      {kind === 'sun' && (
        <>
          <circle cx="16" cy="16" r="6.5" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <path d="M16 3v5M16 24v5M3 16h5M24 16h5M6.7 6.7l3.5 3.5M21.8 21.8l3.5 3.5M25.3 6.7l-3.5 3.5M10.2 21.8l-3.5 3.5" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
      {kind === 'comet' && (
        <>
          <path d="M6 22c5-1 10-5 14-11" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M4.5 18.5c4-.6 7.7-2.4 11.1-5.6" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.55" />
          <circle cx="23" cy="9" r="4.2" fill={fill} stroke={stroke} strokeWidth="1.2" />
        </>
      )}
    </svg>
  );
}

export default function FutureProphecyPage({
  form,
  buildCtx,
  callApi,
  onBack,
  shareResult,
  saveImage,
  user,
  consentFlags,
  showToast,
}) {
  const [phase, setPhase] = useState('intro');
  const [selectedPeriod, setPeriod] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResultSheet, setShowResultSheet] = useState(true);
  const { shown, done, skipToEnd } = useWordTyping(text, !!text && !loading, TIMING.typingWord);

  const fetchProphecy = useCallback(async (period) => {
    setLoading(true);
    setText('');
    setPhase('result');
    setShowResultSheet(true);
    try {
      if (user?.id) {
        const confirmed = await useAppStore.getState().showBPConfirm(FEATURE_COST, 1);
        if (!confirmed) {
          setPhase('intro');
          return;
        }
        const currentBp = useAppStore.getState().gamificationState?.currentBp ?? 0;
        if (currentBp < FEATURE_COST) {
          showToast?.(`BP가 부족해요 (필요: ${FEATURE_COST} BP, 보유: ${currentBp} BP)`, 'error');
          setPhase('intro');
          return;
        }
        const client = getAuthenticatedClient(user.id);
        const { ok, newBP } = await spendBP(client, user.id, FEATURE_COST, `PROPHECY_${period}`, '미래 예언');
        if (!ok) {
          showToast?.('BP가 부족해요', 'error');
          setPhase('intro');
          return;
        }
        const cur = useAppStore.getState().gamificationState || {};
        useAppStore.getState().setGamificationData({
          gamificationState: { ...cur, currentBp: newBP ?? (currentBp - FEATURE_COST) },
          missions: useAppStore.getState().missions || [],
        });
      }

      const prompt = `[예언 요청] 지금으로부터 ${period} 뒤의 미래를 사주와 별자리 흐름으로 읽어주세요.`;
      const pText = await callApi(prompt, { isProphecy: true });
      setText(pText);
      saveConsultationHistoryEntry({
        user,
        consentFlags,
        questions: [`미래 예언: ${period}`],
        answers: [pText],
      }).catch(() => {});
    } catch {
      setText('별의 흐름을 읽는 데 잠시 실패했어요.\n조금 뒤에 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }, [callApi, consentFlags, showToast, user]);

  const handleGenerate = () => {
    if (!selectedPeriod || loading) return;
    fetchProphecy(selectedPeriod);
  };

  if (phase === 'result' && loading) return <FeatureLoadingScreen type="prophecy" />;

  if (phase === 'result') {
    const period = PERIOD_OPTIONS.find((item) => item.id === selectedPeriod) || PERIOD_OPTIONS[0];
    if (done && text && showResultSheet) {
      return (
        <FeatureResultSheet
          type="prophecy"
          eyebrow="BYEOLSOOM PROPHECY"
          title="별숨의 미래 예언"
          text={text}
          highlights={[
            { emoji: "time", label: "읽는 시간대", value: period.label, caption: period.desc },
            (form?.nickname || form?.name) ? { emoji: "star", label: "이번 예언의 주인공", value: form.nickname || form.name } : null,
          ].filter(Boolean)}
          primaryAction={() => {
            setPhase("intro");
            setText("");
            setShowResultSheet(false);
          }}
          primaryLabel="다른 미래 다시 보기"
          secondaryAction={shareResult && done ? () => shareResult("prophecy", text, selectedPeriod) : null}
          secondaryLabel={shareResult && done ? "이 예언 공유하기" : undefined}
          onDismiss={() => setShowResultSheet(false)}
        />
      );
    }

    const secs = parseProphecySections(shown);
    const hasStructure = !!secs['한줄예언'];
    const score = parseInt(secs['점수'] || '0', 10) || null;

    return (
      <div className="page-top">
        <div className="inner" style={{ animation: 'fadeUp .5s ease', paddingBottom: 80 }}>
          {/* 헤더 */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--sp3)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <ProphecyIcon kind={period.icon} size={44} />
            </div>
            <div style={{ fontSize: 'var(--xl)', fontWeight: 700, color: 'var(--gold)' }}>별숨의 예언</div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 6 }}>{period.label} 뒤, {period.desc}</div>
          </div>

          {/* 구조화 결과 */}
          {hasStructure ? (
            <>
              {/* 히어로 카드 */}
              <div style={{
                background: 'linear-gradient(135deg,rgba(232,176,72,.14),rgba(200,160,255,.08))',
                border: '1px solid var(--acc)', borderRadius: 'var(--r1)',
                padding: '18px 16px', marginBottom: 12, textAlign: 'center',
              }}>
                {score > 0 && (
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 6 }}>
                    {score}
                    <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--t3)', marginLeft: 4 }}>점</span>
                  </div>
                )}
                <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', lineHeight: 1.6, wordBreak: 'keep-all' }}>
                  {secs['한줄예언']}{!done && !secs['한줄예언'] && <span className="typing-cursor" />}
                </div>
              </div>

              <ProphSectionCard eyebrow="예언 해석" body={secs['기간해석']} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <ProphSectionCard eyebrow="동양 관점" body={secs['동양관점']} />
                <ProphSectionCard eyebrow="서양 관점" body={secs['서양관점']} />
              </div>
              <ProphSectionCard eyebrow="✦ 두 관점의 교차점" body={secs['교차해석']} highlight />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <ProphActionCard title="지금 할 일" body={secs['지금할일']} />
                <ProphActionCard title="피할 것" body={secs['피할일']} />
              </div>
              {secs['별숨한마디'] && (
                <div style={{
                  textAlign: 'center', padding: '14px 16px', marginTop: 4,
                  background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r1)',
                  fontSize: 'var(--sm)', color: 'var(--t2)', fontStyle: 'italic',
                }}>
                  {secs['별숨한마디']}
                </div>
              )}
              {!done && <div style={{ textAlign: 'center', marginTop: 4 }}><span className="typing-cursor" /></div>}
            </>
          ) : (
            /* 구버전 / 스트리밍 중 fallback — letter 스타일 */
            <div className="letter-envelope">
              <div className="letter-env-top" style={{ background: 'linear-gradient(135deg,var(--goldf),rgba(200,160,255,0.1))' }}>
                <ProphecyIcon kind={period.icon} size={30} />
              </div>
              <div className="letter-body">
                <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', marginBottom: 16, fontWeight: 600 }}>
                  {period.label} 뒤의 예언
                </div>
                <div className="letter-content" style={{ padding: 0 }}>
                  <p>{shown}{!done && <span className="typing-cursor" />}</p>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'var(--sp2)' }}>
            {!done && text && (
              <button className="btn-main" style={{ marginTop: 0, flex: 1 }} onClick={skipToEnd}>
                결과 바로 보기
              </button>
            )}
            {done && text && (
              <>
                {saveImage && (
                  <button className="res-top-btn" style={{ flex: 1, padding: 12, borderRadius: 'var(--r1)', fontSize: 'var(--xs)' }}
                    onClick={() => saveImage('prophecy', text, selectedPeriod)}>
                    이미지 저장
                  </button>
                )}
                {shareResult && (
                  <button className="res-top-btn primary" style={{ flex: 1, padding: 12, borderRadius: 'var(--r1)', fontSize: 'var(--xs)' }}
                    onClick={() => shareResult('prophecy', text, selectedPeriod)}>
                    공유하기
                  </button>
                )}
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="res-btn" style={{ flex: 1, padding: 14, borderRadius: 'var(--r1)' }}
              onClick={() => { setPhase('intro'); setText(''); }}>
              다른 미래 보기
            </button>
            <button className="res-btn" style={{ flex: 1, padding: 14, borderRadius: 'var(--r1)' }}
              onClick={onBack}>
              결과로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ justifyContent: 'center' }}>
      <div className="inner" style={{ animation: 'fadeUp .6s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp4)' }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            margin: '0 auto var(--sp2)',
            background: 'radial-gradient(circle at 35% 28%, rgba(232,176,72,.4), rgba(190,110,170,.3), rgba(50,30,90,.6))',
            border: '1px solid rgba(232,176,72,.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 32px rgba(232,176,72,.15)',
            animation: 'orbPulse 4s infinite',
          }}>
            <ProphecyIcon kind="orb" size={34} />
          </div>
          <div style={{ fontSize: 'var(--xl)', fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>
            별숨의 예언
          </div>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.8 }}>
            별이 먼저 건네는 미래의 힌트<br />
            지금의 당신에게 맞게 읽어드릴게요
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          padding: 'var(--sp3) var(--sp2)',
          marginBottom: 'var(--sp3)',
          background: 'var(--bg1)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r2)',
        }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 600, marginBottom: 10, letterSpacing: '.06em' }}>
            오늘의 질문
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--t1)', lineHeight: 1.6 }}>
            내가 지나게 될<br />미래는 어떤 결일까
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 10, lineHeight: 1.7 }}>
            {(form?.nickname || form?.name) ? `${form.nickname || form.name}님의 별이` : '당신의 별이'} 가장 먼저 비추는<br />
            그 시간의 분위기를 읽어볼게요
          </div>
        </div>

        <div style={{ marginBottom: 'var(--sp3)' }}>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginBottom: 12, textAlign: 'center' }}>
            보고 싶은 미래의 시간을 선택해 주세요
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PERIOD_OPTIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => setPeriod(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  borderRadius: 'var(--r1)',
                  border: selectedPeriod === item.id ? '1.5px solid var(--gold)' : '1px solid var(--line)',
                  background: selectedPeriod === item.id
                    ? 'linear-gradient(135deg, var(--goldf), rgba(200,160,255,0.06))'
                    : 'var(--bg2)',
                  cursor: 'pointer',
                  transition: 'all .2s',
                  fontFamily: 'var(--ff)',
                  textAlign: 'left',
                  boxShadow: selectedPeriod === item.id ? '0 0 20px rgba(232,176,72,.12)' : 'none',
                }}
              >
                <span style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ProphecyIcon kind={item.icon} size={24} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 'var(--md)',
                    fontWeight: selectedPeriod === item.id ? 700 : 500,
                    color: selectedPeriod === item.id ? 'var(--gold)' : 'var(--t1)',
                    marginBottom: 2,
                  }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>{item.desc}</div>
                </div>
                {selectedPeriod === item.id && (
                  <span style={{ fontSize: '1rem', color: 'var(--gold)' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn-main"
          disabled={!selectedPeriod}
          onClick={handleGenerate}
          style={{ width: '100%', opacity: selectedPeriod ? 1 : 0.5 }}
        >
          {selectedPeriod
            ? `${PERIOD_OPTIONS.find((item) => item.id === selectedPeriod)?.label} 뒤의 예언 보기`
            : '시간을 선택해 주세요'}
        </button>

        <button
          className="res-btn"
          style={{ width: '100%', marginTop: 8, padding: 14, borderRadius: 'var(--r1)' }}
          onClick={onBack}
        >
          결과로 돌아가기
        </button>
      </div>
    </div>
  );
}

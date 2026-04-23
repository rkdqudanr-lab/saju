import { useEffect, useMemo } from 'react';
import { ON } from '../../utils/saju.js';
import FeatureLoadingScreen from '../../components/FeatureLoadingScreen.jsx';
import { useStreamResponse } from '../../hooks/useStreamResponse.js';
import { OHAENG_COLOR, OHAENG_CHAR, stripMd } from './groupUtils.js';

export default function GroupAnalysisPanel({ members, onClose }) {
  const { streamText, isStreaming, streamError, startStream, resetStream } = useStreamResponse();
  const ctx = useMemo(() => members.map((m) => {
    let s = `[${m.name}]\n`;
    if (m.saju) s += `일주: ${m.saju.il.g}${m.saju.il.j} / 기질: ${m.saju.ilganDesc} / ${ON[m.saju.dom]} 기운\n`;
    if (m.sun) s += `별자리: ${m.sun.s} ${m.sun.n}\n`;
    return s;
  }).join('\n'), [members]);

  const askGroupAnalysis = () => startStream({
    userMessage: `우리 모임 ${members.length}명의 전체 별숨 흐름을 분석해주세요. 집단 분위기, 강점, 충돌이 생기기 쉬운 지점, 같이 움직이면 빛나는 순간을 팀 관점으로 설명해주세요.`,
    context: ctx,
    teamMode: true,
    isGroupAnalysis: true,
    isFullGroupAnalysis: true,
    isChat: true,
    clientHour: new Date().getHours(),
  });

  useEffect(() => {
    askGroupAnalysis();
    return resetStream;
  }, [ctx, members.length, resetStream]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(2px)' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 480, animation: 'fadeUp .3s ease', background: 'var(--bg1)', borderRadius: '24px 24px 0 0', maxHeight: '84vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,.4)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--line)' }} />
        </div>
        <div style={{ padding: '14px 20px 14px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 'var(--lg)', fontWeight: 700, background: 'linear-gradient(135deg, var(--t1) 0%, var(--gold) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 3 }}>
                우리 모임 전체 별숨
              </div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>{members.length}개의 별이 만드는 팀 흐름</div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg2)', border: '1px solid var(--line)', color: 'var(--t3)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '16px 20px 44px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
            {members.map((m, i) => {
              const elColor = m.saju?.dom ? OHAENG_COLOR[m.saju.dom] : 'var(--gold)';
              return (
                <div key={i} style={{ padding: '4px 12px', borderRadius: 20, background: m.saju?.dom ? `${OHAENG_COLOR[m.saju.dom]}14` : 'var(--goldf)', border: `1px solid ${elColor}30`, fontSize: 'var(--xs)', color: 'var(--t2)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {m.saju?.dom && <span style={{ color: elColor, fontSize: 10, fontWeight: 700 }}>{OHAENG_CHAR[m.saju.dom]}</span>}
                  {m.name}
                </div>
              );
            })}
          </div>

          {isStreaming && !streamText && !streamError ? (
            <FeatureLoadingScreen type="group" fullPage={false} />
          ) : (
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
              {stripMd(streamError || streamText || '분석을 불러오지 못했어요.')}
              {isStreaming && streamText && <span className="typing-cursor" aria-hidden="true" />}
            </div>
          )}
          {streamError && (
            <button onClick={askGroupAnalysis} style={{ marginTop: 16, fontSize: 'var(--xs)', color: 'var(--gold)', background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 20, padding: '8px 20px', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
              다시 불러오기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

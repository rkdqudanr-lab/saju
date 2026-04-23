import { useEffect, useMemo } from 'react';
import { ON } from '../../utils/saju.js';
import FeatureLoadingScreen from '../../components/FeatureLoadingScreen.jsx';
import { useStreamResponse } from '../../hooks/useStreamResponse.js';
import { REL_COLOR, REL_LABEL, getCompatTier, stripMd } from './groupUtils.js';

export default function DetailPanel({ pair, members, onClose }) {
  const { streamText, isStreaming, streamError, startStream, resetStream } = useStreamResponse();
  const a = members[pair.idxA];
  const b = members[pair.idxB];
  const ctx = useMemo(() => [a, b].map((m) => {
    let s = `[${m.name}]\n`;
    if (m.saju) s += `일주: ${m.saju.il.g}${m.saju.il.j} / 기질: ${m.saju.ilganDesc} / ${ON[m.saju.dom]} 기운\n`;
    if (m.sun) s += `별자리: ${m.sun.n}(${m.sun.s})\n`;
    return s;
  }).join('\n'), [a, b]);

  const askDetail = () => startStream({
    userMessage: `${a.name}과 ${b.name}의 별숨 관계를 깊이 분석해주세요. 좋은 점, 조심할 점, 같이 있을 때 어떤 흐름이 강해지는지 메신저에서 말하듯 자연스럽게 설명해주세요.`,
    context: ctx,
    teamMode: false,
    isChat: true,
    clientHour: new Date().getHours(),
  });

  useEffect(() => {
    askDetail();
    return resetStream;
  }, [ctx, pair.idxA, pair.idxB, resetStream]); // eslint-disable-line react-hooks/exhaustive-deps

  const tier = getCompatTier(pair.score);
  const typeColor = REL_COLOR[pair.type];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(2px)' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 480, animation: 'fadeUp .3s ease', background: 'var(--bg1)', borderRadius: '24px 24px 0 0', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,.4)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--line)' }} />
        </div>
        <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 'var(--lg)', fontWeight: 700, background: `linear-gradient(135deg, var(--t1), ${tier.color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 4 }}>
                {a.name} × {b.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '2px 10px', borderRadius: 20, background: `${typeColor}18`, border: `1px solid ${typeColor}44`, fontSize: 'var(--xs)', color: typeColor, fontWeight: 700 }}>
                  {REL_LABEL[pair.type]}
                </span>
                <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>공명 {pair.score}%</span>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg2)', border: '1px solid var(--line)', color: 'var(--t3)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '16px 20px 40px' }}>
          <div style={{ padding: '14px 16px', borderRadius: 'var(--r2)', background: `linear-gradient(135deg, ${tier.color}10, ${tier.color}06)`, border: `1px solid ${tier.color}30`, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: tier.color }}>{tier.emoji} {tier.label}</div>
              <div style={{ fontSize: 'var(--lg)', fontWeight: 700, color: tier.color }}>{pair.score}%</div>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pair.score}%`, background: `linear-gradient(90deg, ${tier.color}60, ${tier.color})`, borderRadius: 3, transition: 'width 1.4s cubic-bezier(.34,1.56,.64,1)', boxShadow: `0 0 8px ${tier.color}66` }} />
            </div>
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
            <button onClick={askDetail} style={{ marginTop: 16, fontSize: 'var(--xs)', color: 'var(--gold)', background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 20, padding: '8px 20px', fontFamily: 'var(--ff)', cursor: 'pointer' }}>
              다시 불러오기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

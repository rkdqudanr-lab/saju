import { useState, useMemo, useEffect, useRef } from "react";
import { getSaju, ON } from "../utils/saju.js";
import { getSun } from "../utils/astrology.js";
import { supabase } from "../lib/supabase.js";
import { getAuthToken } from "../hooks/useUserProfile.js";

function getDaysInMonth(year, month) {
  if (!month) return 31;
  if (!year || String(year).length < 4) return 31;
  return new Date(parseInt(year), parseInt(month), 0).getDate();
}

// 오행 상생(相生) / 상극(相克) 관계 (로컬 정의)
const SANGSAENG = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
const SANGGEUK  = { 목: '토', 화: '금', 토: '수', 금: '목', 수: '화' };

// ═══════════════════════════════════════════════════════════
//  🌐 우리 모임의 별숨은? — 그룹 궁합 & 관계도
// ═══════════════════════════════════════════════════════════

// 6자리 초대 코드 생성
function genInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// 두 사람 궁합 점수 계산 (RadarChart 로직 참고)
function pairScore(sajuA, sajuB) {
  if (!sajuA || !sajuB) return 50;
  const domA = sajuA.dom, domB = sajuB.dom;
  let score = 50;
  if (SANGSAENG[domA] === domB || SANGSAENG[domB] === domA) score += 15;
  else if (SANGGEUK[domA] === domB || SANGGEUK[domB] === domA) score -= 15;
  if (domA === domB) score += 5;
  // 일지 삼합 체크
  const JJI_ORDER = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
  const idxA = JJI_ORDER.indexOf(sajuA.il?.j);
  const idxB = JJI_ORDER.indexOf(sajuB.il?.j);
  if (idxA !== -1 && idxB !== -1) {
    const diff = Math.abs(idxA - idxB);
    if (diff === 4 || diff === 8) score += 10;
  }
  return Math.max(20, Math.min(95, score));
}

// 점수에 따른 관계 타입
function relType(score) {
  if (score >= 70) return 'good';   // 좋은 별숨
  if (score >= 50) return 'caution'; // 주의 별숨
  return 'bad';                     // 나쁜 별숨
}

// 일간 기반 역할
function roleOf(saju) {
  if (!saju) return '별님';
  const roles = {
    목: '창의적인 리더', 화: '열정적인 추진자', 토: '든든한 조율자',
    금: '분석적인 전략가', 수: '공감 능력자',
  };
  return roles[saju.dom] || '별님';
}

// 관계도 SVG 노드 위치 계산 (원형 배치)
function calcNodePositions(count, cx, cy, r) {
  if (count === 1) return [{ x: cx, y: cy }];
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i / count) - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

const REL_COLOR = { good: '#B4963C', caution: '#C47A48', bad: '#9B4EC4' };
const REL_LABEL = { good: '좋은 별숨', caution: '주의 별숨', bad: '나쁜 별숨' };

function getCompatTier(score) {
  if (score >= 90) return { label: '환상의 티키타카', emoji: '✨', color: '#E8B048' };
  if (score >= 75) return { label: '천생연분에 가까운 두 별', emoji: '💫', color: '#B4963C' };
  if (score >= 60) return { label: '서로를 성장시키는 빛나는 인연', emoji: '🌱', color: '#5FAD7A' };
  if (score >= 45) return { label: '창과 방패 — 서로를 단단하게', emoji: '🛡️', color: '#7B9EC4' };
  if (score >= 30) return { label: '서로가 서로의 브레이크', emoji: '⚖️', color: '#C47A48' };
  return { label: '도전적이지만 성장하는 관계', emoji: '🔥', color: '#9B4EC4' };
}

// ── 오행 분포 시각화 ──
const OHAENG_COLOR = { 목: '#5FAD7A', 화: '#E06040', 토: '#C4A040', 금: '#A09EC4', 수: '#4A90D9' };
const OHAENG_CHAR  = { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' };

function OhaengBar({ members }) {
  const total = members.length;
  if (!total) return null;
  const counts = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  members.forEach(m => { if (m.saju?.dom && counts[m.saju.dom] !== undefined) counts[m.saju.dom]++; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0];
  return (
    <div style={{
      marginBottom: 16,
      background: 'var(--bg2)', borderRadius: 'var(--r2)',
      border: '1px solid var(--line)', padding: '16px 16px 14px',
    }}>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 14, letterSpacing: '.05em' }}>
        ✦ 우리 모임의 오행 기운
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 72 }}>
        {Object.entries(counts).map(([el, cnt]) => {
          const pct = total ? (cnt / total) : 0;
          const color = OHAENG_COLOR[el];
          const barH = Math.max(4, pct * 52);
          const isDom = cnt > 0 && cnt === dominant[1];
          return (
            <div key={el} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                fontSize: 'var(--xs)', fontWeight: 700,
                color: cnt > 0 ? 'var(--t1)' : 'var(--t4)',
                opacity: cnt > 0 ? 1 : 0.4,
              }}>{cnt}</div>
              <div style={{ width: '100%', height: barH, borderRadius: '4px 4px 0 0', position: 'relative', overflow: 'visible',
                background: cnt > 0 ? color : 'var(--bg3)',
                opacity: cnt > 0 ? 1 : 0.3,
                transition: 'height 0.7s cubic-bezier(.34,1.56,.64,1)',
                boxShadow: isDom ? `0 0 12px ${color}66, 0 0 4px ${color}44` : 'none',
              }} />
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: cnt > 0 ? color : 'var(--t4)',
                opacity: cnt > 0 ? 1 : 0.4,
                textShadow: isDom ? `0 0 8px ${color}88` : 'none',
              }}>
                {OHAENG_CHAR[el]}
              </div>
            </div>
          );
        })}
      </div>
      {dominant[1] > 0 && (
        <div style={{
          marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)',
          fontSize: 'var(--xs)', color: 'var(--t3)', textAlign: 'center', lineHeight: 1.6,
        }}>
          이 모임은{' '}
          <span style={{ color: OHAENG_COLOR[dominant[0]], fontWeight: 700, textShadow: `0 0 8px ${OHAENG_COLOR[dominant[0]]}66` }}>
            {OHAENG_CHAR[dominant[0]]} {dominant[0]} 기운
          </span>
          {' '}이 강해요
          {sorted[1]?.[1] > 0 && sorted[1][0] !== dominant[0] && (
            <span style={{ color: 'var(--t4)' }}>
              {' · '}
              <span style={{ color: OHAENG_COLOR[sorted[1][0]] }}>{OHAENG_CHAR[sorted[1][0]]}</span> 기운도 함께해요
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── 입력 폼 컴포넌트 ──
function MemberForm({ onSubmit, title }) {
  const [form, setForm] = useState({ name: '', by: '', bm: '', bd: '', bh: '', gender: '' });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const ok = form.name && form.by && form.bm && form.bd && form.gender;
  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 16 }}>{title}</div>
      <input className="inp" placeholder="이름" value={form.name} onChange={e => upd('name', e.target.value)} />
      <div className="row" style={{ gap: 6, marginBottom: 'var(--sp2)' }}>
        <input className="inp" placeholder="출생년도" inputMode="numeric"
          value={form.by} onChange={e => upd('by', e.target.value.replace(/\D/g, '').slice(0, 4))}
          style={{ marginBottom: 0 }} />
        <select className="inp" value={form.bm} onChange={e => { const nm = e.target.value; const max = getDaysInMonth(form.by, nm); setForm(p => ({ ...p, bm: nm, bd: p.bd && parseInt(p.bd) > max ? '' : p.bd })); }} style={{ marginBottom: 0 }}>
          <option value="">월</option>{[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}월</option>)}
        </select>
        <select className="inp" value={form.bd} onChange={e => upd('bd', e.target.value)} style={{ marginBottom: 0 }}>
          <option value="">일</option>{[...Array(getDaysInMonth(form.by, form.bm))].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}일</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 'var(--sp2)' }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 6 }}>태어난 시간 (모르면 건너뛰어요)</div>
        <select className="inp" value={form.bh} onChange={e => upd('bh', e.target.value)} style={{ marginBottom: 0 }}>
          <option value="">모름</option>
          {['자시(23-1시)','축시(1-3시)','인시(3-5시)','묘시(5-7시)','진시(7-9시)','사시(9-11시)',
            '오시(11-13시)','미시(13-15시)','신시(15-17시)','유시(17-19시)','술시(19-21시)','해시(21-23시)']
            .map((h, i) => <option key={i} value={i * 2 + 0}>{h}</option>)}
        </select>
      </div>
      <div className="gender-group" style={{ marginBottom: 'var(--sp2)' }}>
        {['여성', '남성', '기타'].map(g => (
          <button key={g} className={`gbtn ${form.gender === g ? 'on' : ''}`}
            onClick={() => upd('gender', g)}>{g}</button>
        ))}
      </div>
      <button className="btn-main" disabled={!ok} onClick={() => onSubmit(form)}>
        모임에 참여하기 ✦
      </button>
    </div>
  );
}

// ── 관계도 SVG ──
function RelationGraph({ members, pairs, selectedNode, onNodeClick }) {
  const W = 320, H = 300, cx = 160, cy = 150, r = 100;
  const positions = calcNodePositions(members.length, cx, cy, members.length === 1 ? 0 : r);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', maxWidth: 360, margin: '0 auto' }}>
      {/* 엣지 */}
      {pairs.map((pair, i) => {
        const posA = positions[pair.idxA];
        const posB = positions[pair.idxB];
        if (!posA || !posB) return null;
        const isHighlighted = selectedNode === null || pair.idxA === selectedNode || pair.idxB === selectedNode;
        const color = REL_COLOR[pair.type];
        const strokeWidth = pair.score >= 70 ? 2.5 : pair.score >= 50 ? 1.5 : 1;
        return (
          <line key={i}
            x1={posA.x} y1={posA.y} x2={posB.x} y2={posB.y}
            stroke={color} strokeWidth={strokeWidth}
            strokeOpacity={isHighlighted ? 0.75 : 0.12}
            strokeDasharray={pair.type === 'bad' ? '4 3' : undefined}
            style={{ transition: 'stroke-opacity 0.25s' }}
          />
        );
      })}
      {/* 노드 */}
      {members.map((m, i) => {
        const pos = positions[i];
        if (!pos) return null;
        const isSelected = selectedNode === i;
        const isDimmed = selectedNode !== null && !isSelected;
        return (
          <g key={i} style={{ cursor: 'pointer' }} onClick={() => onNodeClick(i)}>
            <circle cx={pos.x} cy={pos.y} r={28}
              fill="transparent" />
            <circle cx={pos.x} cy={pos.y} r={26}
              fill="var(--bg2)"
              stroke={isSelected ? '#E8B048' : 'var(--gold)'}
              strokeWidth={isSelected ? 2.5 : 1.5}
              opacity={isDimmed ? 0.35 : 1}
              style={{ transition: 'opacity 0.25s, stroke 0.25s' }}
            />
            <circle cx={pos.x} cy={pos.y} r={24}
              fill={isSelected ? 'rgba(232,176,72,0.12)' : 'rgba(180,140,50,0.06)'}
              style={{ transition: 'fill 0.25s' }}
            />
            <text x={pos.x} y={pos.y - 4} textAnchor="middle"
              fill={isDimmed ? 'var(--t4)' : 'var(--t1)'} fontSize={11} fontWeight={700} fontFamily="var(--ff)"
              style={{ transition: 'fill 0.25s' }}>
              {m.name.slice(0, 3)}
            </text>
            <text x={pos.x} y={pos.y + 10} textAnchor="middle"
              fill={isDimmed ? 'var(--t5)' : 'var(--gold)'} fontSize={9} fontFamily="var(--ff)"
              style={{ transition: 'fill 0.25s' }}>
              {m.saju ? ON[m.saju.dom] : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function stripMd(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^[-─━]+$/gm, '');
}

// ── 상세 분석 패널 ──
function DetailPanel({ pair, members, onClose, user }) {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const abortRef = useRef(null);

  const askDetail = async () => {
    // 이전 요청 취소
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setHasError(false);
    setResult('');
    try {
      const a = members[pair.idxA], b = members[pair.idxB];
      const ctx = [a, b].map(m => {
        let s = `[${m.name}]\n`;
        if (m.saju) s += `일주: ${m.saju.il.g}${m.saju.il.j} / 기질: ${m.saju.ilganDesc} / ${ON[m.saju.dom]} 기운\n`;
        if (m.sun) s += `별자리: ${m.sun.n}(${m.sun.s})\n`;
        return s;
      }).join('\n');
      const _token = getAuthToken();
      const _headers = { 'Content-Type': 'application/json' };
      if (_token) _headers['Authorization'] = `Bearer ${_token}`;
      const res = await fetch('/api/ask', {
        method: 'POST',
        signal: controller.signal,
        headers: _headers,
        body: JSON.stringify({
          userMessage: `${a.name}과 ${b.name}의 별숨 관계를 깊이 분석해주세요. 좋은 점, 나쁜 점, 서로 주의해야 할 점, 함께할 때의 케미를 별숨의 언어로 이야기해주세요.`,
          context: ctx,
          teamMode: true,
          isChat: true,
          kakaoId: user?.id || null,
          clientHour: new Date().getHours(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'api error');
      setResult(data.text || '분석을 불러오지 못했어요.');
    } catch (e) {
      if (e?.name === 'AbortError') return; // 언마운트 취소 — 상태 업데이트 생략
      setHasError(true);
      setResult('별이 잠시 쉬고 있어요.\n잠시 후 다시 시도해봐요.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    askDetail();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const a = members[pair.idxA], b = members[pair.idxB];
  const tier = getCompatTier(pair.score);
  const typeColor = REL_COLOR[pair.type];
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
      zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      backdropFilter: 'blur(2px)',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 480, animation: 'fadeUp .3s ease',
        background: 'var(--bg1)', borderRadius: '24px 24px 0 0',
        maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 -8px 40px rgba(0,0,0,.4)',
      }} onClick={e => e.stopPropagation()}>
        {/* 핸들 바 */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--line)' }} />
        </div>
        {/* 그라디언트 헤더 */}
        <div style={{
          padding: '16px 20px 14px',
          borderBottom: '1px solid var(--line)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{
                fontSize: 'var(--lg)', fontWeight: 700,
                background: `linear-gradient(135deg, var(--t1), ${tier.color})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                marginBottom: 4,
              }}>
                {a.name} × {b.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '2px 10px', borderRadius: 20,
                  background: `${typeColor}18`, border: `1px solid ${typeColor}44`,
                  fontSize: 'var(--xs)', color: typeColor, fontWeight: 700,
                }}>
                  {REL_LABEL[pair.type]}
                </span>
                <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>공명 {pair.score}%</span>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg2)', border: '1px solid var(--line)',
              color: 'var(--t3)', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '16px 20px 40px' }}>
          {/* 궁합 티어 카드 */}
          <div style={{
            padding: '14px 16px', borderRadius: 'var(--r2)',
            background: `linear-gradient(135deg, ${tier.color}10, ${tier.color}06)`,
            border: `1px solid ${tier.color}30`,
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: tier.color }}>
                {tier.emoji} {tier.label}
              </div>
              <div style={{ fontSize: 'var(--lg)', fontWeight: 700, color: tier.color }}>
                {pair.score}%
              </div>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pair.score}%`,
                background: `linear-gradient(90deg, ${tier.color}60, ${tier.color})`,
                borderRadius: 3, transition: 'width 1.4s cubic-bezier(.34,1.56,.64,1)',
                boxShadow: `0 0 8px ${tier.color}66`,
              }} />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 0', gap: 16 }}>
              <div style={{ display: 'flex', gap: 7 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', animation: `orbPulse 1.4s ease-in-out ${i * 0.25}s infinite` }} />
                ))}
              </div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>별빛으로 읽는 중...</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
                {stripMd(result)}
              </div>
              {hasError && (
                <button onClick={askDetail} style={{
                  marginTop: 16, fontSize: 'var(--xs)', color: 'var(--gold)',
                  background: 'var(--goldf)', border: '1px solid var(--acc)',
                  borderRadius: 20, padding: '8px 20px', fontFamily: 'var(--ff)', cursor: 'pointer',
                }}>
                  ↺ 다시 불러오기
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 모임 전체 분석 패널 ──
function GroupAnalysisPanel({ members, onClose, user }) {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const abortRef = useRef(null);

  const askGroupAnalysis = async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setHasError(false);
    setResult('');
    try {
      const ctx = members.map(m => {
        let s = `[${m.name}]\n`;
        if (m.saju) s += `일주: ${m.saju.il.g}${m.saju.il.j} / 기질: ${m.saju.ilganDesc} / ${ON[m.saju.dom]} 기운\n`;
        if (m.sun) s += `별자리: ${m.sun.s} ${m.sun.n}\n`;
        return s;
      }).join('\n');
      const _token = getAuthToken();
      const _headers = { 'Content-Type': 'application/json' };
      if (_token) _headers['Authorization'] = `Bearer ${_token}`;
      const res = await fetch('/api/ask', {
        method: 'POST',
        signal: controller.signal,
        headers: _headers,
        body: JSON.stringify({
          userMessage: `우리 모임 ${members.length}명의 전체 별숨 에너지를 분석해주세요. 이 팀의 집단 기운, 강점, 약점, 주의해야 할 점, 함께할 때 가장 빛나는 순간을 별숨의 언어로 이야기해주세요.`,
          context: ctx,
          isGroupAnalysis: true,
          isChat: true,
          kakaoId: user?.id || null,
          clientHour: new Date().getHours(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'api error');
      setResult(data.text || '분석을 불러오지 못했어요.');
    } catch (e) {
      if (e?.name === 'AbortError') return;
      setHasError(true);
      setResult('별이 잠시 쉬고 있어요.\n잠시 후 다시 시도해봐요.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    askGroupAnalysis();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
      zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      backdropFilter: 'blur(2px)',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 480, animation: 'fadeUp .3s ease',
        background: 'var(--bg1)', borderRadius: '24px 24px 0 0',
        maxHeight: '84vh', overflowY: 'auto',
        boxShadow: '0 -8px 40px rgba(0,0,0,.4)',
      }} onClick={e => e.stopPropagation()}>
        {/* 핸들 바 */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--line)' }} />
        </div>
        {/* 헤더 */}
        <div style={{ padding: '14px 20px 14px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{
                fontSize: 'var(--lg)', fontWeight: 700,
                background: 'linear-gradient(135deg, var(--t1) 0%, var(--gold) 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                marginBottom: 3,
              }}>
                우리 모임 전체 별숨
              </div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
                {members.length}개의 별이 만드는 에너지
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg2)', border: '1px solid var(--line)',
              color: 'var(--t3)', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '16px 20px 44px' }}>
          {/* 멤버 칩들 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
            {members.map((m, i) => {
              const elColor = m.saju?.dom ? OHAENG_COLOR[m.saju.dom] : 'var(--gold)';
              return (
                <div key={i} style={{
                  padding: '4px 12px', borderRadius: 20,
                  background: m.saju?.dom ? `${OHAENG_COLOR[m.saju.dom]}14` : 'var(--goldf)',
                  border: `1px solid ${elColor}30`,
                  fontSize: 'var(--xs)', color: 'var(--t2)', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {m.saju?.dom && (
                    <span style={{ color: elColor, fontSize: 10, fontWeight: 700 }}>{OHAENG_CHAR[m.saju.dom]}</span>
                  )}
                  {m.name}
                </div>
              );
            })}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 16 }}>
              <div style={{ display: 'flex', gap: 7 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', animation: `orbPulse 1.4s ease-in-out ${i * 0.25}s infinite` }} />
                ))}
              </div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>{members.length}개의 별빛을 읽는 중...</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
                {stripMd(result)}
              </div>
              {hasError && (
                <button onClick={askGroupAnalysis} style={{
                  marginTop: 16, fontSize: 'var(--xs)', color: 'var(--gold)',
                  background: 'var(--goldf)', border: '1px solid var(--acc)',
                  borderRadius: 20, padding: '8px 20px', fontFamily: 'var(--ff)', cursor: 'pointer',
                }}>
                  ↺ 다시 불러오기
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  메인 컴포넌트
// ─────────────────────────────────────────────────────────
// localStorage 백업 키
function getGroupLocalKey(code) { return `byeolsoom_group_${code}`; }

export default function GroupBulseumPage({ form, saju, sun, setStep, initialCode, user }) {
  const [phase, setPhase] = useState('landing'); // landing | join | members | graph
  const [sessionId, setSessionId] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [codeInput, setCodeInput] = useState(initialCode || '');
  const [linkCopied, setLinkCopied] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedPair, setSelectedPair] = useState(null);
  const [codeError, setCodeError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [groupAnalysisOpen, setGroupAnalysisOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // 멤버 사주/별자리 계산
  const enrichedMembers = useMemo(() => members.map(m => {
    try {
      // birth_hour=0(자시/자정)은 유효한 시간값이므로 null 체크로 처리
      const s = getSaju(+m.birth_year, +m.birth_month, +m.birth_day, m.birth_hour != null ? +m.birth_hour : 12);
      const sun = getSun(+m.birth_month, +m.birth_day);
      return { ...m, saju: s, sun };
    } catch { return { ...m, saju: null, sun: null }; }
  }), [members]);

  // 모든 페어 궁합 계산
  const pairs = useMemo(() => {
    const result = [];
    for (let i = 0; i < enrichedMembers.length; i++) {
      for (let j = i + 1; j < enrichedMembers.length; j++) {
        const score = pairScore(enrichedMembers[i].saju, enrichedMembers[j].saju);
        result.push({ idxA: i, idxB: j, score, type: relType(score) });
      }
    }
    return result;
  }, [enrichedMembers]);

  // localStorage에 멤버 목록 백업
  const saveLocalMembers = (code, memberList) => {
    try { localStorage.setItem(getGroupLocalKey(code), JSON.stringify(memberList)); } catch {}
  };

  // 새 모임 만들기
  const createGroup = async () => {
    setCreateLoading(true);
    setCodeError('');
    setSaveError('');
    const code = genInviteCode();
    try {
      if (supabase) {
        const { data, error } = await supabase.from('group_sessions').insert({ invite_code: code }).select().single();
        if (error) throw error;
        setSessionId(data.id);
      } else {
        setSessionId('local_' + Date.now());
      }
      setInviteCode(code);
      setPhase('join');
    } catch (e) {
      // Supabase 실패 시 로컬 모드로 진행
      console.error('[GroupBulseum] 모임 생성 오류:', e);
      setSessionId('local_' + Date.now());
      setInviteCode(code);
      setPhase('join');
      setSaveError('서버 저장에 실패했어요. 이 기기에서만 유효한 모임으로 진행돼요.');
    } finally {
      setCreateLoading(false);
    }
  };

  // 코드로 모임 참여
  const joinGroup = async () => {
    if (!codeInput.trim()) return;
    setCodeError('');
    setSaveError('');
    const code = codeInput.trim().toUpperCase();
    try {
      if (supabase) {
        const { data, error } = await supabase.from('group_sessions').select('id').eq('invite_code', code).maybeSingle();
        if (error || !data) {
          // 서버에 없으면 로컬 백업 확인
          const localData = localStorage.getItem(getGroupLocalKey(code));
          if (localData) {
            try {
              const localMembers = JSON.parse(localData);
              setMembers(localMembers);
              setSessionId('local_' + code);
              setInviteCode(code);
              setPhase('join');
              return;
            } catch {}
          }
          setCodeError('코드를 찾을 수 없어요. 다시 확인해봐요.');
          return;
        }
        setSessionId(data.id);
        setInviteCode(code);
        // 기존 멤버 불러오기
        const { data: existingMembers } = await supabase.from('group_members').select('*').eq('session_id', data.id);
        if (existingMembers?.length) setMembers(existingMembers);
      } else {
        // 로컬 백업에서 복원 시도
        const localData = localStorage.getItem(getGroupLocalKey(code));
        if (localData) {
          try { setMembers(JSON.parse(localData)); } catch {}
        }
        setSessionId('local_' + code);
        setInviteCode(code);
      }
      setPhase('join');
    } catch {
      setCodeError('코드 확인 중 오류가 발생했어요.');
    }
  };

  // 멤버 추가
  const addMember = async (memberForm) => {
    setSaveError('');
    const newMember = {
      name: memberForm.name,
      birth_year: +memberForm.by,
      birth_month: +memberForm.bm,
      birth_day: +memberForm.bd,
      birth_hour: memberForm.bh ? +memberForm.bh : null,
      gender: memberForm.gender,
      kakao_id: user?.id ? String(user.id) : null,
    };
    try {
      if (supabase && sessionId && !sessionId.startsWith('local_')) {
        const { error } = await supabase.from('group_members').insert({ ...newMember, session_id: sessionId });
        if (error) throw error;
      }
    } catch (e) {
      console.error('[GroupBulseum] 멤버 저장 오류:', e?.message);
      setSaveError('서버에 저장하지 못했어요. 기기 내에 임시 저장됩니다.');
    }
    const updatedMembers = [...members, newMember];
    setMembers(updatedMembers);
    // 항상 로컬에도 백업
    if (inviteCode) saveLocalMembers(inviteCode, updatedMembers);
    setPhase('members');
  };

  // 멤버 삭제
  const removeMember = async (idx) => {
    const m = members[idx];
    const updatedMembers = members.filter((_, i) => i !== idx);
    setMembers(updatedMembers);
    if (inviteCode) saveLocalMembers(inviteCode, updatedMembers);
    try {
      if (supabase && sessionId && !sessionId.startsWith('local_') && m.id) {
        await supabase.from('group_members').delete().eq('id', m.id);
      }
    } catch (e) {
      console.error('[GroupBulseum] 멤버 삭제 오류:', e?.message);
    }
  };

  // 관계도 분류
  const goodPairs = pairs.filter(p => p.type === 'good');
  const cautionPairs = pairs.filter(p => p.type === 'caution');
  const badPairs = pairs.filter(p => p.type === 'bad');

  // ── 랜딩 화면 ──
  if (phase === 'landing') {
    return (
      <div className="page">
        <div className="inner">
          <div style={{ paddingTop: 8 }}>

            {/* 히어로 섹션 */}
            <div style={{ textAlign: 'center', marginBottom: 36, animation: 'fadeUp .5s ease' }}>
              {/* 오브 장식 */}
              <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 22px' }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'radial-gradient(circle at 38% 32%, rgba(232,176,72,.5), rgba(155,142,196,.25), transparent)',
                  animation: 'orbPulse 4s ease-in-out infinite',
                }} />
                <div style={{
                  position: 'absolute', inset: -8, borderRadius: '50%',
                  border: '1px solid rgba(232,176,72,.22)',
                  animation: 'orbSpin 14s linear infinite',
                }}>
                  <div style={{
                    position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)',
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--gold)', boxShadow: '0 0 10px var(--gold), 0 0 20px rgba(232,176,72,.4)',
                  }} />
                </div>
                <div style={{
                  position: 'absolute', inset: -22, borderRadius: '50%',
                  border: '1px solid rgba(232,176,72,.07)',
                  animation: 'orbSpin 24s linear infinite reverse',
                }}>
                  <div style={{
                    position: 'absolute', bottom: -2, right: '22%',
                    width: 4, height: 4, borderRadius: '50%',
                    background: 'rgba(155,142,196,.8)', boxShadow: '0 0 7px rgba(155,142,196,.5)',
                  }} />
                </div>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 30,
                }}>🌐</div>
              </div>

              <div style={{
                fontSize: 'var(--xl)', fontWeight: 700, lineHeight: 1.25, marginBottom: 12,
                background: 'linear-gradient(135deg, var(--t1) 10%, var(--gold) 60%, #C89030 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                우리 모임의<br />별숨은?
              </div>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', lineHeight: 1.9 }}>
                초대 코드 하나로 모임을 만들고<br />
                사주와 별자리로 서로의 궁합을 읽어봐요
              </div>
            </div>

            {/* 새 모임 만들기 */}
            <button
              className="btn-main"
              onClick={createGroup}
              disabled={createLoading}
              style={{ marginTop: 0, marginBottom: 12 }}
            >
              {createLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: '#0D0B14', display: 'inline-block',
                      animation: `orbPulse 1.2s ease-in-out ${i * 0.25}s infinite`,
                    }} />
                  ))}
                </span>
              ) : '✦ 새 모임 만들기'}
            </button>

            {/* 구분선 */}
            <div style={{ position: 'relative', margin: '20px 0', textAlign: 'center' }}>
              <div style={{ height: 1, background: 'var(--line)', position: 'absolute', top: '50%', width: '100%' }} />
              <span style={{
                background: 'var(--bg1)', padding: '0 14px', position: 'relative',
                fontSize: 'var(--xs)', color: 'var(--t4)', letterSpacing: '.08em',
              }}>또는 코드로 참여</span>
            </div>

            {/* 코드 입력 */}
            <div style={{ marginBottom: 8 }}>
              <input
                className="inp"
                placeholder="A B C 1 2 3"
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value.toUpperCase().slice(0, 6)); setCodeError(''); }}
                style={{
                  letterSpacing: 10, textAlign: 'center', fontWeight: 700,
                  fontSize: 'var(--lg)', marginBottom: 10,
                  boxShadow: codeInput.length === 6 ? '0 0 0 3px rgba(232,176,72,.12), inset 0 0 0 1px var(--gold)' : 'none',
                  transition: 'box-shadow .2s',
                }}
                maxLength={6}
              />
              <button className="btn-main" onClick={joinGroup} disabled={codeInput.length !== 6} style={{ marginTop: 0 }}>
                모임 참여하기
              </button>
            </div>
            {codeError && (
              <div style={{ fontSize: 'var(--xs)', color: 'var(--rose)', marginBottom: 8, textAlign: 'center', animation: 'fadeUp .2s ease' }}>
                {codeError}
              </div>
            )}

            {/* 안내 */}
            <div style={{
              marginTop: 24, padding: '16px 18px', background: 'var(--bg2)',
              borderRadius: 'var(--r2)', border: '1px solid var(--line)',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {[
                ['✦', '로그인 없이도 참여할 수 있어요'],
                ['☽', '이름과 생년월일만 입력하면 돼요'],
                ['◈', '초대 링크로 친구를 바로 불러봐요'],
              ].map(([ic, txt]) => (
                <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 'var(--xs)', color: 'var(--t3)' }}>
                  <span style={{ color: 'var(--gold)', width: 14, textAlign: 'center', flexShrink: 0, fontSize: 10 }}>{ic}</span>
                  {txt}
                </div>
              ))}
            </div>

            <button className="res-btn" style={{ width: '100%', marginTop: 16 }} onClick={() => setStep(0)}>
              ← 홈으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 참여 화면 ──
  if (phase === 'join') {
    return (
      <div className="page">
        <div className="inner">
          <div style={{ paddingTop: 16 }}>

            {/* 초대 코드 프리미엄 카드 */}
            <div style={{
              textAlign: 'center', marginBottom: 20,
              padding: '20px 16px',
              background: 'linear-gradient(145deg, rgba(232,176,72,.1), rgba(232,176,72,.04))',
              borderRadius: 'var(--r2)', border: '1px solid rgba(232,176,72,.25)',
              boxShadow: '0 4px 24px rgba(232,176,72,.08), inset 0 1px 0 rgba(232,176,72,.1)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* 배경 장식 */}
              <div style={{
                position: 'absolute', top: -30, right: -30, width: 100, height: 100,
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,176,72,.06), transparent)',
                pointerEvents: 'none',
              }} />
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', letterSpacing: '.1em', marginBottom: 8 }}>초대 코드</div>
              <div style={{
                fontSize: 34, fontWeight: 700, letterSpacing: 14, marginBottom: 8,
                background: 'linear-gradient(135deg, var(--gold), #C89030)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                textShadow: 'none',
              }}>
                {inviteCode}
              </div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 14 }}>
                현재{' '}
                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{members.length}명</span>
                {' '}참여 중
              </div>
              <button
                onClick={() => {
                  const link = `${window.location.origin}?group=${inviteCode}`;
                  navigator.clipboard.writeText(link).then(() => {
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  });
                }}
                style={{
                  background: linkCopied ? 'rgba(232,176,72,.25)' : 'var(--bg1)',
                  border: `1px solid ${linkCopied ? 'var(--gold)' : 'rgba(232,176,72,.3)'}`,
                  borderRadius: 20, padding: '7px 20px',
                  color: 'var(--gold)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)',
                  cursor: 'pointer', fontWeight: 700, transition: 'all .2s',
                  letterSpacing: '.02em',
                }}
              >
                {linkCopied ? '✓ 복사됨!' : '🔗 초대 링크 복사'}
              </button>
            </div>

            <MemberForm
              title="내 정보 입력하기"
              onSubmit={addMember}
            />

            {saveError && (
              <div style={{
                fontSize: 'var(--xs)', color: 'var(--rose)',
                background: 'var(--rosef)', border: '1px solid var(--roseacc)',
                borderRadius: 'var(--r1)', padding: '10px 14px', marginTop: 8, lineHeight: 1.6,
              }}>
                ⚠️ {saveError}
              </div>
            )}

            {members.length > 0 && (
              <button
                className="res-btn"
                style={{ width: '100%', marginTop: 12 }}
                onClick={() => setPhase('members')}
              >
                참여 멤버 보기 ({members.length}명) →
              </button>
            )}

            <button className="res-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setPhase('landing')}>
              ← 뒤로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 멤버 목록 화면 ──
  if (phase === 'members') {
    return (
      <div className="page">
        <div className="inner">
          <div style={{ paddingTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: 'var(--t1)', fontSize: 'var(--md)' }}>
                우리 모임 ({members.length}명)
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => setTeamMode(!teamMode)} style={{
                  padding: '4px 10px', background: teamMode ? 'var(--acc)' : 'var(--bg2)',
                  border: `1px solid ${teamMode ? 'var(--acc)' : 'var(--line)'}`,
                  borderRadius: 20, fontSize: 'var(--xs)', fontWeight: 700, color: teamMode ? '#fff' : 'var(--t3)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  {teamMode ? '👥 팀 모드' : '두 명'}
                </button>
                <div style={{
                  fontSize: 'var(--xs)', color: 'var(--gold)',
                  padding: '4px 10px', background: 'var(--goldf)',
                  borderRadius: 20, fontWeight: 700, letterSpacing: 2,
                }}>{inviteCode}</div>
              </div>
            </div>

            {/* 멤버 카드 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {enrichedMembers.map((m, i) => {
                const elColor = m.saju?.dom ? OHAENG_COLOR[m.saju.dom] : 'var(--gold)';
                const elChar  = m.saju?.dom ? OHAENG_CHAR[m.saju.dom] : '✦';
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'var(--bg2)', borderRadius: 'var(--r2)',
                    border: '1px solid var(--line)',
                    padding: '10px 12px 10px 0',
                    overflow: 'hidden', position: 'relative',
                    animation: `fadeUp .3s ease ${i * 0.05}s both`,
                  }}>
                    {/* 왼쪽 오행 액센트 바 */}
                    <div style={{
                      width: 4, alignSelf: 'stretch', flexShrink: 0,
                      background: elColor,
                      borderRadius: '0 2px 2px 0',
                      boxShadow: `0 0 8px ${elColor}66`,
                      marginRight: 4,
                    }} />
                    {/* 아바타 */}
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      background: `${elColor}18`,
                      border: `1.5px solid ${elColor}44`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 0,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.1 }}>
                        {m.name.slice(0, 1)}
                      </div>
                      <div style={{ fontSize: 9, color: elColor, fontWeight: 700, lineHeight: 1 }}>
                        {elChar}
                      </div>
                    </div>
                    {/* 정보 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 2, fontSize: 'var(--sm)' }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.sun && <span>{m.sun.s} {m.sun.n}</span>}
                        {m.sun && m.saju && <span style={{ margin: '0 4px', color: 'var(--line)' }}>·</span>}
                        {m.saju && <span style={{ color: elColor }}>{roleOf(m.saju)}</span>}
                      </div>
                    </div>
                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => removeMember(i)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--t4)',
                        cursor: 'pointer', fontSize: 13, padding: '6px 8px',
                        borderRadius: 6, flexShrink: 0, transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--rose)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--t4)'}
                      title={`${m.name} 삭제`}
                    >✕</button>
                  </div>
                );
              })}
            </div>

            {saveError && (
              <div style={{
                fontSize: 'var(--xs)', color: 'var(--rose)',
                background: 'var(--rosef)', border: '1px solid var(--roseacc)',
                borderRadius: 'var(--r1)', padding: '10px 14px', marginBottom: 12, lineHeight: 1.6,
              }}>
                ⚠️ {saveError}
              </div>
            )}

            <button
              className="btn-main"
              disabled={members.length < 2}
              onClick={() => setPhase('graph')}
              style={{ marginBottom: 8 }}
            >
              {members.length >= 2
                ? `✦ 별숨 관계도 보기 · ${pairs.length}쌍`
                : '2명 이상 있어야 관계도를 볼 수 있어요'}
            </button>

            <button
              className="res-btn"
              style={{ width: '100%', marginBottom: 8 }}
              onClick={() => { setSaveError(''); setPhase('join'); }}
            >
              + 멤버 추가하기
            </button>

            <button className="res-btn" style={{ width: '100%' }} onClick={() => setPhase('landing')}>
              ← 처음으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 관계도 화면 ──
  if (phase === 'graph') {
    return (
      <div className="page">
        <div className="inner">
          <div style={{ paddingTop: 12 }}>

            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 10 }}>
              <div>
                <div style={{
                  fontSize: 'var(--md)', fontWeight: 700, marginBottom: 3,
                  background: 'linear-gradient(135deg, var(--t1), var(--gold))',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  별숨 관계도
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 'var(--xs)', color: 'var(--t4)',
                    padding: '2px 8px', background: 'var(--bg2)',
                    borderRadius: 20, border: '1px solid var(--line)',
                  }}>
                    {members.length}명 · {pairs.length}쌍
                  </span>
                  {selectedNode !== null && (
                    <span style={{
                      fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700,
                      padding: '2px 8px', background: 'var(--goldf)',
                      borderRadius: 20, border: '1px solid var(--acc)',
                    }}>
                      {enrichedMembers[selectedNode]?.name} ×
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setGroupAnalysisOpen(true)}
                style={{
                  padding: '8px 14px', flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(232,176,72,.18), rgba(232,176,72,.08))',
                  border: '1px solid rgba(232,176,72,.35)', borderRadius: 20,
                  fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--gold)',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  boxShadow: '0 2px 10px rgba(232,176,72,.12)',
                  transition: 'all .2s',
                }}
              >
                ⊕ 팀 전체 분석
              </button>
            </div>

            {/* 관계도 SVG 카드 */}
            <div style={{
              background: 'linear-gradient(145deg, var(--bg2), var(--bg1))',
              borderRadius: 'var(--r2)', padding: '16px 16px 12px',
              marginBottom: 14, border: '1px solid var(--line)',
              boxShadow: '0 4px 20px rgba(0,0,0,.15)',
            }}>
              <RelationGraph
                members={enrichedMembers}
                pairs={pairs}
                selectedNode={selectedNode}
                onNodeClick={i => setSelectedNode(prev => prev === i ? null : i)}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 10 }}>
                {Object.entries(REL_COLOR).map(([type, color]) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--xs)', color: 'var(--t4)' }}>
                    <div style={{ width: 20, height: 2, background: color, borderRadius: 1, boxShadow: `0 0 4px ${color}88` }} />
                    {REL_LABEL[type]}
                  </div>
                ))}
              </div>
              {selectedNode !== null && (
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <button onClick={() => setSelectedNode(null)} style={{
                    fontSize: 'var(--xs)', color: 'var(--t4)', background: 'none',
                    border: 'none', cursor: 'pointer', textDecoration: 'underline',
                  }}>
                    필터 해제
                  </button>
                </div>
              )}
            </div>

            {/* 오행 분포 */}
            <OhaengBar members={enrichedMembers} />

            {/* 역할 태그 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10, letterSpacing: '.05em' }}>
                ✦ 별숨의 역할
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {enrichedMembers.map((m, i) => {
                  const elColor = m.saju?.dom ? OHAENG_COLOR[m.saju.dom] : 'var(--gold)';
                  const isActive = selectedNode === i;
                  return (
                    <div key={i}
                      onClick={() => setSelectedNode(prev => prev === i ? null : i)}
                      style={{
                        padding: '5px 12px',
                        background: isActive ? `${elColor}18` : 'var(--bg2)',
                        borderRadius: 20,
                        border: `1px solid ${isActive ? elColor + '55' : 'var(--line)'}`,
                        fontSize: 'var(--xs)', cursor: 'pointer',
                        transition: 'all .2s',
                        boxShadow: isActive ? `0 0 8px ${elColor}33` : 'none',
                      }}>
                      <span style={{ fontWeight: 700, color: isActive ? elColor : 'var(--t1)' }}>{m.name}</span>
                      <span style={{ color: 'var(--t4)', margin: '0 4px' }}>—</span>
                      <span style={{ color: isActive ? elColor : 'var(--t3)' }}>{roleOf(m.saju)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 쌍 목록 */}
            {(() => {
              const visiblePairs = selectedNode !== null
                ? pairs.filter(p => p.idxA === selectedNode || p.idxB === selectedNode)
                : pairs;
              const vGood    = visiblePairs.filter(p => p.type === 'good');
              const vCaution = visiblePairs.filter(p => p.type === 'caution');
              const vBad     = visiblePairs.filter(p => p.type === 'bad');

              const PairRow = ({ p, accentColor }) => {
                const tier = getCompatTier(p.score);
                return (
                  <div
                    onClick={() => setSelectedPair(p)}
                    style={{
                      padding: '12px 14px',
                      background: 'var(--bg2)', borderRadius: 'var(--r2)',
                      border: `1px solid ${accentColor}22`,
                      marginBottom: 7, cursor: 'pointer',
                      transition: 'border-color .2s, box-shadow .2s',
                      position: 'relative', overflow: 'hidden',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${accentColor}55`; e.currentTarget.style.boxShadow = `0 2px 12px ${accentColor}18`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = `${accentColor}22`; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {/* 왼쪽 액센트 */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                      background: accentColor, borderRadius: '2px 0 0 2px',
                      boxShadow: `0 0 6px ${accentColor}55`,
                    }} />
                    <div style={{ paddingLeft: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 700 }}>
                          {enrichedMembers[p.idxA].name}
                          <span style={{ color: 'var(--t4)', margin: '0 6px', fontWeight: 400 }}>×</span>
                          {enrichedMembers[p.idxB].name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 'var(--xs)', fontWeight: 700,
                            color: accentColor, padding: '2px 7px',
                            background: `${accentColor}18`, borderRadius: 10,
                          }}>{p.score}%</span>
                          <span style={{ fontSize: 10, color: 'var(--t4)' }}>→</span>
                        </div>
                      </div>
                      {/* 점수 바 */}
                      <div style={{ height: 3, background: 'rgba(255,255,255,.05)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${p.score}%`,
                          background: `linear-gradient(90deg, ${accentColor}55, ${accentColor})`,
                          borderRadius: 2, transition: 'width 1s ease',
                        }} />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 4 }}>
                        {tier.emoji} {tier.label}
                      </div>
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {vGood.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 'var(--xs)', color: REL_COLOR.good, fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>
                        🟡 좋은 별숨 ({vGood.length}쌍)
                      </div>
                      {vGood.map((p, i) => <PairRow key={i} p={p} accentColor={REL_COLOR.good} />)}
                    </div>
                  )}
                  {vCaution.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 'var(--xs)', color: REL_COLOR.caution, fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>
                        🟠 주의 별숨 ({vCaution.length}쌍)
                      </div>
                      {vCaution.map((p, i) => <PairRow key={i} p={p} accentColor={REL_COLOR.caution} />)}
                    </div>
                  )}
                  {vBad.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 'var(--xs)', color: REL_COLOR.bad, fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>
                        🔴 나쁜 별숨 ({vBad.length}쌍)
                      </div>
                      {vBad.map((p, i) => <PairRow key={i} p={p} accentColor={REL_COLOR.bad} />)}
                    </div>
                  )}
                  {visiblePairs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 'var(--sm)', color: 'var(--t4)' }}>
                      표시할 쌍이 없어요
                    </div>
                  )}
                </>
              );
            })()}

            <button
              className="res-btn"
              style={{ width: '100%', marginBottom: 8 }}
              onClick={() => setPhase('members')}
            >
              ← 멤버 목록으로
            </button>
          </div>
        </div>

        {selectedPair && (
          <DetailPanel pair={selectedPair} members={enrichedMembers} onClose={() => setSelectedPair(null)} user={user} />
        )}
        {groupAnalysisOpen && (
          <GroupAnalysisPanel members={enrichedMembers} onClose={() => setGroupAnalysisOpen(false)} user={user} />
        )}
      </div>
    );
  }

  return null;
}

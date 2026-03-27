import { useState, useMemo, useEffect } from "react";
import { getSaju, ON } from "../utils/saju.js";
import { getSun } from "../utils/astrology.js";
import { supabase } from "../lib/supabase.js";

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
          value={form.by} onChange={e => upd('by', e.target.value.replace(/\D/, '').slice(0, 4))}
          style={{ marginBottom: 0 }} />
        <select className="inp" value={form.bm} onChange={e => upd('bm', e.target.value)} style={{ marginBottom: 0 }}>
          <option value="">월</option>{[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}월</option>)}
        </select>
        <select className="inp" value={form.bd} onChange={e => upd('bd', e.target.value)} style={{ marginBottom: 0 }}>
          <option value="">일</option>{[...Array(31)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}일</option>)}
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
function RelationGraph({ members, pairs }) {
  const W = 320, H = 300, cx = 160, cy = 150, r = 100;
  const positions = calcNodePositions(members.length, cx, cy, members.length === 1 ? 0 : r);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', maxWidth: 360, margin: '0 auto' }}>
      {/* 엣지 */}
      {pairs.map((pair, i) => {
        const posA = positions[pair.idxA];
        const posB = positions[pair.idxB];
        if (!posA || !posB) return null;
        const color = REL_COLOR[pair.type];
        const strokeWidth = pair.score >= 70 ? 2.5 : pair.score >= 50 ? 1.5 : 1;
        return (
          <line key={i}
            x1={posA.x} y1={posA.y} x2={posB.x} y2={posB.y}
            stroke={color} strokeWidth={strokeWidth} strokeOpacity={0.7}
            strokeDasharray={pair.type === 'bad' ? '4 3' : undefined}
          />
        );
      })}
      {/* 노드 */}
      {members.map((m, i) => {
        const pos = positions[i];
        if (!pos) return null;
        const sun = m.saju ? null : null;
        return (
          <g key={i}>
            <circle cx={pos.x} cy={pos.y} r={26}
              fill="var(--bg2)" stroke="var(--gold)" strokeWidth={1.5} />
            <circle cx={pos.x} cy={pos.y} r={24}
              fill="rgba(180,140,50,0.06)" />
            <text x={pos.x} y={pos.y - 4} textAnchor="middle"
              fill="var(--t1)" fontSize={11} fontWeight={700} fontFamily="var(--ff)">
              {m.name.slice(0, 3)}
            </text>
            <text x={pos.x} y={pos.y + 10} textAnchor="middle"
              fill="var(--gold)" fontSize={9} fontFamily="var(--ff)">
              {m.saju ? ON[m.saju.dom] : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── 상세 분석 패널 ──
function DetailPanel({ pair, members, onClose }) {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const askDetail = async () => {
    setLoading(true);
    try {
      const a = members[pair.idxA], b = members[pair.idxB];
      const ctx = [a, b].map(m => {
        let s = `[${m.name}]\n`;
        if (m.saju) s += `일주: ${m.saju.il.g}${m.saju.il.j} / 기질: ${m.saju.ilganDesc} / ${ON[m.saju.dom]} 기운\n`;
        if (m.sun) s += `별자리: ${m.sun.n}(${m.sun.s})\n`;
        return s;
      }).join('\n');
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: `${a.name}과 ${b.name}의 별숨 관계를 깊이 분석해주세요. 좋은 점, 나쁜 점, 서로 주의해야 할 점, 함께할 때의 케미를 별숨의 언어로 이야기해주세요.`,
          context: ctx,
          isGroupAnalysis: true,
          isChat: true,
        }),
      });
      const data = await res.json();
      setResult(data.text || '분석을 불러오지 못했어요 🌙');
    } catch {
      setResult('별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { askDetail(); }, []);

  const a = members[pair.idxA], b = members[pair.idxB];
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--bg1)', borderRadius: '20px 20px 0 0',
        padding: '24px 20px 40px', maxHeight: '75vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: 'var(--t1)', fontSize: 'var(--md)' }}>
            {a.name} × {b.name} 상세 분석
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--t4)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{
          padding: '8px 12px', background: 'var(--goldf)', borderRadius: 'var(--r1)',
          fontSize: 'var(--xs)', color: 'var(--gold)', marginBottom: 16,
        }}>
          {REL_LABEL[pair.type]} · 공명 지수 {pair.score}%
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', gap: 6 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', opacity: 0.6, animation: `orbPulse 1.2s ease-in-out ${i * 0.3}s infinite` }} />
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.85, whiteSpace: 'pre-line' }}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  메인 컴포넌트
// ─────────────────────────────────────────────────────────
// localStorage 백업 키
function getGroupLocalKey(code) { return `byeolsoom_group_${code}`; }

export default function GroupBulseumPage({ form, saju, sun, setStep, initialCode }) {
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

  // 멤버 사주/별자리 계산
  const enrichedMembers = useMemo(() => members.map(m => {
    try {
      const s = getSaju(+m.birth_year, +m.birth_month, +m.birth_day, m.birth_hour ? +m.birth_hour : 12);
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
        const { data, error } = await supabase.from('group_sessions').select('id').eq('invite_code', code).single();
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
    };
    try {
      if (supabase && sessionId && !sessionId.startsWith('local_')) {
        const { error } = await supabase.from('group_members').insert({ ...newMember, session_id: sessionId });
        if (error) throw error;
      }
    } catch (e) {
      console.error('[GroupBulseum] 멤버 저장 오류:', e);
      setSaveError('서버에 저장하지 못했어요. 기기 내에 임시 저장됩니다.');
    }
    const updatedMembers = [...members, newMember];
    setMembers(updatedMembers);
    // 항상 로컬에도 백업
    if (inviteCode) saveLocalMembers(inviteCode, updatedMembers);
    setPhase('members');
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
          <div style={{ paddingTop: 20 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌐</div>
              <div style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
                우리 모임의 별숨은?
              </div>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', lineHeight: 1.8 }}>
                초대 코드로 모임을 만들고<br />
                서로의 별숨 관계를 확인해봐요
              </div>
            </div>

            <button
              className="btn-main"
              onClick={createGroup}
              disabled={createLoading}
              style={{ marginBottom: 12 }}
            >
              {createLoading ? '모임 만드는 중...' : '✦ 새 모임 만들기'}
            </button>

            <div style={{ position: 'relative', margin: '16px 0', textAlign: 'center' }}>
              <div style={{ height: 1, background: 'var(--line)', position: 'absolute', top: '50%', width: '100%' }} />
              <span style={{ background: 'var(--bg1)', padding: '0 12px', fontSize: 'var(--xs)', color: 'var(--t4)', position: 'relative' }}>또는</span>
            </div>

            <div style={{ marginBottom: 8 }}>
              <input
                className="inp"
                placeholder="초대 코드 입력 (6자리)"
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value.toUpperCase().slice(0, 6)); setCodeError(''); }}
                style={{ width: '100%', boxSizing: 'border-box', letterSpacing: 6, textAlign: 'center', fontWeight: 700, fontSize: 'var(--md)', marginBottom: 10 }}
                maxLength={6}
              />
              <button
                className="btn-main"
                onClick={joinGroup}
                disabled={codeInput.length !== 6}
                style={{ width: '100%' }}
              >
                참여
              </button>
            </div>
            {codeError && (
              <div style={{ fontSize: 'var(--xs)', color: 'var(--rose)', marginBottom: 8, textAlign: 'center' }}>
                {codeError}
              </div>
            )}

            <div style={{
              marginTop: 24, padding: '14px 16px', background: 'var(--bg2)',
              borderRadius: 'var(--r1)', border: '1px solid var(--line)',
              fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.8,
            }}>
              ✦ 로그인 없이도 참여할 수 있어요<br />
              ✦ 이름과 생년월일만 입력하면 돼요<br />
              ✦ 초대 코드를 공유해서 친구를 불러봐요
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
          <div style={{ paddingTop: 20 }}>
            <div style={{
              textAlign: 'center', marginBottom: 16,
              padding: '16px', background: 'var(--goldf)',
              borderRadius: 'var(--r1)', border: '1px solid var(--acc)',
            }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 4 }}>초대 코드</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold)', letterSpacing: 10, marginBottom: 4 }}>
                {inviteCode}
              </div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 12 }}>
                현재 {members.length}명 참여 중
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
                  background: linkCopied ? 'var(--acc)' : 'var(--bg1)',
                  border: '1px solid var(--acc)', borderRadius: 20,
                  padding: '6px 16px', color: linkCopied ? '#fff' : 'var(--gold)',
                  fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
                  fontWeight: 700, transition: 'all .2s',
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
              <div style={{ fontSize: 'var(--xs)', color: 'var(--rose)', background: 'rgba(200,80,80,0.08)', border: '1px solid rgba(200,80,80,0.2)', borderRadius: 'var(--r1)', padding: '10px 14px', marginTop: 8, lineHeight: 1.6 }}>
                ⚠️ {saveError}
              </div>
            )}

            {members.length > 0 && (
              <button
                className="res-btn"
                style={{ width: '100%', marginTop: 12 }}
                onClick={() => setPhase('members')}
              >
                참여 멤버 보기 ({members.length}명)
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
              <div style={{
                fontSize: 'var(--xs)', color: 'var(--gold)',
                padding: '4px 10px', background: 'var(--goldf)',
                borderRadius: 20, fontWeight: 700, letterSpacing: 2,
              }}>{inviteCode}</div>
            </div>

            {/* 멤버 카드 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {enrichedMembers.map((m, i) => (
                <div key={i} style={{
                  padding: '12px 14px', background: 'var(--bg2)',
                  borderRadius: 'var(--r1)', border: '1px solid var(--line)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'var(--goldf)', border: '1px solid var(--acc)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: 'var(--gold)', flexShrink: 0,
                  }}>
                    {m.name.slice(0, 1)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 2 }}>{m.name}</div>
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>
                      {m.sun && `${m.sun.s} ${m.sun.n} · `}
                      {m.saju && `${ON[m.saju.dom]} 기운 · ${roleOf(m.saju)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {saveError && (
              <div style={{ fontSize: 'var(--xs)', color: 'var(--rose)', background: 'rgba(200,80,80,0.08)', border: '1px solid rgba(200,80,80,0.2)', borderRadius: 'var(--r1)', padding: '10px 14px', marginBottom: 12, lineHeight: 1.6 }}>
                ⚠️ {saveError}
              </div>
            )}

            <button
              className="btn-main"
              disabled={members.length < 2}
              onClick={() => setPhase('graph')}
              style={{ marginBottom: 8 }}
            >
              ✦ 별숨 관계도 보기 ({members.length >= 2 ? `${pairs.length}쌍 분석` : '2명 이상 필요해요'})
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
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 'var(--md)', fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
                우리 모임의 별숨 관계도
              </div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
                {members.length}명 · {pairs.length}쌍 분석
              </div>
            </div>

            {/* 관계도 SVG */}
            <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 'var(--sp2)', marginBottom: 16, border: '1px solid var(--line)' }}>
              <RelationGraph members={enrichedMembers} pairs={pairs} />
              {/* 범례 */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
                {Object.entries(REL_COLOR).map(([type, color]) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--xs)', color: 'var(--t3)' }}>
                    <div style={{ width: 24, height: 2, background: color, borderRadius: 1 }} />
                    {REL_LABEL[type]}
                  </div>
                ))}
              </div>
            </div>

            {/* 각자의 역할 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10, letterSpacing: '.04em' }}>
                ✦ 별숨의 역할
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {enrichedMembers.map((m, i) => (
                  <div key={i} style={{
                    padding: '6px 12px', background: 'var(--bg2)',
                    borderRadius: 20, border: '1px solid var(--line)',
                    fontSize: 'var(--xs)', color: 'var(--t2)',
                  }}>
                    <span style={{ fontWeight: 700, color: 'var(--t1)' }}>{m.name}</span>
                    <span style={{ color: 'var(--t4)' }}> — </span>
                    {roleOf(m.saju)}
                  </div>
                ))}
              </div>
            </div>

            {/* 좋은 별숨 쌍 */}
            {goodPairs.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 'var(--xs)', color: '#B4963C', fontWeight: 700, marginBottom: 8 }}>
                  🟡 좋은 별숨 ({goodPairs.length}쌍)
                </div>
                {goodPairs.map((p, i) => (
                  <div key={i}
                    onClick={() => setSelectedPair(p)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', background: 'var(--bg2)',
                      borderRadius: 'var(--r1)', border: '1px solid rgba(180,140,50,0.25)',
                      marginBottom: 6, cursor: 'pointer',
                    }}>
                    <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 600 }}>
                      {enrichedMembers[p.idxA].name} × {enrichedMembers[p.idxB].name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 'var(--xs)', color: 'var(--gold)' }}>{p.score}%</span>
                      <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>더 자세히 →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 주의 별숨 쌍 */}
            {cautionPairs.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 'var(--xs)', color: '#C47A48', fontWeight: 700, marginBottom: 8 }}>
                  🟠 주의 별숨 ({cautionPairs.length}쌍)
                </div>
                {cautionPairs.map((p, i) => (
                  <div key={i}
                    onClick={() => setSelectedPair(p)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', background: 'var(--bg2)',
                      borderRadius: 'var(--r1)', border: '1px solid rgba(196,122,72,0.25)',
                      marginBottom: 6, cursor: 'pointer',
                    }}>
                    <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 600 }}>
                      {enrichedMembers[p.idxA].name} × {enrichedMembers[p.idxB].name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 'var(--xs)', color: '#C47A48' }}>{p.score}%</span>
                      <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>더 자세히 →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 나쁜 별숨 쌍 */}
            {badPairs.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 'var(--xs)', color: '#9B4EC4', fontWeight: 700, marginBottom: 8 }}>
                  🔴 나쁜 별숨 ({badPairs.length}쌍)
                </div>
                {badPairs.map((p, i) => (
                  <div key={i}
                    onClick={() => setSelectedPair(p)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', background: 'var(--bg2)',
                      borderRadius: 'var(--r1)', border: '1px solid rgba(155,78,196,0.25)',
                      marginBottom: 6, cursor: 'pointer',
                    }}>
                    <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 600 }}>
                      {enrichedMembers[p.idxA].name} × {enrichedMembers[p.idxB].name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 'var(--xs)', color: '#9B4EC4' }}>{p.score}%</span>
                      <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>더 자세히 →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              className="res-btn"
              style={{ width: '100%', marginBottom: 8 }}
              onClick={() => setPhase('members')}
            >
              ← 멤버 목록으로
            </button>
          </div>
        </div>

        {/* 상세 분석 패널 */}
        {selectedPair && (
          <DetailPanel
            pair={selectedPair}
            members={enrichedMembers}
            onClose={() => setSelectedPair(null)}
          />
        )}
      </div>
    );
  }

  return null;
}

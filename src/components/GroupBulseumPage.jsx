import { useState, useMemo } from 'react';
import { getSaju } from '../utils/saju.js';
import { getSun } from '../utils/astrology.js';
import { supabase } from '../lib/supabase.js';
import {
  OHAENG_COLOR, OHAENG_CHAR, REL_COLOR, REL_LABEL,
  pairScore, relType, roleOf, getCompatTier, getGroupLocalKey, genInviteCode,
} from '../features/group/groupUtils.js';
import OhaengBar from '../features/group/OhaengBar.jsx';
import MemberForm from '../features/group/MemberForm.jsx';
import TeamChemiSummary from '../features/group/TeamChemiSummary.jsx';
import RelationGraph from '../features/group/RelationGraph.jsx';
import DetailPanel from '../features/group/DetailPanel.jsx';
import GroupAnalysisPanel from '../features/group/GroupAnalysisPanel.jsx';

export default function GroupBulseumPage({ setStep, initialCode, user }) {
  const [phase, setPhase] = useState('landing');
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
  const [teamMode, setTeamMode] = useState(false);

  const enrichedMembers = useMemo(() => members.map((m) => {
    try {
      const saju = getSaju(+m.birth_year, +m.birth_month, +m.birth_day, m.birth_hour != null ? +m.birth_hour : 12);
      const sun = getSun(+m.birth_month, +m.birth_day);
      return { ...m, saju, sun };
    } catch {
      return { ...m, saju: null, sun: null };
    }
  }), [members]);

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

  const visiblePairs = selectedNode !== null
    ? pairs.filter((p) => p.idxA === selectedNode || p.idxB === selectedNode)
    : pairs;
  const vGood = visiblePairs.filter((p) => p.type === 'good');
  const vCaution = visiblePairs.filter((p) => p.type === 'caution');
  const vBad = visiblePairs.filter((p) => p.type === 'bad');

  const saveLocalMembers = (code, memberList) => {
    try {
      localStorage.setItem(getGroupLocalKey(code), JSON.stringify(memberList));
    } catch (error) {
      console.warn('[GroupBulseum] localStorage save failed', error?.message);
    }
  };

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
        setSessionId(`local_${Date.now()}`);
      }
      setInviteCode(code);
      setPhase('join');
    } catch (error) {
      console.error('[GroupBulseum] create failed:', error);
      setSessionId(`local_${Date.now()}`);
      setInviteCode(code);
      setPhase('join');
      setSaveError('서버 저장은 잠시 실패했지만, 지금 기기에서는 이어서 사용할 수 있어요.');
    } finally {
      setCreateLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!codeInput.trim()) return;
    setCodeError('');
    setSaveError('');
    const code = codeInput.trim().toUpperCase();

    try {
      if (supabase) {
        const { data, error } = await supabase.from('group_sessions').select('id').eq('invite_code', code).maybeSingle();
        if (error || !data) {
          const localData = localStorage.getItem(getGroupLocalKey(code));
          if (localData) {
            try {
              setMembers(JSON.parse(localData));
              setSessionId(`local_${code}`);
              setInviteCode(code);
              setPhase('join');
              return;
            } catch {}
          }
          setCodeError('초대 코드를 찾지 못했어요. 다시 확인해봐요.');
          return;
        }

        setSessionId(data.id);
        setInviteCode(code);
        const { data: existingMembers } = await supabase.from('group_members').select('*').eq('session_id', data.id);
        if (existingMembers?.length) setMembers(existingMembers);
      } else {
        const localData = localStorage.getItem(getGroupLocalKey(code));
        if (localData) {
          try { setMembers(JSON.parse(localData)); } catch {}
        }
        setSessionId(`local_${code}`);
        setInviteCode(code);
      }

      setPhase('join');
    } catch {
      setCodeError('코드를 확인하는 중 오류가 생겼어요.');
    }
  };

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
        const { data, error } = await supabase
          .from('group_members')
          .insert({ ...newMember, session_id: sessionId })
          .select('*')
          .single();
        if (error) throw error;

        const updatedMembers = [...members, { ...newMember, ...data }];
        setMembers(updatedMembers);
        if (inviteCode) saveLocalMembers(inviteCode, updatedMembers);
        setPhase('members');
        return;
      }
    } catch (error) {
      console.error('[GroupBulseum] member save failed:', error?.message);
      setSaveError('서버 저장은 실패했지만, 이 기기에서는 계속 이어서 볼 수 있어요.');
    }

    const updatedMembers = [...members, newMember];
    setMembers(updatedMembers);
    if (inviteCode) saveLocalMembers(inviteCode, updatedMembers);
    setPhase('members');
  };

  const removeMember = async (idx) => {
    const member = members[idx];
    const updatedMembers = members.filter((_, i) => i !== idx);
    setMembers(updatedMembers);
    if (inviteCode) saveLocalMembers(inviteCode, updatedMembers);

    try {
      if (supabase && sessionId && !sessionId.startsWith('local_') && member?.id) {
        await supabase.from('group_members').delete().eq('id', member.id);
      }
    } catch (error) {
      console.error('[GroupBulseum] member delete failed:', error?.message);
    }
  };

  const goToGraph = () => {
    setSelectedPair(null);
    setPhase('graph');
    if (teamMode) setGroupAnalysisOpen(true);
  };

  const PairRow = ({ pair, accentColor }) => {
    const tier = getCompatTier(pair.score);
    return (
      <div
        onClick={() => setSelectedPair(pair)}
        style={{
          padding: '12px 14px',
          background: 'var(--bg2)',
          borderRadius: 'var(--r2)',
          border: `1px solid ${accentColor}22`,
          marginBottom: 7,
          cursor: 'pointer',
          transition: 'border-color .2s, box-shadow .2s',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accentColor, borderRadius: '2px 0 0 2px', boxShadow: `0 0 6px ${accentColor}55` }} />
        <div style={{ paddingLeft: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 700 }}>
              {enrichedMembers[pair.idxA].name}
              <span style={{ color: 'var(--t4)', margin: '0 6px', fontWeight: 400 }}>×</span>
              {enrichedMembers[pair.idxB].name}
            </div>
            <span style={{ fontSize: 'var(--xs)', fontWeight: 700, color: accentColor, padding: '2px 7px', background: `${accentColor}18`, borderRadius: 10 }}>
              {pair.score}%
            </span>
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,.05)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pair.score}%`, background: `linear-gradient(90deg, ${accentColor}55, ${accentColor})`, borderRadius: 2, transition: 'width 1s ease' }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 4 }}>{tier.emoji} {tier.label}</div>
        </div>
      </div>
    );
  };

  if (phase === 'landing') {
    return (
      <div className="page">
        <div className="inner">
          <div style={{ paddingTop: 8 }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 30, marginBottom: 18 }}>🌌</div>
              <div style={{ fontSize: 'var(--xl)', fontWeight: 700, lineHeight: 1.25, marginBottom: 12 }}>우리 모임의 별숨은?</div>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', lineHeight: 1.9 }}>
                초대 코드 하나로 모임을 만들고
                <br />
                사주와 별자리로 서로의 케미를 볼 수 있어요
              </div>
            </div>

            <button className="btn-main" onClick={createGroup} disabled={createLoading} style={{ marginTop: 0, marginBottom: 12 }}>
              {createLoading ? '모임 만드는 중...' : '새 모임 만들기'}
            </button>

            <div style={{ position: 'relative', margin: '20px 0', textAlign: 'center' }}>
              <div style={{ height: 1, background: 'var(--line)', position: 'absolute', top: '50%', width: '100%' }} />
              <span style={{ background: 'var(--bg1)', padding: '0 14px', position: 'relative', fontSize: 'var(--xs)', color: 'var(--t4)', letterSpacing: '.08em' }}>또는 코드로 참여</span>
            </div>

            <div style={{ marginBottom: 8 }}>
              <input
                className="inp"
                placeholder="A B C 1 2 3"
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value.toUpperCase().slice(0, 6)); setCodeError(''); }}
                style={{ letterSpacing: 10, textAlign: 'center', fontWeight: 700, fontSize: 'var(--lg)', marginBottom: 10 }}
                maxLength={6}
              />
              <button className="btn-main" onClick={joinGroup} disabled={codeInput.length !== 6} style={{ marginTop: 0 }}>모임 참여하기</button>
            </div>
            {codeError && <div style={{ fontSize: 'var(--xs)', color: 'var(--rose)', marginBottom: 8, textAlign: 'center' }}>{codeError}</div>}

            <div style={{ marginTop: 24, padding: '16px 18px', background: 'var(--bg2)', borderRadius: 'var(--r2)', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>로그인 없이도 참여할 수 있어요.</div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>이름과 생년월일만 입력하면 돼요.</div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>초대 링크 복사로 바로 모을 수 있어요.</div>
            </div>
            <button className="res-btn" style={{ width: '100%', marginTop: 16 }} onClick={() => setStep(0)}>메인으로</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'join') {
    return (
      <div className="page">
        <div className="inner">
          <div style={{ paddingTop: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 20, padding: '20px 16px', background: 'linear-gradient(145deg, rgba(232,176,72,.1), rgba(232,176,72,.04))', borderRadius: 'var(--r2)', border: '1px solid rgba(232,176,72,.25)' }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', letterSpacing: '.1em', marginBottom: 8 }}>초대 코드</div>
              <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 14, marginBottom: 8 }}>{inviteCode}</div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 14 }}>현재 {members.length}명 참여 중</div>
              <button
                onClick={() => {
                  const link = `${window.location.origin}?group=${inviteCode}`;
                  navigator.clipboard.writeText(link).then(() => {
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  });
                }}
                style={{ background: linkCopied ? 'rgba(232,176,72,.25)' : 'var(--bg1)', border: `1px solid ${linkCopied ? 'var(--gold)' : 'rgba(232,176,72,.3)'}`, borderRadius: 20, padding: '7px 20px', color: 'var(--gold)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', fontWeight: 700 }}
              >
                {linkCopied ? '복사됨' : '초대 링크 복사'}
              </button>
            </div>

            <MemberForm title="내 정보 입력하기" onSubmit={addMember} />

            {saveError && <div style={{ fontSize: 'var(--xs)', color: 'var(--rose)', background: 'var(--rosef)', border: '1px solid var(--roseacc)', borderRadius: 'var(--r1)', padding: '10px 14px', marginTop: 8, lineHeight: 1.6 }}>{saveError}</div>}
            {members.length > 0 && <button className="res-btn" style={{ width: '100%', marginTop: 12 }} onClick={() => setPhase('members')}>참여 멤버 보기 ({members.length}명)</button>}
            <button className="res-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setPhase('landing')}>뒤로</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'members') {
    return (
      <div className="page">
        <div className="inner">
          <div style={{ paddingTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: 'var(--t1)', fontSize: 'var(--md)' }}>우리 모임 ({members.length}명)</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => setTeamMode((prev) => !prev)}
                  style={{ padding: '4px 10px', background: teamMode ? 'var(--acc)' : 'var(--bg2)', border: `1px solid ${teamMode ? 'var(--acc)' : 'var(--line)'}`, borderRadius: 20, fontSize: 'var(--xs)', fontWeight: 700, color: teamMode ? '#fff' : 'var(--t3)', cursor: 'pointer' }}
                >
                  {teamMode ? '팀 모드' : '두 명'}
                </button>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', padding: '4px 10px', background: 'var(--goldf)', borderRadius: 20, fontWeight: 700, letterSpacing: 2 }}>{inviteCode}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {enrichedMembers.map((m, i) => {
                const elColor = m.saju?.dom ? OHAENG_COLOR[m.saju.dom] : 'var(--gold)';
                const elChar = m.saju?.dom ? OHAENG_CHAR[m.saju.dom] : '✦';
                const mKey = m.id || `${m.name}_${m.birth_year}_${m.birth_month}_${m.birth_day}`;

                return (
                  <div key={mKey} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg2)', borderRadius: 'var(--r2)', border: '1px solid var(--line)', padding: '10px 12px 10px 0', overflow: 'hidden' }}>
                    <div style={{ width: 4, alignSelf: 'stretch', flexShrink: 0, background: elColor, borderRadius: '0 2px 2px 0', marginRight: 4 }} />
                    <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: `${elColor}18`, border: `1.5px solid ${elColor}44`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.1 }}>{m.name.slice(0, 1)}</div>
                      <div style={{ fontSize: 9, color: elColor, fontWeight: 700, lineHeight: 1 }}>{elChar}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 2, fontSize: 'var(--sm)' }}>{m.name}</div>
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.sun && <span>{m.sun.s} {m.sun.n}</span>}
                        {m.sun && m.saju && <span style={{ margin: '0 4px', color: 'var(--line)' }}>·</span>}
                        {m.saju && <span style={{ color: elColor }}>{roleOf(m.saju)}</span>}
                      </div>
                    </div>
                    <button onClick={() => removeMember(i)} style={{ background: 'none', border: 'none', color: 'var(--t4)', cursor: 'pointer', fontSize: 13, padding: '6px 8px', borderRadius: 6, flexShrink: 0 }} title={`${m.name} 삭제`}>✕</button>
                  </div>
                );
              })}
            </div>

            {saveError && <div style={{ fontSize: 'var(--xs)', color: 'var(--rose)', background: 'var(--rosef)', border: '1px solid var(--roseacc)', borderRadius: 'var(--r1)', padding: '10px 14px', marginBottom: 12, lineHeight: 1.6 }}>{saveError}</div>}

            <button className="btn-main" disabled={members.length < 2} onClick={goToGraph} style={{ marginBottom: 8 }}>
              {members.length >= 2
                ? (teamMode ? '팀 전체 분석 보기' : `별숨 관계도 보기 · ${pairs.length}쌍`)
                : '2명 이상 있어야 관계도를 볼 수 있어요'}
            </button>
            <button className="res-btn" style={{ width: '100%', marginBottom: 8 }} onClick={() => { setSaveError(''); setPhase('join'); }}>+ 멤버 추가하기</button>
            <button className="res-btn" style={{ width: '100%' }} onClick={() => setPhase('landing')}>처음으로</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'graph') {
    return (
      <div className="page">
        <div className="inner">
          <div style={{ paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 10 }}>
              <div>
                <div style={{ fontSize: 'var(--md)', fontWeight: 700, marginBottom: 3 }}>별숨 관계도</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)', padding: '2px 8px', background: 'var(--bg2)', borderRadius: 20, border: '1px solid var(--line)' }}>{members.length}명 · {pairs.length}쌍</span>
                  {selectedNode !== null && <span style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, padding: '2px 8px', background: 'var(--goldf)', borderRadius: 20, border: '1px solid var(--acc)' }}>{enrichedMembers[selectedNode]?.name}</span>}
                  {teamMode && <span style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, padding: '2px 8px', background: 'var(--goldf)', borderRadius: 20, border: '1px solid var(--acc)' }}>팀 전체 시선</span>}
                </div>
              </div>
              <button onClick={() => setGroupAnalysisOpen(true)} style={{ padding: '8px 14px', flexShrink: 0, background: 'linear-gradient(135deg, rgba(232,176,72,.18), rgba(232,176,72,.08))', border: '1px solid rgba(232,176,72,.35)', borderRadius: 20, fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--gold)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                팀 전체 분석
              </button>
            </div>

            <div style={{ background: 'linear-gradient(145deg, var(--bg2), var(--bg1))', borderRadius: 'var(--r2)', padding: '16px 16px 12px', marginBottom: 14, border: '1px solid var(--line)' }}>
              <RelationGraph members={enrichedMembers} pairs={pairs} selectedNode={selectedNode} onNodeClick={(i) => setSelectedNode((prev) => prev === i ? null : i)} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 10 }}>
                {Object.entries(REL_COLOR).map(([type, color]) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--xs)', color: 'var(--t4)' }}>
                    <div style={{ width: 20, height: 2, background: color, borderRadius: 1 }} />
                    {REL_LABEL[type]}
                  </div>
                ))}
              </div>
              {selectedNode !== null && (
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <button onClick={() => setSelectedNode(null)} style={{ fontSize: 'var(--xs)', color: 'var(--t4)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>필터 해제</button>
                </div>
              )}
            </div>

            {pairs.length >= 2 && <TeamChemiSummary members={enrichedMembers} pairs={pairs} />}
            <OhaengBar members={enrichedMembers} />

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 10, letterSpacing: '.05em' }}>별숨의 역할</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {enrichedMembers.map((m, i) => {
                  const elColor = m.saju?.dom ? OHAENG_COLOR[m.saju.dom] : 'var(--gold)';
                  const isActive = selectedNode === i;
                  const mKey = m.id || `role_${m.name}_${m.birth_year}_${m.birth_month}_${m.birth_day}`;
                  return (
                    <div key={mKey} onClick={() => setSelectedNode((prev) => prev === i ? null : i)} style={{ padding: '5px 12px', background: isActive ? `${elColor}18` : 'var(--bg2)', borderRadius: 20, border: `1px solid ${isActive ? `${elColor}55` : 'var(--line)'}`, fontSize: 'var(--xs)', cursor: 'pointer' }}>
                      <span style={{ fontWeight: 700, color: isActive ? elColor : 'var(--t1)' }}>{m.name}</span>
                      <span style={{ color: 'var(--t4)', margin: '0 4px' }}>—</span>
                      <span style={{ color: isActive ? elColor : 'var(--t3)' }}>{roleOf(m.saju)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {teamMode ? (
              <div style={{ marginBottom: 16, padding: '14px 16px', borderRadius: 'var(--r2)', background: 'var(--goldf)', border: '1px solid var(--acc)' }}>
                <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--gold)', marginBottom: 6 }}>팀 전체 모드</div>
                <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7, marginBottom: 10 }}>
                  지금은 쌍별 비교보다 모임 전체 흐름을 먼저 보는 모드예요. 두 사람 케미를 자세히 보고 싶다면 위에서 `두 명` 모드로 바꿔주세요.
                </div>
                <button
                  type="button"
                  onClick={() => setGroupAnalysisOpen(true)}
                  style={{ padding: '8px 14px', borderRadius: 999, border: '1px solid var(--acc)', background: 'var(--bg1)', color: 'var(--gold)', fontSize: 'var(--xs)', fontWeight: 700, fontFamily: 'var(--ff)', cursor: 'pointer' }}
                >
                  전체 분석 다시 보기
                </button>
              </div>
            ) : (
              <>
                {vGood.length > 0 && <div style={{ marginBottom: 14 }}><div style={{ fontSize: 'var(--xs)', color: REL_COLOR.good, fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>좋은 별숨 ({vGood.length}쌍)</div>{vGood.map((pair, i) => <PairRow key={i} pair={pair} accentColor={REL_COLOR.good} />)}</div>}
                {vCaution.length > 0 && <div style={{ marginBottom: 14 }}><div style={{ fontSize: 'var(--xs)', color: REL_COLOR.caution, fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>주의 별숨 ({vCaution.length}쌍)</div>{vCaution.map((pair, i) => <PairRow key={i} pair={pair} accentColor={REL_COLOR.caution} />)}</div>}
                {vBad.length > 0 && <div style={{ marginBottom: 16 }}><div style={{ fontSize: 'var(--xs)', color: REL_COLOR.bad, fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>나쁜 별숨 ({vBad.length}쌍)</div>{vBad.map((pair, i) => <PairRow key={i} pair={pair} accentColor={REL_COLOR.bad} />)}</div>}
                {visiblePairs.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 'var(--sm)', color: 'var(--t4)' }}>표시할 쌍이 없어요.</div>}
              </>
            )}

            <button className="res-btn" style={{ width: '100%', marginBottom: 8 }} onClick={() => setPhase('members')}>멤버 목록으로</button>
          </div>
        </div>

        {selectedPair && !teamMode && <DetailPanel pair={selectedPair} members={enrichedMembers} onClose={() => setSelectedPair(null)} />}
        {groupAnalysisOpen && <GroupAnalysisPanel members={enrichedMembers} onClose={() => setGroupAnalysisOpen(false)} />}
      </div>
    );
  }

  return null;
}

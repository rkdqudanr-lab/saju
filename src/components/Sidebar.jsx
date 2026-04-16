import { useState, useEffect, useRef, useCallback } from "react";
import { loadHistory, deleteHistory } from "../utils/history.js";
import { loadAnalysisCache, saveAnalysisCache } from "../lib/analysisCache.js";

// ═══════════════════════════════════════════════════════════
//  🗂️ 사이드바
// ═══════════════════════════════════════════════════════════

/** 검색어와 일치하는 부분을 <mark> 태그로 강조 */
function Highlight({ text, query }) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'var(--gold)', color: '#0D0B14', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/** 날짜 필터 범위 계산 */
function getDateRange(filter) {
  const now = new Date();
  if (filter === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay()); // 이번 주 일요일
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (filter === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
}

export default function Sidebar({ user, step, onClose, onNav, onKakaoLogin, onKakaoLogout, onProfileOpen, onInvite, onAddOther, onSettings, histItems: histItemsProp, onDeleteAllHistory, sidebarPrefs, todayDiaryWritten }) {
  const [histItems, setHistItems] = useState(() => histItemsProp || loadHistory());
  const [rawSearch, setRawSearch] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'week' | 'month'
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [starredIds, setStarredIds] = useState(new Set());
  const [openGroups, setOpenGroups] = useState({ today: true, consult: true, growth: true, square: true });
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(15);
  const debounceRef = useRef(null);
  // 기존 키('myinfo','fortune','special') → 새 키('growth','square')로 마이그레이션
  const rawHidden = sidebarPrefs?.hiddenGroups || [];
  const hiddenGroups = rawHidden.map(k =>
    k === 'myinfo' ? 'growth' : k === 'fortune' ? 'growth' : k === 'special' ? 'consult' : k
  );
  const toggleGroup = (key) => setOpenGroups(p => ({ ...p, [key]: !p[key] }));

  // 300ms 디바운스 처리
  const handleSearchChange = useCallback((val) => {
    setRawSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(val); setDisplayLimit(15); }, 300);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // histItemsProp 변경 시 동기화
  useEffect(() => { if (histItemsProp) setHistItems(histItemsProp); }, [histItemsProp]);

  // 즐겨찾기 로드 (Supabase)
  useEffect(() => {
    if (!user?.id) return;
    loadAnalysisCache(user.id, 'starred_consultations').then(s => {
      try { setStarredIds(new Set(JSON.parse(s || '[]'))); } catch { setStarredIds(new Set()); }
    });
  }, [user?.id]);

  const toggleStar = useCallback(async (itemId, e) => {
    e.stopPropagation();
    if (!user?.id) return;
    setStarredIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      saveAnalysisCache(user.id, 'starred_consultations', JSON.stringify([...next]));
      return next;
    });
  }, [user?.id]);

  const rangeStart = getDateRange(dateFilter);

  const filtered = histItems.filter(h => {
    // 즐겨찾기 필터
    if (showStarredOnly && !starredIds.has(h.id)) return false;
    // 날짜 필터
    if (rangeStart) {
      const hDate = new Date(h.ts || h.date);
      if (isNaN(hDate) || hDate < rangeStart) return false;
    }
    // 검색어 필터
    if (!search) return true;
    return (
      h.questions.some(q => q.toLowerCase().includes(search.toLowerCase())) ||
      h.answers.some(a => a.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const del = (id, e) => {
    e.stopPropagation();
    deleteHistory(id);
    setHistItems(loadHistory());
  };

  const handleDeleteAll = async (e) => {
    e.stopPropagation();
    if (!confirmDeleteAll) { setConfirmDeleteAll(true); return; }
    setConfirmDeleteAll(false);
    await onDeleteAllHistory?.();
    setHistItems([]);
  };

  const SLOT_EMOJI = { morning: '🌅', afternoon: '✦', evening: '🌙', dawn: '🌌' };
  const histCount = histItems.length;
  const histNearLimit = histCount >= 25;

  return (
    <>
      <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />
      <nav className="sidebar" aria-label="주 네비게이션" role="navigation">
        <div className="sidebar-head">
          <div className="sidebar-logo">✦ byeolsoom</div>
          {user ? (
            <div className="sidebar-user" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {user.profileImage
                ? <img className="sidebar-av" src={user.profileImage} alt="프로필" />
                : <div className="sidebar-av-ph">🌙</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="sidebar-uname">{user.nickname}님</div>
                <div className="sidebar-usub">별숨과 함께하는 중</div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button
                  aria-label="앱 설정"
                  onClick={() => { onSettings?.(); onClose(); }}
                  style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', fontSize: 14, color: 'var(--t3)', fontFamily: 'var(--ff)' }}
                >⚙️</button>
                <button
                  aria-label="로그아웃"
                  onClick={() => { onKakaoLogout(); onClose(); }}
                  style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', fontSize: 14, color: 'var(--t3)', fontFamily: 'var(--ff)' }}
                >🚪</button>
              </div>
            </div>
          ) : (
            <div className="sidebar-user">
              <div className="sidebar-av-ph">✦</div>
              <div>
                <div className="sidebar-uname">게스트</div>
                <div className="sidebar-usub" style={{ cursor: 'pointer', color: 'var(--gold)' }} onClick={onKakaoLogin}>카카오 로그인 →</div>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-body">
          {/* ── 나에 대해 (항상 펼침) ── */}
          <div className="sidebar-section">
            <div className="sidebar-section-lbl">나에 대해</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {user && (
                <li>
                  <button className="sidebar-menu-item" onClick={() => { onProfileOpen(); onClose(); }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onProfileOpen(); onClose(); } }}>
                    <span className="smi-icon" aria-hidden="true">⚙️</span>
                    <span className="smi-text">별숨에게 나를 알려주기</span>
                  </button>
                </li>
              )}
              <li>
                <button className="sidebar-menu-item" onClick={() => { onAddOther && onAddOther(); onClose(); }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAddOther && onAddOther(); onClose(); } }}>
                  <span className="smi-icon" aria-hidden="true">👥</span>
                  <span className="smi-text">다른 사람의 별숨 추가</span>
                </button>
              </li>
            </ul>
          </div>

          {/* ── 오늘의 별숨 (토글) ── */}
          {!hiddenGroups.includes('today') && (
            <div className="sidebar-section">
              <button className="sidebar-group-header" onClick={() => toggleGroup('today')} aria-expanded={openGroups.today}>
                <span>오늘의 별숨</span>
                <span className="sidebar-group-arrow">{openGroups.today ? '▾' : '▸'}</span>
              </button>
              {openGroups.today && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {[
                    { icon: '🏠', label: '홈', s: 0 },
                    { icon: '✦', label: '오늘 하루 나의 별숨', s: 'fortune' },
                    { icon: '📓', label: '나의 하루를 별숨에게', s: 17, badge: todayDiaryWritten === false },
                    { icon: '📚', label: '일기 모아보기', s: 20 },
                    { icon: '🗓️', label: '별숨 달력', s: 10 },
                  ].map(m => (
                    <li key={m.s}>
                      <button
                        className={`sidebar-menu-item ${step === m.s ? 'active' : ''}`}
                        onClick={() => { onNav(m.s); onClose(); }}
                        aria-current={step === m.s ? 'page' : undefined}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNav(m.s); onClose(); } }}
                      >
                        <span className="smi-icon" aria-hidden="true">{m.icon}</span>
                        <span className="smi-text">{m.label}</span>
                        {m.badge && <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--rose, #e05c7a)', marginLeft: 5, flexShrink: 0 }} aria-hidden="true" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── 별숨 상담 (토글) ── */}
          {!hiddenGroups.includes('consult') && (
            <div className="sidebar-section">
              <button className="sidebar-group-header" onClick={() => toggleGroup('consult')} aria-expanded={openGroups.consult}>
                <span>별숨 상담</span>
                <span className="sidebar-group-arrow">{openGroups.consult ? '▾' : '▸'}</span>
              </button>
              {openGroups.consult && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {[
                    { icon: '✦', label: '별숨에게 물어보기', s: 2 },
                    { icon: '📅', label: '월간 리포트', s: 6 },
                    { icon: '◈', label: '별숨의 예언', s: 8 },
                    { icon: '◇', label: '종합 분석 (사주·점성술)', s: 14 },
                  ].map(m => (
                    <li key={m.s}>
                      <button
                        className={`sidebar-menu-item ${step === m.s ? 'active' : ''}`}
                        onClick={() => { onNav(m.s); onClose(); }}
                        aria-current={step === m.s ? 'page' : undefined}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNav(m.s); onClose(); } }}
                      >
                        <span className="smi-icon" aria-hidden="true">{m.icon}</span>
                        <span className="smi-text">{m.label}</span>
                      </button>
                    </li>
                  ))}
                  {/* 특별 기능 구분선 */}
                  <li>
                    <div style={{ margin: '6px var(--sp3) 4px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)', paddingTop: 6, whiteSpace: 'nowrap' }}>✦ 특별 기능</span>
                    </div>
                  </li>
                  {[
                    { icon: '☽', label: '꿈 해몽', s: 24 },
                    { icon: '🗓️', label: '택일 (길일 찾기)', s: 25 },
                    { icon: '📛', label: '이름 풀이 (성명학)', s: 26 },
                  ].map(m => (
                    <li key={m.s}>
                      <button
                        className={`sidebar-menu-item ${step === m.s ? 'active' : ''}`}
                        onClick={() => { onNav(m.s); onClose(); }}
                        aria-current={step === m.s ? 'page' : undefined}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNav(m.s); onClose(); } }}
                      >
                        <span className="smi-icon" aria-hidden="true">{m.icon}</span>
                        <span className="smi-text">{m.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── 성장 · 나를 알아가기 (토글) ── */}
          {!hiddenGroups.includes('growth') && (
            <div className="sidebar-section">
              <button className="sidebar-group-header" onClick={() => toggleGroup('growth')} aria-expanded={openGroups.growth}>
                <span>성장 · 나를 알아가기</span>
                <span className="sidebar-group-arrow">{openGroups.growth ? '▾' : '▸'}</span>
              </button>
              {openGroups.growth && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {[
                    { icon: '易', label: 'MyBlueprint — 나의 별숨', s: 13 },
                    { icon: '◈', label: '나의 대운 흐름', s: 30 },
                    { icon: '✦', label: '1대1 별숨 (궁합)', s: 7 },
                    { icon: '🎂', label: '기념일 운세', s: 12 },
                  ].map(m => (
                    <li key={m.s}>
                      <button
                        className={`sidebar-menu-item ${step === m.s ? 'active' : ''}`}
                        onClick={() => { onNav(m.s); onClose(); }}
                        aria-current={step === m.s ? 'page' : undefined}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNav(m.s); onClose(); } }}
                      >
                        <span className="smi-icon" aria-hidden="true">{m.icon}</span>
                        <span className="smi-text">{m.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── 광장 (토글) ── */}
          {!hiddenGroups.includes('square') && (
            <div className="sidebar-section">
              <button className="sidebar-group-header" onClick={() => toggleGroup('square')} aria-expanded={openGroups.square}>
                <span>광장</span>
                <span className="sidebar-group-arrow">{openGroups.square ? '▾' : '▸'}</span>
              </button>
              {openGroups.square && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {[
                    { icon: '🏛️', label: '별숨 광장', s: 29 },
                    { icon: '🤝', label: '익명 궁합 광장', s: 32 },
                    { icon: '🌐', label: '우리 모임의 별숨은?', s: 11 },
                    { icon: '🛍️', label: '별숨 숍', s: 31 },
                    { icon: '◇', label: '나의 별숨 통계', s: 28 },
                  ].map(m => (
                    <li key={m.s}>
                      <button
                        className={`sidebar-menu-item ${step === m.s ? 'active' : ''}`}
                        onClick={() => { onNav(m.s); onClose(); }}
                        aria-current={step === m.s ? 'page' : undefined}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNav(m.s); onClose(); } }}
                      >
                        <span className="smi-icon" aria-hidden="true">{m.icon}</span>
                        <span className="smi-text">{m.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="sidebar-section">
            <div className="sidebar-section-lbl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
              <span>지난 이야기 ({histCount})</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {user && histCount > 0 && (
                  <button
                    onClick={() => setShowStarredOnly(v => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--xs)', color: showStarredOnly ? 'var(--gold)' : 'var(--t4)', padding: '2px 4px', borderRadius: 4 }}
                    aria-pressed={showStarredOnly}
                    aria-label="즐겨찾기만 보기"
                  >{showStarredOnly ? '★' : '☆'}</button>
                )}
                {user && histCount > 0 && (
                  <>
                    {confirmDeleteAll && (
                      <span style={{ fontSize: 'var(--xs)', color: 'var(--rose)', whiteSpace: 'nowrap' }}>
                        통계가 사라져요 ⚠
                      </span>
                    )}
                    <button
                      onClick={handleDeleteAll}
                      onBlur={() => setConfirmDeleteAll(false)}
                      style={{ background: confirmDeleteAll ? 'var(--rosef)' : 'none', border: confirmDeleteAll ? '1px solid var(--roseacc)' : 'none', cursor: 'pointer', fontSize: 'var(--xs)', color: confirmDeleteAll ? 'var(--rose)' : 'var(--t4)', padding: '2px 6px', borderRadius: 4, transition: 'all .15s' }}
                      aria-label="전체삭제"
                      title="지난 이야기 전체삭제"
                    >전체삭제</button>
                  </>
                )}
              </div>
            </div>
            {histNearLimit && (
              <div role="status" aria-live="polite" style={{ margin: '0 var(--sp3) 8px', padding: '8px 12px', background: 'var(--rosef)', border: '1px solid var(--roseacc)', borderRadius: 'var(--r1)', fontSize: 'var(--xs)', color: 'var(--rose)' }}>
                기록이 거의 가득 찼어요 ({histCount}/{30}). 오래된 기록을 삭제해봐요.
              </div>
            )}
            {histItems.length > 0 && (
              <div style={{ padding: '0 var(--sp3) 8px' }}>
                <input
                  className="hist-search-inp"
                  placeholder="🔍  지난 이야기 검색..."
                  value={rawSearch}
                  onChange={e => handleSearchChange(e.target.value)}
                  aria-label="기록 검색"
                />
                {/* 날짜 필터 탭 */}
                <div className="hist-date-filter" role="group" aria-label="날짜 필터">
                  {[
                    { id: 'all', label: '전체' },
                    { id: 'month', label: '이번 달' },
                    { id: 'week', label: '이번 주' },
                  ].map(f => (
                    <button
                      key={f.id}
                      className={`hdf-tab ${dateFilter === f.id ? 'active' : ''}`}
                      onClick={() => setDateFilter(f.id)}
                      aria-pressed={dateFilter === f.id}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="sidebar-empty">
                {search || dateFilter !== 'all'
                  ? '검색 결과가 없어요 🔍'
                  : '아직 별숨과 나눈 이야기가 없어요\n첫 질문을 던져봐요'}
              </div>
            ) : (
              <>
                {filtered.slice(0, displayLimit).map(h => (
                  <div key={h.id} className="sidebar-hist-item" onClick={() => { onNav('history', h); onClose(); }}>
                    <div className="shi-date">{SLOT_EMOJI[h.slot] || '✦'} {h.date}</div>
                    <div className="shi-q">
                      <Highlight text={h.questions[0]} query={search} />
                    </div>
                    {h.questions.length > 1 && (
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 2 }}>
                        +{h.questions.length - 1}개 더
                      </div>
                    )}
                    {user && (
                      <button
                        onClick={e => toggleStar(h.id, e)}
                        aria-label={starredIds.has(h.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                        style={{ position: 'absolute', right: 28, top: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--xs)', padding: '2px 4px', color: starredIds.has(h.id) ? 'var(--gold)' : 'var(--t4)' }}
                      >{starredIds.has(h.id) ? '★' : '☆'}</button>
                    )}
                    <button
                      className="shi-del"
                      onClick={e => del(h.id, e)}
                      aria-label="기록 삭제"
                      style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t4)', fontSize: 'var(--xs)', padding: '2px 4px', borderRadius: 4 }}
                    >✕</button>
                  </div>
                ))}
                {filtered.length > displayLimit && (
                  <button
                    onClick={() => setDisplayLimit(prev => Math.min(prev + 15, 50))}
                    style={{ width: '100%', padding: '8px', background: 'none', border: 'none', borderTop: '1px solid var(--line)', cursor: 'pointer', fontSize: 'var(--xs)', color: 'var(--gold)', textAlign: 'center', margin: 0 }}
                  >더보기 ({filtered.length - displayLimit}개 남음) ▾</button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="sidebar-foot">
          {user && onInvite && (
            <button className="sidebar-foot-btn" style={{ background: 'rgba(255,215,0,.08)', border: '1px solid var(--gold)', color: 'var(--gold)', marginBottom: 8 }} onClick={() => { onInvite(); onClose(); }}>
              🔗 친구 초대하기
            </button>
          )}
        </div>
      </nav>
    </>
  );
}

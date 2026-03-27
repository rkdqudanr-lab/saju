import { useState, useEffect, useRef, useCallback } from "react";
import { loadHistory, deleteHistory } from "../utils/history.js";

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

export default function Sidebar({ user, step, onClose, onNav, onKakaoLogin, onKakaoLogout, onProfileOpen, onInvite, onAddOther }) {
  const [histItems, setHistItems] = useState(() => loadHistory());
  const [rawSearch, setRawSearch] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'week' | 'month'
  const debounceRef = useRef(null);

  // 300ms 디바운스 처리
  const handleSearchChange = useCallback((val) => {
    setRawSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 300);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const rangeStart = getDateRange(dateFilter);

  const filtered = histItems.filter(h => {
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
            <div className="sidebar-user">
              {user.profileImage
                ? <img className="sidebar-av" src={user.profileImage} alt="프로필" />
                : <div className="sidebar-av-ph">🌙</div>}
              <div>
                <div className="sidebar-uname">{user.nickname}님</div>
                <div className="sidebar-usub">별숨과 함께하는 중</div>
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
          <div className="sidebar-section">
            <div className="sidebar-section-lbl">메뉴</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { icon: '🏠', label: '홈', s: 0 },
                { icon: '✦', label: '별숨에게 물어보기', s: 1 },
                { icon: '🌟', label: '오늘 하루 나의 별숨', s: 'fortune' },
                { icon: '📅', label: '월간 리포트', s: 6 },
                { icon: '💞', label: '1대1 별숨', s: 7 },
                { icon: '🔮', label: '별숨의 예언', s: 8 },
                { icon: '🗓️', label: '별숨 달력', s: 10 },
                { icon: '🌐', label: '우리 모임의 별숨은?', s: 11 },
                { icon: '🎂', label: '기념일 운세', s: 12 },
                { icon: '🀄', label: '나의 별숨(사주원국과 별자리)', s: 13 },
                { icon: '✦', label: '별숨의 종합사주', s: 14 },
                { icon: '🌟', label: '별숨의 종합 점성술', s: 16 },
                { icon: '📓', label: '나의 하루를 별숨에게', s: 17 },
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
              <li>
                <button className="sidebar-menu-item" onClick={() => { onAddOther && onAddOther(); onClose(); }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAddOther && onAddOther(); onClose(); } }}>
                  <span className="smi-icon" aria-hidden="true">👥</span>
                  <span className="smi-text">다른 사람의 별숨 추가</span>
                </button>
              </li>
              {user && (
                <li>
                  <button className="sidebar-menu-item" onClick={() => { onProfileOpen(); onClose(); }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onProfileOpen(); onClose(); } }}>
                    <span className="smi-icon" aria-hidden="true">⚙️</span>
                    <span className="smi-text">별숨에게 나를 알려주기</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-lbl">지난 이야기 ({histCount})</div>
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
                  : '아직 별숨과 나눈 이야기가 없어요 🌙\n첫 질문을 던져봐요'}
              </div>
            ) : (
              filtered.slice(0, 15).map(h => (
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
                  <button
                    className="shi-del"
                    onClick={e => del(h.id, e)}
                    aria-label="기록 삭제"
                    style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t4)', fontSize: 'var(--xs)', padding: '2px 4px', borderRadius: 4 }}
                  >✕</button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sidebar-foot">
          {user && onInvite && (
            <button className="sidebar-foot-btn" style={{ background: 'rgba(255,215,0,.08)', border: '1px solid var(--gold)', color: 'var(--gold)', marginBottom: 8 }} onClick={() => { onInvite(); onClose(); }}>
              🔗 친구 초대하기
            </button>
          )}
          {user && <button className="sidebar-foot-btn" onClick={() => { onKakaoLogout(); onClose(); }}>로그아웃</button>}
        </div>
      </nav>
    </>
  );
}

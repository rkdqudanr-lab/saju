import { useState } from 'react';
import { useUserCtx, useSajuCtx, useGamCtx } from '../../context/AppContext.jsx';
import { useAppStore } from '../../store/useAppStore.js';
import Mascot from '../Mascot.jsx';

const STREAK_BONUSES = [
  { day: 3, bonus: 30 },
  { day: 7, bonus: 100 },
  { day: 14, bonus: 100 },
  { day: 21, bonus: 100 },
  { day: 30, bonus: 300 },
];

export default function LandingHeader({
  onEditProfile,
  onLogout,
  bp,
  freeRechargeAvailable = true,
  onFreeRecharge,
  onStreakClick,
}) {
  const { user, form } = useUserCtx();
  const { saju, today } = useSajuCtx();
  const { gamificationState, missions = [] } = useGamCtx();
  const equippedAvatar = useAppStore((s) => s.equippedAvatar);

  const streak = gamificationState?.loginStreak ?? 0;
  const currentBp = bp ?? gamificationState?.currentBp ?? 0;
  const completedMissions = missions.filter((m) => m.is_completed).length;
  const totalMissions = missions.length;
  const nextStreakBonus = STREAK_BONUSES.find((item) => item.day > streak);
  const streakBonusText = nextStreakBonus && nextStreakBonus.day - streak <= 2
    ? `${nextStreakBonus.day - streak}일 뒤 +${nextStreakBonus.bonus}`
    : '';

  const [menuOpen, setMenuOpen] = useState(false);

  const ilgan = saju?.ilganPoetic || '';
  const dateLabel = today ? `${today.month}월 ${today.day}일` : '';
  const sub = [ilgan, dateLabel].filter(Boolean).join(' · ');

  return (
    <div className="lh-wrap">
      {/* 아바타 */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {equippedAvatar ? (
          <div className="lh-avatar-ph" style={{ fontSize: '1.3rem' }}>{equippedAvatar.emoji}</div>
        ) : user?.profileImage ? (
          <img className="lh-avatar" src={user.profileImage} alt="프로필" />
        ) : (
          <div className="lh-avatar-ph" style={{ padding: 0, overflow: 'hidden' }}>
            <Mascot
              mood="head"
              size={48}
              style={{ width: '118%', height: '118%', objectFit: 'contain', transform: 'translateY(2px)' }}
            />
          </div>
        )}
      </div>

      {/* 이름 + 서브 + 칩들 */}
      <div className="lh-info">
        <div className="lh-name">
          {form?.nickname || user?.nickname || '별숨'}
        </div>
        {sub && <div className="lh-sub">{sub}</div>}
        <div className="lh-chips">
          {streak >= 1 && (
            <span
              className="lh-chip streak"
              onClick={onStreakClick}
              style={onStreakClick ? { cursor: 'pointer' } : undefined}
              role={onStreakClick ? 'button' : undefined}
              tabIndex={onStreakClick ? 0 : undefined}
              onKeyDown={onStreakClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onStreakClick(); } : undefined}
            >
              <span className="lh-streak-num">{streak}일</span><span className="lh-streak-suffix"> 연속</span>
              {streakBonusText && <span className="lh-streak-next">{streakBonusText}</span>}
            </span>
          )}
          {totalMissions > 0 && (
            <span className={`lh-chip${completedMissions === totalMissions ? ' level' : ''}`}>
              ✅ {completedMissions}/{totalMissions} 미션
            </span>
          )}
          <button
            type="button"
            className="lh-chip bp"
            onClick={freeRechargeAvailable ? onFreeRecharge : undefined}
            title={freeRechargeAvailable ? '무료 충전 가능' : '오늘 충전 완료'}
            aria-label={`별숨 포인트 ${currentBp}점${freeRechargeAvailable ? ', 무료 충전 가능' : ''}`}
          >
            {currentBp} BP{freeRechargeAvailable ? ' 충전' : ''}
          </button>
        </div>
      </div>

      {/* 케밥 메뉴 (수정/로그아웃 격하) */}
      <div className="lh-actions" style={{ position: 'relative' }}>
        <button
          type="button"
          className="lh-kebab"
          aria-label="더보기 메뉴"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/>
          </svg>
        </button>
        {menuOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="lh-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={() => { setMenuOpen(false); onEditProfile(); }}
              >
                프로필 수정
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => { setMenuOpen(false); onLogout(); }}
              >
                로그아웃
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

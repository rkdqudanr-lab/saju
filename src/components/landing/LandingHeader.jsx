import { useUserCtx, useSajuCtx, useGamCtx } from '../../context/AppContext.jsx';
import { useAppStore } from '../../store/useAppStore.js';

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

  const ilgan = saju?.ilganPoetic || '';
  const dateLabel = today ? `${today.month}월 ${today.day}일` : '';
  const sub = [ilgan, dateLabel].filter(Boolean).join(' · ');

  return (
    <div className="lh-wrap">
      {/* 아바타 */}
      {equippedAvatar ? (
        <div className="lh-avatar-ph" style={{ fontSize: '1.3rem' }}>{equippedAvatar.emoji}</div>
      ) : user?.profileImage ? (
        <img className="lh-avatar" src={user.profileImage} alt="프로필" />
      ) : (
        <div className="lh-avatar-ph">🌙</div>
      )}

      {/* 이름 + 서브 + 칩들 */}
      <div className="lh-info">
        <div className="lh-name">
          {form?.nickname || user?.nickname || '별숨'}
          <span style={{ color: 'var(--gold)', marginLeft: 4 }}>✦</span>
        </div>
        {sub && <div className="lh-sub">{sub}</div>}
        <div className="lh-chips">
          {streak >= 1 && (
            <span className="lh-chip streak">
              🔥 {streak}일 연속
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
            ✦ {currentBp} BP{freeRechargeAvailable ? ' +' : ''}
          </button>
        </div>
      </div>

      {/* 수정 / 로그아웃 */}
      <div className="lh-actions">
        <button type="button" className="lh-action-btn" onClick={onEditProfile}>수정</button>
        <button type="button" className="lh-action-btn" onClick={onLogout}>로그아웃</button>
      </div>
    </div>
  );
}

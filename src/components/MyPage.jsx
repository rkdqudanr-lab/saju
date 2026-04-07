/**
 * MyPage — 마이페이지 (내 정보 대시보드)
 * 프로필 요약 / 수호자 대시보드 / 메뉴 리스트
 */

import GuardianLevelBadge from './GuardianLevelBadge.jsx';
import BPDisplay from './BPDisplay.jsx';

const PLAN_LABELS = {
  beta: '베타 무료 이용 중',
  basic: '기본 플랜',
  premium: '프리미엄 플랜',
};

function MenuRow({ icon, label, sub, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 0',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--line)',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--ff)',
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>{icon}</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 'var(--sm)', color: danger ? '#e05a3a' : 'var(--t1)', fontWeight: 500 }}>{label}</span>
        {sub && <span style={{ display: 'block', fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 2 }}>{sub}</span>}
      </span>
      {!danger && <span style={{ fontSize: 14, color: 'var(--t4)', flexShrink: 0 }}>›</span>}
    </button>
  );
}

export default function MyPage({
  user,
  form,
  saju,
  sun,
  gamificationState = { currentBp: 0, guardianLevel: 1, loginStreak: 0, todayMissionsDone: 0 },
  missions = [],
  profile,
  setStep,
  kakaoLogout,
  showToast,
}) {
  const { currentBp = 0, guardianLevel = 1 } = gamificationState;
  const nextLevelMissions = missions.filter(m => !m.completed).length;
  const totalMissions = missions.length || 15;

  const planLabel = PLAN_LABELS[profile?.plan] ?? PLAN_LABELS.beta;

  const ilgan = form?.by && saju?.ilganPoetic ? saju.ilganPoetic : null;
  const sunSign = sun?.sign ?? null;

  return (
    <div className="page step-fade" style={{ paddingBottom: 32 }}>
      {/* ── 헤더 ── */}
      <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          {user?.profileImage
            ? <img src={user.profileImage} alt="프로필" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }} />
            : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, border: '2px solid var(--line)' }}>🌙</div>
          }
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--md)', fontWeight: 700, color: 'var(--t1)', marginBottom: 3 }}>
              {user?.nickname ?? '별숨 유저'} <span style={{ color: 'var(--gold)' }}>✦</span>
            </div>
            {ilgan && (
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.5 }}>{ilgan}</div>
            )}
            {sunSign && (
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 2 }}>{sunSign}</div>
            )}
          </div>
        </div>

        <GuardianLevelBadge
          level={guardianLevel}
          nextLevelMissions={nextLevelMissions}
          totalMissionsToNextLevel={totalMissions}
        />
      </div>

      {/* ── 수호자 대시보드 ── */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: 'var(--bg2)' }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', letterSpacing: '.06em', fontWeight: 700, marginBottom: 12 }}>✦ 수호자 대시보드</div>

        {/* BP 현황 */}
        <BPDisplay
          currentBp={currentBp}
          maxBp={100}
          guardianLevel={guardianLevel}
        />

        {/* 현재 플랜 */}
        <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 'var(--r1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700 }}>현재 플랜</div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', marginTop: 2 }}>{planLabel}</div>
          </div>
          <span style={{ fontSize: 18 }}>⭐</span>
        </div>
      </div>

      {/* ── 메뉴 리스트 ── */}
      <div style={{ padding: '4px 20px 0' }}>
        <MenuRow
          icon="📝"
          label="내 사주 정보 수정"
          sub="생년월일·시간 등 기본 정보 변경"
          onClick={() => setStep(1)}
        />
        <MenuRow
          icon="🗓️"
          label="일기 모아보기"
          sub="별숨과 함께한 날들의 기록"
          onClick={() => setStep(20)}
        />
        <MenuRow
          icon="🎴"
          label="사주 명함 카드"
          sub="나의 사주를 카드로 보관·공유"
          onClick={() => setStep(21)}
        />
        <MenuRow
          icon="⚙️"
          label="앱 설정"
          sub="다크모드, 응답 스타일, 알림 등"
          onClick={() => setStep(19)}
        />
        <MenuRow
          icon="🚪"
          label="로그아웃"
          danger
          onClick={() => {
            if (typeof kakaoLogout === 'function') kakaoLogout();
          }}
        />
      </div>

      {/* ── 버전 표기 ── */}
      <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--t4)', padding: '24px 20px 8px', letterSpacing: '.04em' }}>
        별숨 Beta · 베타 기간 중 모든 기능 무료
      </div>
    </div>
  );
}

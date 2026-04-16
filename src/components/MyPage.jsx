/**
 * MyPage — 마이페이지 (내 정보 대시보드)
 * 프로필 요약 / 수호자 대시보드 / 메뉴 리스트
 */

import { useState } from 'react';
import GuardianLevelBadge from './GuardianLevelBadge.jsx';
import BPDisplay from './BPDisplay.jsx';
import { useAppStore } from '../store/useAppStore.js';
import { usePushNotification } from '../hooks/usePushNotification.js';

function InfoAccordion({ items }) {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div key={idx} style={{
            borderRadius: 'var(--r1)',
            border: '1px solid var(--line)',
            overflow: 'hidden',
            background: 'var(--bg1)',
          }}>
            <button
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '11px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--ff)', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 600 }}>
                {item.icon} {item.title}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--t4)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
            </button>
            {isOpen && (
              <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--line)' }}>
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BpGuideRow({ icon, text, bp }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 'var(--xs)', color: 'var(--t2)' }}>{text}</span>
      <span style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>{bp}</span>
    </div>
  );
}

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

const NOTIF_ITEMS = [
  { key: 'daily_horoscope', icon: '✦', label: '오늘의 별숨', sub: '매일 아침 8시, 오늘의 별 기운 알림' },
  { key: 'streak_reminder', icon: '◈', label: '스트릭 알림', sub: '연속 로그인이 끊길 위험할 때 알림' },
  { key: 'jeolgi_notice',   icon: '✧', label: '절기 알림', sub: '입춘·하지 등 특별한 날 알림' },
  { key: 'mission_reminder',icon: '◇', label: '미션 알림', sub: '저녁에 완료 안 한 미션 알림' },
  { key: 'birthday_notice', icon: '◇', label: '생일 알림', sub: '내 생일 당일 아침 특별 운세 알림' },
];

function NotifToggle({ item, value, onChange, disabled }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 0',
      borderBottom: '1px solid var(--line)',
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 500 }}>{item.label}</div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 2 }}>{item.sub}</div>
      </div>
      <button
        onClick={() => onChange(item.key)}
        disabled={disabled}
        aria-label={value ? '알림 끄기' : '알림 켜기'}
        style={{
          width: 44, height: 24, borderRadius: 12, flexShrink: 0,
          border: 'none', cursor: disabled ? 'default' : 'pointer',
          background: value ? 'var(--gold)' : 'var(--bg3)',
          position: 'relative', transition: 'background 0.2s',
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: value ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,.15)',
        }} />
      </button>
    </div>
  );
}

export default function MyPage({ onFreeRecharge = null, freeRechargeAvailable = true }) {
  const {
    user, profile, form,
    saju, sun,
    gamificationState,
    missions,
    setStep,
    kakaoLogout,
    setShowUpgradeModal,
  } = useAppStore();
  const { prefs, togglePref, supported: pushSupported, permissionState, loading: notifLoading } = usePushNotification();

  const safeGam = gamificationState ?? { currentBp: 0, guardianLevel: 1, loginStreak: 0 };
  const safeMissions = missions ?? [];
  const { currentBp = 0, guardianLevel = 1 } = safeGam;
  const nextLevelMissions = safeMissions.filter(m => !m.is_completed).length;
  const totalMissions = safeMissions.length || 15;

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
            : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: 'var(--gold)', border: '2px solid var(--line)' }}>✦</div>
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
          onFreeRecharge={onFreeRecharge}
          freeRechargeAvailable={freeRechargeAvailable}
        />

        {/* 현재 플랜 */}
        <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 'var(--r1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700 }}>현재 플랜</div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', marginTop: 2 }}>{planLabel}</div>
          </div>
          <span style={{ fontSize: 16, color: 'var(--gold)' }}>✦</span>
        </div>

        {/* 별숨 가이드 아코디언 */}
        <InfoAccordion items={[
          {
            icon: '✦',
            title: '별숨 포인트 쌓는 방법',
            content: (
              <div style={{ paddingTop: 8 }}>
                <BpGuideRow icon="✦" text="매일 첫 로그인" bp="+5 BP" />
                <BpGuideRow icon="◇" text="색상 처방 · 음식 처방 · 라이프 아이템 미션 완료" bp="+10 BP" />
                <BpGuideRow icon="◈" text="오늘의 실천 DO 미션 완료" bp="+5 BP" />
                <BpGuideRow icon="△" text="오늘의 주의 DONT 미션 완료" bp="+5 BP" />
                <BpGuideRow icon="◇" text="하루 미션 50% 이상 달성 보너스" bp="+5 BP" />
                <BpGuideRow icon="◇" text="오늘 일기 작성" bp="+5 BP" />
                <div style={{ marginTop: 8, fontSize: '11px', color: 'var(--t4)', lineHeight: 1.6 }}>
                  미션은 매일 오늘의 별숨 기운을 확인하면 자동 생성돼요.
                </div>
              </div>
            ),
          },
          {
            icon: '◈',
            title: '액막이란? · 수호자 시스템',
            content: (
              <div style={{ paddingTop: 8, fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.8 }}>
                <p style={{ margin: '0 0 8px' }}>
                  <strong style={{ color: 'var(--t1)' }}>액막이</strong>는 오늘의 별숨 점수가 50점 미만일 때 활성화되는 기능이에요.
                  나쁜 기운을 막고 하루를 보호해드려요.
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  액막이 발동에는 <strong style={{ color: 'var(--gold)' }}>20 BP</strong>가 소모돼요.
                  별숨픽 처방(색상·음식·장소)을 통해 부정적 기운을 긍정적 기운으로 전환해드려요.
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong style={{ color: 'var(--t1)' }}>수호자 시스템</strong>은 액막이를 누적할수록 레벨이 올라가는 성장 시스템이에요.
                </p>
                <div style={{ background: 'var(--bg3)', borderRadius: 6, padding: '8px 10px', fontSize: '11px', lineHeight: 1.8 }}>
                  <div>Lv1 · 초급 액막이사 → Lv2 · 중급 (미션 15개, 액막이 5회, 7일 연속)</div>
                  <div>Lv2 → Lv3 · 고급 (미션 30개, 액막이 10회, 14일 연속)</div>
                  <div>Lv3 → Lv4 · 마스터 (미션 50개, 액막이 20회)</div>
                  <div>Lv4 → Lv5 · 별숨의 수호자 (미션 100개, 액막이 50회)</div>
                </div>
              </div>
            ),
          },
          {
            icon: '◇',
            title: '별숨 포인트 사용법',
            content: (
              <div style={{ paddingTop: 8, fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>◈</span>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--t1)' }}>액막이 발동 — 20 BP</div>
                    <div style={{ marginTop: 2 }}>점수 50 미만인 날, 나쁜 기운을 막아드려요.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontSize: 18, flexShrink: 0, color: 'var(--t3)' }}>◈</span>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--t1)' }}>프리미엄 상담 — 준비 중</div>
                    <div style={{ marginTop: 2 }}>별숨 포인트로 심화 사주·별자리 상담을 이용할 수 있어요.</div>
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: '11px', color: 'var(--t4)' }}>
                  포인트는 최대 100 BP까지 보유할 수 있어요. 꾸준히 미션을 완료해 쌓아두세요.
                </div>
              </div>
            ),
          },
        ]} />
      </div>

      {/* ── 나의 성장 메뉴 ── */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 4 }}>✦ 나의 별숨</div>
        <MenuRow icon="✦" label="나의 별숨 (사주원국·별자리)" sub="일간·오행·태양·달·상승 별자리 해석" onClick={() => setStep(13)} />
        <MenuRow icon="◇" label="나의 대운 흐름" sub="10년 단위 대운 사이클 분석" onClick={() => setStep(30)} />
        <MenuRow icon="◈" label="사주 명함 카드" sub="나만의 사주 명함 만들기" onClick={() => setStep(21)} />
        <MenuRow icon="◈" label="별숨 타로" sub="타로 카드로 보는 오늘의 메시지" onClick={() => setStep(34)} />
        <MenuRow icon="◇" label="나의 별숨 통계" sub="운세 흐름·상담 패턴 분석" onClick={() => setStep(28)} />
      </div>

      {/* ── 메뉴 리스트 ── */}
      <div style={{ padding: '8px 20px 0' }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 4 }}>설정 및 기타</div>
        <MenuRow
          icon="✎"
          label="내 사주 정보 수정"
          sub="생년월일·시간 등 기본 정보 변경"
          onClick={() => setStep(1)}
        />
        <MenuRow
          icon="◈"
          label="별숨 광장"
          sub="별자리별 오늘 기운 한마디 나누기"
          onClick={() => setStep(29)}
        />
        <MenuRow
          icon="⚙️"
          label="앱 설정"
          sub="다크모드, 응답 스타일, 알림 등"
          onClick={() => setStep(19)}
        />
        <MenuRow
          icon="✧"
          label="문의하기"
          sub="버그 신고 · 기능 제안 · 고객 지원"
          onClick={() => setStep(22)}
        />
        <MenuRow
          icon="←"
          label="로그아웃"
          danger
          onClick={() => {
            if (typeof kakaoLogout === 'function') kakaoLogout();
          }}
        />
      </div>

      {/* ── 알림 설정 ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 12 }}>
          ✦ 알림 설정
        </div>
        {!pushSupported ? (
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', padding: '8px 0' }}>
            이 브라우저는 푸시 알림을 지원하지 않아요.
          </div>
        ) : permissionState === 'denied' ? (
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.6, padding: '8px 0' }}>
            브라우저에서 알림이 차단되어 있어요.<br />
            설정 → 알림에서 별숨 알림을 허용해주세요.
          </div>
        ) : (
          <div>
            {NOTIF_ITEMS.map(item => (
              <NotifToggle
                key={item.key}
                item={item}
                value={prefs[item.key]}
                onChange={togglePref}
                disabled={notifLoading}
              />
            ))}
            <div style={{ fontSize: '10px', color: 'var(--t4)', marginTop: 10, lineHeight: 1.6 }}>
              알림은 기기의 서비스 워커(PWA)를 통해 전송돼요.
              브라우저를 닫아도 알림을 받을 수 있어요.
            </div>
          </div>
        )}
      </div>

      {/* ── 버전 표기 ── */}
      <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--t4)', padding: '24px 20px 8px', letterSpacing: '.04em' }}>
        별숨 Beta · 베타 기간 중 모든 기능 무료
      </div>
    </div>
  );
}

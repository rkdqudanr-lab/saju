import { useState, useEffect, useRef, useCallback } from "react";
import DailyStarCardV2 from "../components/DailyStarCardV2.jsx";
import ShieldBlockModal from "../components/ShieldBlockModal.jsx";
import LuckyItemsCard from "../components/LuckyItemsCard.jsx";
import FeatureLoadingScreen from "../components/FeatureLoadingScreen.jsx";
import { detectBadtime } from "../utils/gamificationLogic.js";
import { useUserCtx, useSajuCtx, useGamCtx } from "../context/AppContext.jsx";
import { getAuthenticatedClient } from "../lib/supabase.js";

export default function DailyHoroscopePage({
  today,
  dailyResult, dailyLoading, dailyCount, DAILY_MAX,
  askDailyHoroscope,
  currentBp = 0,
  freeRechargeAvailable = false,
  freeRechargeTimeRemaining = null,
  onBlockBadtime = null,
  onRechargeFreeBP = null,
  onEarnBP = null,
  isBlockingBadtime = false,
  earnBP = null,
}) {
  const { user } = useUserCtx();
  const { saju = null } = useSajuCtx();
  const { gamificationState = {} } = useGamCtx();
  const [badtimeModal, setBadtimeModal] = useState({
    isOpen: false,
    badtime: null,
  });
  const [activeTab, setActiveTab] = useState('horoscope'); // 'horoscope' | 'lucky'
  const savedScoreDateRef = useRef(null);

  // 일별 점수 저장 (daily_scores 테이블)
  useEffect(() => {
    if (!dailyResult?.score || !user) return;
    const today = new Date().toISOString().slice(0, 10);
    if (savedScoreDateRef.current === today) return; // 같은 날 중복 방지
    savedScoreDateRef.current = today;
    const kakaoId = user.kakaoId || user.id;
    getAuthenticatedClient(kakaoId)
      .from('daily_scores')
      .upsert(
        { kakao_id: String(kakaoId), score_date: today, score: dailyResult.score },
        { onConflict: 'kakao_id,score_date' }
      )
      .then(({ error }) => { if (error) console.warn('[별숨] daily_scores upsert:', error); });
  }, [dailyResult?.score, user]);

  // 배드타임 감지 및 모달 표시
  useEffect(() => {
    if (dailyResult) {
      const score = dailyResult.score;
      // score가 없으면 감지하지 않음 (undefined || 0 fallback 방지)
      const badtime = (score !== null && score !== undefined)
        ? detectBadtime(score, dailyResult.text || '')
        : null;
      if (badtime) {
        setBadtimeModal({
          isOpen: true,
          badtime: badtime,
        });
      }
    }
  }, [dailyResult]);

  const handleBlockBadtime = async () => {
    if (onBlockBadtime) {
      await onBlockBadtime();
      setBadtimeModal({ isOpen: false, badtime: null });
    }
  };

  const handleRecharge = async () => {
    if (onRechargeFreeBP) {
      await onRechargeFreeBP();
    }
  };

  // 정화 재점 상태
  const [isPurifying, setIsPurifying] = useState(false);

  const handlePurify = useCallback(async () => {
    if (isPurifying || dailyLoading || dailyCount >= DAILY_MAX) return;
    setIsPurifying(true);
    const animPromise = new Promise(r => setTimeout(r, 1200));
    try {
      await Promise.all([askDailyHoroscope?.(), animPromise]);
    } catch {
      await animPromise;
    } finally {
      setIsPurifying(false);
    }
  }, [isPurifying, dailyLoading, dailyCount, DAILY_MAX, askDailyHoroscope]);

  // 로딩 중 → 풀스크린 로딩 화면
  if (dailyLoading && !isPurifying) {
    return <FeatureLoadingScreen type="daily" />;
  }

  return (
    <div className="page step-fade" style={{ position: 'relative' }}>
      {/* 정화 오버레이 */}
      {isPurifying && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          animation: 'purifyFadeIn 0.3s ease', pointerEvents: 'none',
        }}>
          <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #fff9c4, var(--gold))', boxShadow: '0 0 20px var(--gold), 0 0 40px rgba(200,160,80,0.4)', animation: 'purifyOrbPulse 1s ease-in-out infinite' }} />
            {[44, 62, 80].map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: s, height: s, borderRadius: '50%', border: '1.5px solid var(--gold)', animation: `purifyRingExpand 1.6s ease-out ${i * 0.35}s infinite` }} />
            ))}
          </div>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.1em', animation: 'purifyTextBlink 1.2s ease-in-out infinite' }}>
            정화 중...
          </div>
        </div>
      )}
      <div className="inner" style={{ paddingTop: 16, paddingBottom: 40, filter: isPurifying ? 'blur(4px)' : 'none', transition: 'filter 0.4s', pointerEvents: isPurifying ? 'none' : 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '1.4rem', marginBottom: 8, color: 'var(--gold)' }}>✦</div>
          <div style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
            오늘 하루 나의 별숨
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
            {today.month}월 {today.day}일 · 매일 새로워져요
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
            borderBottom: '1px solid #eee',
          }}
        >
          <button
            onClick={() => setActiveTab('horoscope')}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'horoscope' ? '2px solid var(--gold)' : 'none',
              color: activeTab === 'horoscope' ? 'var(--gold)' : 'var(--t4)',
              cursor: 'pointer',
              fontWeight: activeTab === 'horoscope' ? '600' : '400',
              fontSize: '13px',
            }}
          >
            오늘의 운세
          </button>
          <button
            onClick={() => setActiveTab('lucky')}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'lucky' ? '2px solid var(--gold)' : 'none',
              color: activeTab === 'lucky' ? 'var(--gold)' : 'var(--t4)',
              cursor: 'pointer',
              fontWeight: activeTab === 'lucky' ? '600' : '400',
              fontSize: '13px',
            }}
          >
            🍀 행운 아이템
          </button>
        </div>

        {/* 운세 탭 */}
        {activeTab === 'horoscope' && (
          <>
            {dailyResult ? (
              <>
                <DailyStarCardV2 result={dailyResult} />
                {dailyCount < DAILY_MAX ? (
                  <button
                    className="cta-main"
                    style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px', marginTop: 12, background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 }}
                    onClick={handlePurify}
                    disabled={isPurifying || dailyLoading}
                  >
                    <span style={{ animation: isPurifying ? 'purifyBtnGlow 1s infinite' : 'none' }}>✦</span>
                    정화 재점
                    <span style={{ fontSize: 10, opacity: 0.7 }}>({DAILY_MAX - dailyCount}/{DAILY_MAX})</span>
                  </button>
                ) : (
                  <div style={{ textAlign: 'center', fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 12 }}>
                    오늘 별숨을 모두 읽었어요 · 내일 다시 만나요
                  </div>
                )}
              </>
            ) : (
              <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px' }} onClick={askDailyHoroscope}>
                오늘 기운 확인하기 ✦
              </button>
            )}
          </>
        )}

        {/* 행운 아이템 탭 */}
        {activeTab === 'lucky' && (
          <LuckyItemsCard today={today} saju={saju} dailyResult={dailyResult} />
        )}
      </div>

      {/* 배드타임 액막이 모달 */}
      <ShieldBlockModal
        isOpen={badtimeModal.isOpen}
        symptom={badtimeModal.badtime?.symptom}
        currentBp={currentBp}
        cost={badtimeModal.badtime?.cost || 20}
        freeRechargeAvailable={freeRechargeAvailable}
        freeRechargeTimeRemaining={freeRechargeTimeRemaining}
        onBlock={handleBlockBadtime}
        onClose={() => setBadtimeModal({ isOpen: false, badtime: null })}
        onRecharge={handleRecharge}
        isBlocking={isBlockingBadtime}
      />
    </div>
  );
}

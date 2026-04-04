import { useState, useEffect } from "react";
import DailyStarCard from "../components/DailyStarCard.jsx";
import ShieldBlockModal from "../components/ShieldBlockModal.jsx";
import { detectBadtime } from "../utils/gamificationLogic.js";

export default function DailyHoroscopePage({
  today,
  dailyResult, dailyLoading, dailyCount, DAILY_MAX,
  askDailyHoroscope,
  // 게이미피케이션 props
  gamificationState = {},
  currentBp = 0,
  freeRechargeAvailable = false,
  freeRechargeTimeRemaining = null,
  onBlockBadtime = null,
  onRechargeFreeBP = null,
  isBlockingBadtime = false,
}) {
  const [badtimeModal, setBadtimeModal] = useState({
    isOpen: false,
    badtime: null,
  });

  // 배드타임 감지 및 모달 표시
  useEffect(() => {
    if (dailyResult) {
      const badtime = detectBadtime(dailyResult.score || 0, dailyResult.text || '');
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

  return (
    <div className="page step-fade">
      <div className="inner" style={{ paddingTop: 16, paddingBottom: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🌟</div>
          <div style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
            오늘 하루 나의 별숨
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
            {today.month}월 {today.day}일 · 매일 새로워져요
          </div>
        </div>
        {dailyLoading ? (
          <div className="dsc-loading-btn">
            <span>별숨이 오늘을 읽고 있어요</span>
            <span className="dsc-loading-dot" /><span className="dsc-loading-dot" /><span className="dsc-loading-dot" />
          </div>
        ) : dailyResult ? (
          <>
            <DailyStarCard result={dailyResult} />
            {dailyCount < DAILY_MAX ? (
              <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px', marginTop: 12, background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)' }} onClick={askDailyHoroscope}>
                다시 물어보기 ✦ ({dailyCount}/{DAILY_MAX})
              </button>
            ) : (
              <div style={{ textAlign: 'center', fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 12 }}>
                오늘 별숨을 모두 읽었어요 · 내일 다시 만나요 🌙
              </div>
            )}
          </>
        ) : (
          <button className="cta-main" style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px' }} onClick={askDailyHoroscope}>
            오늘 기운 확인하기 ✦
          </button>
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

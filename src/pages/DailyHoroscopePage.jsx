import { useState, useEffect } from "react";
import DailyStarCard from "../components/DailyStarCard.jsx";
import ShieldBlockModal from "../components/ShieldBlockModal.jsx";
import OrbitalFrequencyMiniGame from "../components/OrbitalFrequencyMiniGame.jsx";
import LuckyItemsCard from "../components/LuckyItemsCard.jsx";
import { detectBadtime } from "../utils/gamificationLogic.js";
import { useUserCtx, useSajuCtx, useGamCtx } from "../context/AppContext.jsx";

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
  const [activeTab, setActiveTab] = useState('horoscope'); // 'horoscope' | 'game' | 'lucky'

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
            🌟 오늘의 운세
          </button>
          <button
            onClick={() => setActiveTab('game')}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'game' ? '2px solid var(--gold)' : 'none',
              color: activeTab === 'game' ? 'var(--gold)' : 'var(--t4)',
              cursor: 'pointer',
              fontWeight: activeTab === 'game' ? '600' : '400',
              fontSize: '13px',
            }}
          >
            🎲 행운 번호
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
          </>
        )}

        {/* 게임 탭 */}
        {activeTab === 'game' && (
          <OrbitalFrequencyMiniGame
            kakaoId={user?.id}
            currentBp={currentBp}
            onEarnBP={earnBP}
            onUnlock={earnBP}
          />
        )}

        {/* 행운 아이템 탭 */}
        {activeTab === 'lucky' && (
          <LuckyItemsCard today={today} saju={saju} />
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

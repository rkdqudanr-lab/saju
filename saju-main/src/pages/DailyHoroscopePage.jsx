import { useState, useEffect } from "react";
import DailyStarCardV2 from "../components/DailyStarCardV2.jsx";
import ShieldBlockModal from "../components/ShieldBlockModal.jsx";
import OrbitalFrequencyMiniGame from "../components/OrbitalFrequencyMiniGame.jsx";
import { detectBadtime } from "../utils/gamificationLogic.js";

export default function DailyHoroscopePage({
  today,
  dailyResult, dailyLoading, dailyCount, DAILY_MAX,
  askDailyHoroscope,
  // 게이미피케이션 props
  user = null,
  gamificationState = {},
  currentBp = 0,
  freeRechargeAvailable = false,
  freeRechargeTimeRemaining = null,
  onBlockBadtime = null,
  onRechargeFreeBP = null,
  onEarnBP = null,
  isBlockingBadtime = false,
  earnBP = null, // useGamification.earnBP
}) {
  const [badtimeModal, setBadtimeModal] = useState({
    isOpen: false,
    badtime: null,
  });
  const [activeTab, setActiveTab] = useState('horoscope'); // 'horoscope' | 'game'

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
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 800, letterSpacing: '0.2em', marginBottom: 12, textTransform: 'uppercase' }}>
            DAILY ORBIT
          </div>
          <div style={{ fontSize: 'var(--xl)', fontWeight: 800, color: 'var(--t1)', marginBottom: 8, letterSpacing: '-0.02em' }}>
            {today.month}월 {today.day}일의 별숨
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', fontWeight: 500 }}>
            당신을 향한 오늘의 주파수를 읽어보세요
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: 'var(--bg-glass)',
            padding: '4px',
            borderRadius: 16,
            border: '0.5px solid var(--line)',
            marginBottom: 32,
            backdropFilter: 'blur(10px)',
          }}
        >
          {[
            { id: 'horoscope', label: 'Horoscope', icon: '🌟' },
            { id: 'game', label: 'Lucky Number', icon: '🎰' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 0',
                background: activeTab === tab.id ? 'var(--gold-grad)' : 'transparent',
                border: 'none',
                borderRadius: 12,
                color: activeTab === tab.id ? '#000' : 'var(--t4)',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 'var(--xxs)',
                fontFamily: 'var(--ff-inter)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {tab.label}
            </button>
          ))}
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
                <DailyStarCardV2 
                  result={dailyResult} 
                  currentBp={currentBp}
                  onBlockBadtime={onBlockBadtime}
                  isBlocking={isBlockingBadtime}
                />
                {dailyCount < DAILY_MAX ? (
                  <button 
                    className="res-top-btn shimmer" 
                    style={{ 
                      width: '100%', 
                      justifyContent: 'center', 
                      borderRadius: 12, 
                      padding: '16px', 
                      marginTop: 20, 
                      background: 'var(--bg-glass-heavy)', 
                      border: '0.5px solid var(--gold)', 
                      color: 'var(--gold)',
                      fontWeight: 800,
                      fontSize: 'var(--xs)',
                      fontFamily: 'var(--ff-inter)',
                      letterSpacing: '0.05em'
                    }} 
                    onClick={askDailyHoroscope}
                  >
                    RE-READ ORBIT ({dailyCount}/{DAILY_MAX})
                  </button>
                ) : (
                  <div style={{ textAlign: 'center', fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 24, fontWeight: 500 }}>
                    오늘의 운세를 모두 확인했습니다. 내일 만나요 🌙
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

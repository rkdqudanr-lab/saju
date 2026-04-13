import React from 'react';

export default function GuardianLevelBadge({
  level = 1,
  nextLevelMissions = 0,
  totalMissionsToNextLevel = 15,
  className = '',
}) {
  const levelLabels = {
    1: '초급 액막이사',
    2: '중급 액막이사',
    3: '고급 액막이사',
    4: '마스터 액막이사',
    5: '별숨의 수호자',
  };

  const label = levelLabels[level] || '초급 액막이사';
  const isMaxLevel = level >= 5;
  const progress = isMaxLevel ? 100 : Math.min(100, ((totalMissionsToNextLevel - nextLevelMissions) / totalMissionsToNextLevel) * 100);

  return (
    <div className={`card ${className} stellar-glass`} style={{ padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div className="gam-lvl stellar-label" style={{ fontSize: 'var(--md)', fontWeight: 800 }}>
          Lv.{level} <span style={{ color: 'var(--t3)', fontWeight: 400, marginLeft: 4 }}>|</span> <span style={{ color: 'var(--gold)', marginLeft: 4 }}>{label}</span>
        </div>
        {isMaxLevel && <span className="shimmer-gold" style={{ fontSize: '20px' }}>✨</span>}
      </div>

      {!isMaxLevel ? (
        <div className="gam-item gam-mission" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--xs)', marginBottom: '8px', color: 'var(--t2)' }}>
            <span>다음 레벨까지</span>
            <strong style={{ color: 'var(--gold)' }}>{nextLevelMissions} 미션 남음</strong>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--line)' }}>
            <div
              className="shimmer"
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'var(--gold-grad)',
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 10px var(--gold-glow)',
              }}
            />
          </div>
        </div>
      ) : (
        <div className="shimmer-gold" style={{ fontSize: 'var(--sm)', color: 'var(--gold)', fontWeight: '700', textAlign: 'center', padding: '10px', background: 'var(--goldf)', borderRadius: 'var(--r1)' }}>
          최고 레벨 달성! 주간 보너스 100 BP 획득 ✦
        </div>
      )}
    </div>
  );
}

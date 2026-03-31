import DailyStarCard from "../components/DailyStarCard.jsx";

export default function DailyHoroscopePage({
  today,
  dailyResult, dailyLoading, dailyCount, DAILY_MAX,
  askDailyHoroscope,
}) {
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
    </div>
  );
}

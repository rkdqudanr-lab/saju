import { useEffect, useRef, useState } from 'react';
import '../styles/TodayIntroPage.css';

/**
 * TodayIntroPage - "오늘의 별숨" 인트로 페이지
 * 로그인 후 첫 진입점
 */
export default function TodayIntroPage({ setStep, askDailyHoroscope, dailyLoading = false, dailyResult }) {
  const [today, setToday] = useState('');
  const [error, setError] = useState(false);
  const asked = useRef(false);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    setToday(`${year}년 ${month}월 ${date}일 (${days[now.getDay()]})`);
  }, []);

  // 이미 오늘 운세를 물어봤으면 메인으로 이동 (캐시 로딩이 비동기라 [dailyResult]로 감시)
  useEffect(() => {
    if (dailyResult && !asked.current) setStep(0);
  }, [dailyResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKnowMore = async () => {
    if (dailyLoading) return;
    setError(false);
    asked.current = true;
    try {
      if (askDailyHoroscope) await askDailyHoroscope();
      setStep(23);
    } catch {
      setError(true);
    }
  };

  return (
    <div className="today-intro-container">
      {/* 별빛 배경 */}
      <div className="today-intro-bg" aria-hidden="true">
        <div className="today-intro-star" />
        <div className="today-intro-star" />
        <div className="today-intro-star" />
        <div className="today-intro-star" />
        <div className="today-intro-star" />
        <div className="today-intro-star" />
      </div>

      <div className="today-intro-content">
        {/* Orb 아이콘 */}
        <div className="today-intro-orb" aria-hidden="true">
          <div className="today-intro-orb-core" />
          <div className="today-intro-orb-r1" />
          <div className="today-intro-orb-r2" />
        </div>

        {/* 날짜 */}
        <div className="today-intro-date">{today}</div>

        {/* 메인 메시지 */}
        <div className="today-intro-message">
          <p className="today-intro-msg-main">별숨이 오늘을 읽고 있어요</p>
          <p className="today-intro-msg-sub">사주와 별자리로 오늘 하루를 함께 바라봐요</p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="today-intro-error" role="alert">
            별이 잠시 쉬고 있어요<br />
            잠시 후 다시 시도해봐요.
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="today-intro-buttons">
          <button
            className="today-intro-btn-primary"
            onClick={handleKnowMore}
            disabled={dailyLoading}
          >
            {dailyLoading ? '별숨이 오늘을 읽고 있어요...' : '오늘의 운세 알아보기 ✦'}
          </button>
          <button
            className="today-intro-btn-secondary"
            onClick={() => setStep(0)}
          >
            나중에 볼게요
          </button>
        </div>
      </div>
    </div>
  );
}

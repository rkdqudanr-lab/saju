import { useEffect, useState } from 'react';
import '../styles/TodayIntroPage.css';

/**
 * TodayIntroPage - "오늘의 별숨" 인트로 페이지
 * 로그인 후 첫 진입점
 * 사용자에게 앱의 핵심 가치(오늘의 운세)를 명확히 전달
 */
export default function TodayIntroPage({ setStep, askDailyHoroscope, dailyLoading = false }) {
  const [today, setToday] = useState('');

  const handleKnowMore = async () => {
    // 운세 데이터를 로드한 후 상세 페이지로 이동
    if (askDailyHoroscope && !dailyLoading) {
      try {
        await askDailyHoroscope();
      } catch (error) {
        console.error('운세 로드 실패:', error);
      }
    }
    setStep(23);
  };

  useEffect(() => {
    // 현재 날짜 및 요일 설정
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();

    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = days[now.getDay()];

    setToday(`${year}년 ${month}월 ${date}일 (${dayName})`);
  }, []);

  return (
    <div className="today-intro-container">
      {/* 배경 애니메이션 (선택) */}
      <div className="today-intro-bg">
        <div className="star-animation">✨</div>
      </div>

      <div className="today-intro-content">
        {/* 코즈믹 오브 (애니메이션) */}
        <div className="today-intro-icon">
          <div className="star-icon"></div>
        </div>

        {/* 날짜 표시 */}
        <div className="today-intro-date">
          {today}
        </div>

        {/* 메인 메시지 */}
        <div className="today-intro-message">
          <p className="message-line-1">우주의 주파수가 당신을 향해</p>
          <p className="message-line-2">새로운 길을 열어주고 있습니다 ✦</p>
        </div>

        {/* CTA 버튼 영역 */}
        <div className="today-intro-buttons">
          <button
            className="btn-primary today-intro-btn-know-more"
            onClick={handleKnowMore}
            disabled={dailyLoading}
          >
            {dailyLoading ? '별숨이 읽고 있어요...' : '오늘의 별숨 읽기'}
          </button>
          <button
            className="btn-secondary today-intro-btn-later"
            onClick={() => setStep(0)}
          >
            탐색 계속하기
          </button>
        </div>
      </div>
    </div>
  );
}

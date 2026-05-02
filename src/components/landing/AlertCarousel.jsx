/**
 * AlertCarousel — 메인 화면 조건부 알림 가로 스크롤 캐러셀
 * 절기, 추정모드, 생일 D-Day, 어제 reflection 미응답을 하나로 모음
 */

function AlertCard({ icon, title, desc, gold = false, onClick }) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`alert-card${gold ? ' gold' : ''}${onClick ? ' clickable' : ''}`}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      aria-label={onClick ? `${title}: ${desc}` : undefined}
    >
      <span className="alert-card-icon">{icon}</span>
      <div className="alert-card-body">
        <div className="alert-card-title">{title}</div>
        <div className="alert-card-desc">{desc}</div>
      </div>
    </div>
  );
}

export default function AlertCarousel({
  isApproximate = false,
  jeolgi = null,          // { name, meaning, diffDays }
  birthdays = [],         // [{ label, dday }] dday <= 30
  onApproximate,          // () => void — 프로필 수정으로 이동
  onJeolgi,              // () => void — 별숨달력으로 이동
}) {
  const cards = [];

  // 1) 추정 모드 (프로필 미완성)
  if (isApproximate) {
    cards.push(
      <AlertCard
        key="approx"
        icon="✦"
        title="프로필 완성률 50%"
        desc="생일 일자를 추가하면 더 정확한 별숨을 받아요"
        gold
        onClick={onApproximate}
      />,
    );
  }

  // 2) 절기 배너
  if (jeolgi) {
    const isToday = jeolgi.diffDays <= 0;
    cards.push(
      <AlertCard
        key="jeolgi"
        icon={isToday ? '✦' : '◇'}
        title={isToday ? `오늘은 ${jeolgi.name}` : `${jeolgi.diffDays}일 후 ${jeolgi.name}`}
        desc={jeolgi.meaning}
        gold={isToday}
        onClick={onJeolgi}
      />,
    );
  }

  // 3) 생일 D-Day
  birthdays.forEach((b, i) => {
    const isToday = b.dday === 0;
    cards.push(
      <AlertCard
        key={`bday-${i}`}
        icon={isToday ? '🎂' : '🎁'}
        title={isToday ? `${b.label}의 생일이에요!` : `${b.label} 생일 D-${b.dday}`}
        desc={isToday ? '오늘이 바로 그날이에요 🎉' : `${b.dday}일 남았어요`}
        gold={isToday}
      />,
    );
  });

  if (!cards.length) return null;

  return (
    <div className="alert-carousel" role="region" aria-label="알림">
      {cards}
    </div>
  );
}

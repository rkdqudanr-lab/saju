import { useMemo } from "react";

// 오늘의 미니 운세 시드 생성 (날짜 기반 결정론적)
function dailySeed(day, signIdx) {
  return ((day * 31 + signIdx * 7) % 100);
}

const SIGNS = [
  { s: "♈", n: "양자리",    en: "Aries",       months: [[3,21],[4,19]] },
  { s: "♉", n: "황소자리",  en: "Taurus",      months: [[4,20],[5,20]] },
  { s: "♊", n: "쌍둥이자리",en: "Gemini",      months: [[5,21],[6,20]] },
  { s: "♋", n: "게자리",    en: "Cancer",      months: [[6,21],[7,22]] },
  { s: "♌", n: "사자자리",  en: "Leo",         months: [[7,23],[8,22]] },
  { s: "♍", n: "처녀자리",  en: "Virgo",       months: [[8,23],[9,22]] },
  { s: "♎", n: "천칭자리",  en: "Libra",       months: [[9,23],[10,22]] },
  { s: "♏", n: "전갈자리",  en: "Scorpio",     months: [[10,23],[11,21]] },
  { s: "♐", n: "사수자리",  en: "Sagittarius", months: [[11,22],[12,21]] },
  { s: "♑", n: "염소자리",  en: "Capricorn",   months: [[12,22],[1,19]] },
  { s: "♒", n: "물병자리",  en: "Aquarius",    months: [[1,20],[2,18]] },
  { s: "♓", n: "물고기자리",en: "Pisces",      months: [[2,19],[3,20]] },
];

const MINI_PHRASES = [
  ["오늘 별이 당신 편이에요 ✨", "뜻밖의 인연이 찾아와요 💫", "직관을 믿어봐요 🌟"],
  ["잠시 쉬어가도 괜찮아요 🌙", "감정을 솔직하게 표현해봐요 💬", "소중한 사람에게 먼저 연락해봐요 📱"],
  ["새로운 도전이 빛날 날이에요 🔥", "재물운이 살짝 미소 짓고 있어요 💰", "용기 있는 한 걸음이 큰 변화를 만들어요 🚀"],
];

/**
 * @param {{ today: { month: number, day: number } }} props
 */
export default function ZodiacSlot({ today, onQuickAsk }) {
  const phrases = useMemo(() => {
    return SIGNS.map((sign, i) => {
      const seed = dailySeed(today.day, i);
      const phraseSet = MINI_PHRASES[seed % MINI_PHRASES.length];
      const phrase = phraseSet[i % phraseSet.length];
      const luck = seed > 66 ? 'high' : seed > 33 ? 'mid' : 'low';
      return { ...sign, phrase, luck };
    });
  }, [today.day]);

  return (
    <div className="zodiac-slot">
      <div className="zodiac-slot-title">✦ 오늘의 12별자리</div>
      <div className="zodiac-slot-sub">클릭하면 해당 별자리로 바로 상담할 수 있어요</div>
      <div className="zodiac-slot-grid">
        {phrases.map((sign, i) => (
          <button
            key={i}
            className={`zs-card zs-luck-${sign.luck}`}
            onClick={() => onQuickAsk(sign.n)}
            aria-label={`${sign.n} 빠른 상담`}
          >
            <div className="zs-symbol">{sign.s}</div>
            <div className="zs-name">{sign.n}</div>
            <div className="zs-phrase">{sign.phrase}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

import { useCallback, useMemo, useState } from 'react';
import Mascot from '../Mascot.jsx';
import { useAppStore } from '../../store/useAppStore.js';
import { getStage, getNextStage, getStageIndex } from '../../utils/growthStages.js';
import { getDailyDateKey } from '../../lib/dailyDataAccess.js';

// 성장 단계별 별숨이 크기 — 단계가 오를수록 조금씩 커진다 ("점점 커가는 모습")
const STAGE_SIZES = [60, 68, 76, 84, 92];

// 먹이를 줬을 때 나오는 한 줄 반응 (절제된 톤)
const FEED_LINES = [
  '별숨이가 기분 좋게 기지개를 켰어요',
  '오늘도 별숨이와 교감했어요',
  '별숨이의 빛이 한층 또렷해졌어요',
  '별숨이가 당신 곁에 머물러요',
];

const SPECIAL_LINE = '특별한 간식에 별숨이가 반짝 빛났어요';

function localFlag(kakaoId, suffix) {
  return `byeolsoom_pet_${suffix}_${kakaoId || 'guest'}_${getDailyDateKey()}`;
}

export default function PetMascot({ onSpecialFeed, specialFeedCost = 5 }) {
  const totalMissions = useAppStore((s) => s.gamificationState?.totalMissionsCompleted ?? 0);
  const currentBp = useAppStore((s) => s.gamificationState?.currentBp ?? 0);
  const showToast = useAppStore((s) => s.showToast);
  const kakaoId = useAppStore((s) => s.user?.kakaoId || s.user?.id);

  const stage = useMemo(() => getStage(totalMissions), [totalMissions]);
  const next = useMemo(() => getNextStage(totalMissions), [totalMissions]);
  const stageIndex = useMemo(() => getStageIndex(totalMissions), [totalMissions]);
  const size = STAGE_SIZES[stageIndex] || STAGE_SIZES[0];

  const progress = next
    ? ((totalMissions - stage.minMissions) / (next.minMissions - stage.minMissions)) * 100
    : 100;

  const [fed, setFed] = useState(() => {
    try { return localStorage.getItem(localFlag(kakaoId, 'fed')) === '1'; } catch { return false; }
  });
  const [specialFed, setSpecialFed] = useState(() => {
    try { return localStorage.getItem(localFlag(kakaoId, 'special')) === '1'; } catch { return false; }
  });
  const [reaction, setReaction] = useState('');
  const [burst, setBurst] = useState(false);
  const [busy, setBusy] = useState(false);

  const triggerBurst = useCallback(() => {
    setBurst(false);
    requestAnimationFrame(() => setBurst(true));
    window.setTimeout(() => setBurst(false), 900);
  }, []);

  const handleFeed = useCallback(() => {
    if (fed) return;
    setFed(true);
    try { localStorage.setItem(localFlag(kakaoId, 'fed'), '1'); } catch {}
    setReaction(FEED_LINES[Math.floor(Math.random() * FEED_LINES.length)]);
    triggerBurst();
  }, [fed, kakaoId, triggerBurst]);

  const handleSpecialFeed = useCallback(async () => {
    if (specialFed || busy) return;
    if (!onSpecialFeed) return;
    if (currentBp < specialFeedCost) {
      showToast?.('BP가 부족해요 😢');
      return;
    }
    setBusy(true);
    try {
      const result = await onSpecialFeed(specialFeedCost, 'pet_special_feed');
      if (result?.success) {
        setSpecialFed(true);
        setFed(true);
        try {
          localStorage.setItem(localFlag(kakaoId, 'special'), '1');
          localStorage.setItem(localFlag(kakaoId, 'fed'), '1');
        } catch {}
        setReaction(SPECIAL_LINE);
        triggerBurst();
        showToast?.(`✨ 특별 간식 -${specialFeedCost} BP`);
      } else {
        showToast?.(result?.message || 'BP가 부족해요 😢');
      }
    } finally {
      setBusy(false);
    }
  }, [specialFed, busy, onSpecialFeed, currentBp, specialFeedCost, kakaoId, showToast, triggerBurst]);

  const mood = specialFed ? 'celebrate' : fed ? 'love' : 'peek';
  const caption = reaction
    || (fed ? '오늘 교감을 마쳤어요' : '별숨이가 당신을 기다려요');

  return (
    <div className="pet-mascot" style={{ '--pet-color': stage.color }}>
      <button
        type="button"
        className={`pet-mascot-figure${fed ? ' is-fed' : ''}${burst ? ' is-burst' : ''}`}
        onClick={handleFeed}
        disabled={fed}
        aria-label={fed ? '오늘 먹이를 이미 줬어요' : '별숨이에게 먹이 주기'}
      >
        <span className="pet-mascot-ring" aria-hidden="true" />
        <Mascot mood={mood} size={size} float />
        <span className="pet-mascot-sparkle" aria-hidden="true"></span>
      </button>

      <div className="pet-mascot-stage">
        <span className="pet-mascot-stage-name">{stage.label}</span>
        {next && (
          <span className="pet-mascot-stage-meta">
            다음 단계까지 미션 {next.minMissions - totalMissions}개
          </span>
        )}
      </div>

      <div className="pet-mascot-bar" aria-hidden="true">
        <span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
      </div>

      <div className="pet-mascot-caption">{caption}</div>

      <div className="pet-mascot-actions">
        <button
          type="button"
          className="pet-mascot-feed"
          onClick={handleFeed}
          disabled={fed}
        >
          {fed ? '먹이 완료' : '먹이 주기'}
        </button>
        {onSpecialFeed && (
          <button
            type="button"
            className="pet-mascot-feed pet-mascot-feed--special"
            onClick={handleSpecialFeed}
            disabled={specialFed || busy}
          >
            {specialFed ? '특별 간식 완료' : `특별 간식 ${specialFeedCost} BP`}
          </button>
        )}
      </div>
    </div>
  );
}

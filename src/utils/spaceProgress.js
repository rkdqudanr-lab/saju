const BASE_DUST_PER_HOUR = 6;
const MAX_BANK_HOURS = 8;

export function getSpaceProgressKey(kakaoId) {
  return `byeolsoom_space_progress_${kakaoId || 'guest'}`;
}

export function createDefaultSpaceProgress(now = Date.now()) {
  return {
    stardust: 120,
    lastClaimAt: now,
    totalClaimed: 0,
  };
}

export function readSpaceProgress(kakaoId) {
  try {
    const saved = JSON.parse(localStorage.getItem(getSpaceProgressKey(kakaoId)) || 'null');
    if (!saved || typeof saved !== 'object') return createDefaultSpaceProgress();
    return {
      ...createDefaultSpaceProgress(),
      ...saved,
      stardust: Number.isFinite(Number(saved.stardust)) ? Number(saved.stardust) : 120,
      lastClaimAt: Number.isFinite(Number(saved.lastClaimAt)) ? Number(saved.lastClaimAt) : Date.now(),
      totalClaimed: Number.isFinite(Number(saved.totalClaimed)) ? Number(saved.totalClaimed) : 0,
    };
  } catch {
    return createDefaultSpaceProgress();
  }
}

export function saveSpaceProgress(kakaoId, progress) {
  try {
    localStorage.setItem(getSpaceProgressKey(kakaoId), JSON.stringify(progress));
  } catch {}
}

export function getClaimableStardust(progress, now = Date.now()) {
  const elapsedMs = Math.max(0, now - Number(progress?.lastClaimAt || now));
  const bankedHours = Math.min(MAX_BANK_HOURS, elapsedMs / 3600000);
  return Math.floor(bankedHours * BASE_DUST_PER_HOUR);
}

export function claimStardust(progress, now = Date.now()) {
  const amount = getClaimableStardust(progress, now);
  if (amount <= 0) return { nextProgress: progress, amount: 0 };
  return {
    amount,
    nextProgress: {
      ...progress,
      stardust: Number(progress.stardust || 0) + amount,
      totalClaimed: Number(progress.totalClaimed || 0) + amount,
      lastClaimAt: now,
    },
  };
}

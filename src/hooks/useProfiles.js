// ═══════════════════════════════════════════════════════
//  👥 멀티 프로필 훅  (최대 4개: 나 + 다른 사람 3명)
//  이재원(네이버 UX) · 이소연(상담심리) 설계
// ═══════════════════════════════════════════════════════
import { useState, useCallback } from "react";

const PROFILES_KEY = "byeolsoom_profiles";

export const EMPTY_FORM = {
  name:"", by:"", bm:"", bd:"", bh:"", gender:"", noTime:false
};

function load() {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function save(profiles) {
  try { localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); } catch {}
}

export function useProfiles() {
  // profiles[0] = 나 (메인), profiles[1~3] = 다른 사람
  const [profiles, setProfilesState] = useState(() => {
    const saved = load();
    if (saved) return saved;
    // 구버전 호환: byeolsoom_profile 마이그레이션
    try {
      const legacy = localStorage.getItem("byeolsoom_profile");
      if (legacy) {
        const p = JSON.parse(legacy);
        return [{ ...EMPTY_FORM, ...p, isMe: true }, null, null, null];
      }
    } catch {}
    return [{ ...EMPTY_FORM, isMe: true }, null, null, null];
  });

  // 현재 활성 프로필 인덱스 (0=나, 1~3=다른 사람)
  const [activeIdx, setActiveIdx] = useState(0);

  const setProfiles = useCallback((updater) => {
    setProfilesState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      save(next);
      return next;
    });
  }, []);

  const updateProfile = useCallback((idx, data) => {
    setProfiles(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...data };
      return next;
    });
  }, [setProfiles]);

  const addOtherProfile = useCallback((data) => {
    setProfiles(prev => {
      const next = [...prev];
      // 비어있는 슬롯(1~3) 찾기
      const slot = next.findIndex((p, i) => i > 0 && !p);
      if (slot === -1) return prev; // 꽉 참
      next[slot] = { ...EMPTY_FORM, ...data, isMe: false };
      return next;
    });
  }, [setProfiles]);

  const removeOtherProfile = useCallback((idx) => {
    if (idx === 0) return;
    setProfiles(prev => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
    if (activeIdx === idx) setActiveIdx(0);
  }, [setProfiles, activeIdx]);

  const activeForm = profiles[activeIdx] || profiles[0] || EMPTY_FORM;

  return {
    profiles,
    activeIdx,
    setActiveIdx,
    activeForm,
    updateProfile,
    addOtherProfile,
    removeOtherProfile,
  };
}

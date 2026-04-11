import { create } from 'zustand';
import { getTodayInfo } from '../utils/saju.js';

/**
 * 별숨 전역 Zustand 스토어
 *
 * 세 개의 커스텀 훅(useUserProfile, useSajuContext, useGamification)이
 * 각자의 상태를 이 스토어에 주입하고, 컴포넌트들은 이 스토어에서 직접 읽는다.
 *
 * 기존 useUserCtx / useSajuCtx / useGamCtx 훅은 이 스토어의 shim으로
 * 교체되어 기존 컴포넌트 코드를 수정하지 않아도 된다.
 */
export const useAppStore = create((set, get) => ({
  // ── 라우팅 ──────────────────────────────────────────────────
  step: 0,
  setStep: (val) =>
    set((s) => ({ step: typeof val === 'function' ? val(s.step) : val })),

  // ── 유저 / 프로필 (useUserProfile에서 주입) ─────────────────
  user: null,
  profile: null,
  form: {},
  isDark: true,
  showToast: null,       // function — App.jsx의 showToast 콜백
  kakaoLogin: null,      // function
  kakaoLogout: null,     // function
  saveProfileToSupabase: null, // function

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setForm: (form) => set({ form }),
  setIsDark: (isDark) => set({ isDark }),
  setAuthFns: (fns) => set(fns),

  // ── 사주 / 별자리 (useSajuContext에서 주입) ──────────────────
  saju: null,
  sun: null,
  moon: null,
  asc: null,
  today: getTodayInfo(),
  formOk: false,
  formOkApprox: false,
  isApproximate: false,
  buildCtx: null,

  setSajuData: (data) => set(data),

  // ── 게이미피케이션 (useGamification에서 주입) ────────────────
  gamificationState: { currentBp: 0, guardianLevel: 1, loginStreak: 0 },
  missions: [],

  setGamificationData: ({ gamificationState, missions }) =>
    set({ gamificationState, missions }),

  // ── 모달 상태 ──────────────────────────────────────────────
  showUpgradeModal: false,
  setShowUpgradeModal: (val) => set({ showUpgradeModal: val }),
}));

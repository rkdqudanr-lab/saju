import { create } from 'zustand';

/**
 * 별숨 전역 Zustand 스토어
 * 다른 앱 내부 로직(saju.js 등)을 절대 import 하지 마세요! (순환 참조 방지)
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
  showToast: null,
  kakaoLogin: null,
  kakaoLogout: null,
  saveProfileToSupabase: null,

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
  today: null, // 💡 에러의 주범이었던 getTodayInfo() 호출을 없애고 null로 비웠습니다.
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

  // 수호신 레벨업 이벤트 (null → { fromLevel, toLevel } 로 세팅되면 모달 표시)
  guardianLevelUp: null,
  setGuardianLevelUp: (val) => set({ guardianLevelUp: val }),

  // ── 데이터 정밀도 (useUserProfile에서 주입) ─────────────────
  dataPrecision: { total: 0, level: 'low', filled: [] },
  setDataPrecision: (val) => set({ dataPrecision: val }),

  // ── 장착 중인 부적 (LandingPage/ShopPage에서 주입) ────────────
  equippedTalisman: null,
  setEquippedTalisman: (val) => set({ equippedTalisman: val }),

  // ── 장착 중인 모든 아이템 (우주/사주 포함) ───────────────
  equippedItems: [],
  setEquippedItems: (val) => set({ equippedItems: val }),
}));

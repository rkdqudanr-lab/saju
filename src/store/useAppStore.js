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

  // BP 사용 확인 모달 (Promise 기반)
  bpConfirmState: { open: false, cost: 10, questionCount: 1 },
  _bpConfirmResolve: null,
  showBPConfirm: (cost, questionCount = 1) =>
    new Promise((resolve) => {
      set({ bpConfirmState: { open: true, cost, questionCount }, _bpConfirmResolve: resolve });
    }),
  resolveBPConfirm: (result) => {
    const resolve = get()._bpConfirmResolve;
    if (resolve) resolve(result);
    set({ bpConfirmState: { open: false, cost: 10, questionCount: 1 }, _bpConfirmResolve: null });
  },

  // 수호신 레벨업 이벤트 (null → { fromLevel, toLevel } 로 세팅되면 모달 표시)
  guardianLevelUp: null,
  setGuardianLevelUp: (val) => set({ guardianLevelUp: val }),

  // ── 데이터 정밀도 (useUserProfile에서 주입) ─────────────────
  dataPrecision: { total: 0, level: 'low', filled: [] },
  setDataPrecision: (val) => set({ dataPrecision: val }),

  // ── 장착 시스템 전역 상태 ────────────────────────────────
  equippedTheme: null,
  setEquippedTheme: (val) => set({ equippedTheme: val }),
  
  equippedAvatar: null,
  setEquippedAvatar: (val) => set({ equippedAvatar: val }),
  
  equippedSajuItem: null, // "내 기운"으로 장착된 우주 또는 사주 아이템
  setEquippedSajuItem: (val) => set({ equippedSajuItem: val }),

  // ── (deprecated) 하위 호환용 ──
  equippedItems: [],
  setEquippedItems: (val) => set({ equippedItems: val }),

  equippedTalisman: null,
  setEquippedTalisman: (val) => set({ equippedTalisman: val }),
}));

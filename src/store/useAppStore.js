import { create } from 'zustand';

/**
 * 별숨 전역 Zustand 스토어
 * 다른 앱 내부 로직(saju.js 등)을 절대 import 하지 마세요! (순환 참조 방지)
 */
export const useAppStore = create((set, get) => ({
  // ── 라우팅 ──────────────────────────────────────────────────
  step: 0,
  prevStep: null, // 직전 step — 진입 경로 기반 뒤로가기용
  setStep: (val) =>
    set((s) => {
      const next = typeof val === 'function' ? val(s.step) : val;
      return next === s.step ? {} : { step: next, prevStep: s.step };
    }),

  // ── 모달 백버튼 스택 — 안드로이드 백버튼이 페이지 대신 모달을 닫게 ──
  modalStack: [], // [{ id, close }]
  pushModal: (id, close) => set((s) => ({ modalStack: [...s.modalStack.filter(m => m.id !== id), { id, close }] })),
  popModal: (id) => set((s) => ({ modalStack: s.modalStack.filter(m => m.id !== id) })),
  closeTopModal: () => {
    const stack = get().modalStack;
    if (!stack.length) return false;
    const top = stack[stack.length - 1];
    set({ modalStack: stack.slice(0, -1) });
    try { top.close?.(); } catch {}
    return true;
  },

  // ── 유저 / 프로필 (useUserProfile에서 주입) ─────────────────
  user: null,
  profile: null,
  form: {},
  lifeStage: 'free',
  isDark: false,
  instantTyping: false,
  showToast: null,
  kakaoLogin: null,
  kakaoLogout: null,
  saveProfileToSupabase: null,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setForm: (form) => set({ form }),
  setLifeStage: (lifeStage) => set({ lifeStage }),
  setIsDark: (isDark) => set({ isDark }),
  setInstantTyping: (instantTyping) => set({ instantTyping }),
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

  // 공용 확인 시트 (window.confirm 대체, Promise 기반)
  confirmState: { open: false, message: '', confirmLabel: '삭제' },
  _confirmResolve: null,
  showConfirm: (message, confirmLabel = '삭제') =>
    new Promise((resolve) => {
      set({ confirmState: { open: true, message, confirmLabel }, _confirmResolve: resolve });
    }),
  resolveConfirm: (result) => {
    const resolve = get()._confirmResolve;
    if (resolve) resolve(result);
    set({ confirmState: { open: false, message: '', confirmLabel: '삭제' }, _confirmResolve: null });
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

  // ── 기능 로딩 전체화면 오버레이 ──────────────────────────────
  featureLoading: null, // null | { type: string, text?: string }
  setFeatureLoading: (config) => set({ featureLoading: config }),
}));

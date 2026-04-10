/**
 * AppContext — Zustand 호환 shim
 *
 * 기존 React Context 방식에서 Zustand 스토어로 마이그레이션.
 * createContext / Provider는 더 이상 사용하지 않으며,
 * useUserCtx / useSajuCtx / useGamCtx 훅은 동일한 인터페이스를
 * 유지하면서 내부적으로 Zustand 스토어에서 읽는다.
 *
 * ⚠️ Zustand v5에서 object selector는 매 렌더마다 새 객체를 반환해
 * 무한 리렌더(React error #185)를 유발한다.
 * useShallow로 감싸 shallow 비교를 사용한다.
 */
import { useAppStore } from '../store/useAppStore.js';
import { useShallow } from 'zustand/shallow';

// ── UserContext shim ─────────────────────────────────────────
export function useUserCtx() {
  return useAppStore(useShallow((s) => ({
    user: s.user,
    profile: s.profile,
    form: s.form,
    isDark: s.isDark,
    showToast: s.showToast,
    kakaoLogin: s.kakaoLogin,
    kakaoLogout: s.kakaoLogout,
    saveProfileToSupabase: s.saveProfileToSupabase,
  })));
}

// ── SajuDataContext shim ─────────────────────────────────────
export function useSajuCtx() {
  return useAppStore(useShallow((s) => ({
    saju: s.saju,
    sun: s.sun,
    moon: s.moon,
    asc: s.asc,
    today: s.today,
    buildCtx: s.buildCtx,
    formOk: s.formOk,
    formOkApprox: s.formOkApprox,
    isApproximate: s.isApproximate,
  })));
}

// ── GamificationContext shim ─────────────────────────────────
export function useGamCtx() {
  return useAppStore(useShallow((s) => ({
    gamificationState: s.gamificationState,
    missions: s.missions,
  })));
}

// 하위 호환 — Context 객체 자체를 import하는 코드가 없도록 정리됐지만,
// 혹시 남아있는 import를 위해 dummy export 유지.
export const UserContext        = null;
export const SajuDataContext    = null;
export const GamificationContext = null;

import { createContext, useContext } from "react";

// ═══════════════════════════════════════════════════════════
//  UserContext — 인증 + 프로필 (로그인/프로필 저장 시 변경)
// ═══════════════════════════════════════════════════════════
export const UserContext = createContext(null);
export const useUserCtx = () => useContext(UserContext);

// ═══════════════════════════════════════════════════════════
//  SajuDataContext — 사주/별자리 데이터 (생년월일 변경 시 함께 변경)
// ═══════════════════════════════════════════════════════════
export const SajuDataContext = createContext(null);
export const useSajuCtx = () => useContext(SajuDataContext);

// ═══════════════════════════════════════════════════════════
//  GamificationContext — BP 시스템 (액션 시 변경)
// ═══════════════════════════════════════════════════════════
export const GamificationContext = createContext(null);
export const useGamCtx = () => useContext(GamificationContext);

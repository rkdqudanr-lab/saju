import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore.js";

/**
 * 테마/스크롤/폰트/lazy-chunk 프리패치 관련 부수효과를 캡슐화합니다.
 */
export function useThemeEffects({ isDark, fontSize, setIsMenuVisible }) {
  const equippedTheme = useAppStore((s) => s.equippedTheme);
  const user          = useAppStore((s) => s.user);

  // data-theme 속성
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // 스크롤 방향 감지 → 네비게이션 바 가시성
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const updateVisibility = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastY;
      if (currentY < 64) setIsMenuVisible(true);
      else if (delta > 8) setIsMenuVisible(false);
      else if (delta < -8) setIsMenuVisible(true);
      lastY = currentY;
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateVisibility);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [setIsMenuVisible]);

  // equippedTheme.colors → CSS 변수
  useEffect(() => {
    const root = document.documentElement;
    if (equippedTheme?.colors) {
      const { primary, bg, bg2 } = equippedTheme.colors;
      const toRgba = (hex, a) => {
        const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
        return `rgba(${r},${g},${b},${a})`;
      };
      root.style.setProperty('--gold',  primary);
      root.style.setProperty('--gold2', primary);
      root.style.setProperty('--acc',   toRgba(primary, 0.2));
      root.style.setProperty('--goldf', toRgba(primary, 0.1));
      root.style.setProperty('--golda', toRgba(primary, 0.15));
      if (bg)  root.style.setProperty('--bg1', bg);
      if (bg2) root.style.setProperty('--bg2', bg2);
    } else {
      ['--acc','--gold','--gold2','--goldf','--golda','--bg1','--bg2','--bg3'].forEach(v => root.style.removeProperty(v));
    }
  }, [equippedTheme]);

  // data-font 속성
  useEffect(() => {
    document.documentElement.setAttribute('data-font', fontSize === 'large' ? 'large' : 'standard');
  }, [fontSize]);

  // lazy chunk 프리패치 (로그인 시 청크 로딩 오류 방지)
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      import('../components/GroupBulseumPage.jsx').catch(() => {});
      import('../components/CompatPage.jsx').catch(() => {});
      import('../components/FutureProphecyPage.jsx').catch(() => {});
      import('../components/AnniversaryPage.jsx').catch(() => {});
      import('../components/NatalInterpretationPage.jsx').catch(() => {});
      import('../components/ComprehensivePage.jsx').catch(() => {});
      import('../components/DiaryPage.jsx').catch(() => {});
      import('../components/DiaryListPage.jsx').catch(() => {});
      import('../components/HistoryPage.jsx').catch(() => {});
      import('../components/SettingsPage.jsx').catch(() => {});
      import('../components/ProfileModal.jsx').catch(() => {});
      import('../components/OnboardingCards.jsx').catch(() => {});
      import('../components/ConsentModal.jsx').catch(() => {});
      import('../components/DreamPage.jsx').catch(() => {});
      import('../components/TaegillPage.jsx').catch(() => {});
      import('../components/NameFortunePage.jsx').catch(() => {});
    }, 1000);
    return () => clearTimeout(t);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}

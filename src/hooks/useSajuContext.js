import { useMemo, useCallback } from "react";
import { getTodayInfo, getSaju, ON } from "../utils/saju.js";
import { getSun, getMoon, getAsc } from "../utils/astrology.js";

// 폼 bh 값(소수점 시간, 예: "9.5000")을 정수 [시, 분]으로 변환 (KST 기준)
function parseBh(noTime, bh) {
  if (noTime || bh === '' || bh == null) return [12, 0];
  const dec = +bh;
  if (isNaN(dec)) return [12, 0];
  const h = Math.floor(dec);
  const min = Math.round((dec - h) * 60);
  return [h, min];
}

export function useSajuContext(form, profile, activeProfileIdx, otherProfiles) {
  const today = useMemo(() => getTodayInfo(), []);

  const saju = useMemo(() => {
    if (!(form.by && form.bm && form.bd)) return null;
    try {
      const [h, min] = parseBh(form.noTime, form.bh);
      return getSaju(+form.by, +form.bm, +form.bd, h, min);
    } catch (e) { console.error('[별숨] getSaju 오류:', e); return null; }
  }, [form]);
  const sun  = useMemo(() => {
    if (!(form.bm && form.bd)) return null;
    try { return getSun(+form.bm, +form.bd); } catch (e) { console.error('[별숨] getSun 오류:', e); return null; }
  }, [form.bm, form.bd]);
  const moon = useMemo(() => {
    if (!(form.by && form.bm && form.bd)) return null;
    try { return getMoon(+form.by, +form.bm, +form.bd); } catch (e) { console.error('[별숨] getMoon 오류:', e); return null; }
  }, [form.by, form.bm, form.bd]);
  const asc  = useMemo(() => {
    if (!(!form.noTime && form.bh && form.bm)) return null;
    try { return getAsc(+form.bh, +form.bm); } catch (e) { console.error('[별숨] getAsc 오류:', e); return null; }
  }, [form]);
  const age  = form.by ? today.year - +form.by : 0;
  const formOk = !!(form.by && form.bm && form.bd);

  const activeForm   = activeProfileIdx === 0 ? form : (otherProfiles[activeProfileIdx - 1] || form);
  const activeSaju   = useMemo(() => {
    const f = activeForm;
    if (!(f.by && f.bm && f.bd)) return null;
    try {
      const [h, min] = parseBh(f.noTime, f.bh);
      return getSaju(+f.by, +f.bm, +f.bd, h, min);
    } catch (e) { console.error('[별숨] activeSaju 오류:', e); return null; }
  }, [activeForm]);
  const activeSun    = useMemo(() => {
    if (!(activeForm.bm && activeForm.bd)) return null;
    try { return getSun(+activeForm.bm, +activeForm.bd); } catch (e) { console.error('[별숨] activeSun 오류:', e); return null; }
  }, [activeForm]);
  const activeAge    = activeForm.by ? today.year - +activeForm.by : 0;

  const buildCtx = useCallback(() => {
    const af   = activeForm;
    const as_  = activeSaju;
    const asSun = activeSun;
    // 이름 sanitization: 프롬프트 인젝션 방지 (대괄호, 줄바꿈, 30자 초과 제거)
    const rawName = af.name || '';
    const safeName = rawName.replace(/[\[\]\n\r]/g, '').slice(0, 30);
    const genderPart = af.gender ? ` · ${af.gender}` : '';
    let c = `[${safeName || '고객님'} · ${activeAge}세${genderPart}]\n\n`;
    if (activeProfileIdx > 0) c = `[${safeName || '이 사람'}의 별숨 — 대신 물어봐주는 질문]\n` + c;

    if (as_) {
      c += `[사주 기운]\n`;
      c += `연주: ${as_.yeon.g}${as_.yeon.j} / 월주: ${as_.wol.g}${as_.wol.j} / 일주: ${as_.il.g}${as_.il.j} / 시주: ${as_.si.g}${as_.si.j}\n`;
      c += `타고난 기질: ${as_.ilganDesc}\n`;
      c += `강한 기운: ${ON[as_.dom]} / 약한 기운: ${ON[as_.lac]}\n\n`;
    }
    if (asSun) {
      c += `[별자리 기운]\n`;
      c += `태양: ${asSun.n}(${asSun.s}) — ${asSun.desc}\n`;
    }
    if (profile.partner) {
      // 연인 이름 sanitization: 프롬프트 인젝션 방지
      const safePartner = profile.partner.replace(/[\[\]\n\r]/g, '').slice(0, 30);
      c += `[연인 정보]\n이름: ${safePartner}\n`;
      if (profile.partnerBy && profile.partnerBm && profile.partnerBd) {
        try {
          const ps   = getSaju(+profile.partnerBy, +profile.partnerBm, +profile.partnerBd, 12);
          const psun = getSun(+profile.partnerBm, +profile.partnerBd);
          c += `연인 사주: 연${ps.yeon.g}${ps.yeon.j} 월${ps.wol.g}${ps.wol.j} 일${ps.il.g}${ps.il.j}\n`;
          c += `연인 기질: ${ps.ilganDesc} / 강한 기운: ${ON[ps.dom]}\n`;
          c += `연인 별자리: ${psun.n}(${psun.s})\n\n`;
        } catch (e) { console.error('[별숨] 연인 사주 계산 오류:', e); }
      }
    }
    // MBTI 형식 검증 (ENFJ, ISTP 등 4자리 형식만 허용)
    if (profile.mbti && /^[EI][NS][TF][JP]$/i.test(profile.mbti)) {
      c += `[MBTI] ${profile.mbti.toUpperCase()}\n`;
    }
    // 프로필 텍스트 필드 200자 제한 (토큰 비용 절감)
    if (profile.workplace) c += `[직장/상황] ${profile.workplace.slice(0, 200)}\n`;
    if (profile.worryText) c += `[지금 고민] ${profile.worryText.slice(0, 200)}\n`;
    if (profile.selfDesc)  c += `[자기 소개] ${profile.selfDesc.slice(0, 200)}\n`;

    c += `\n[특별 지침]\n`;
    c += `1. 결과에 '요약'이라는 단어를 절대 노출하지 마세요.\n`;
    c += `2. 답변 시 모호한 표현을 피하고, 행운의 색깔, 방향, 특정 날짜, 도움되는 숫자나 초성, 피해야 할 행동 등 매우 명확하고 구체적인 점술적 요소를 1개 이상 반드시 포함하세요.\n`;
    return c;
  }, [activeForm, activeSaju, activeSun, activeAge, profile, activeProfileIdx]);

  return { today, saju, sun, moon, asc, age, formOk, activeForm, activeSaju, activeSun, activeAge, buildCtx };
}

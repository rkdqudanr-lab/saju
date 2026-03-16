import { useMemo, useCallback } from "react";
import { getTodayInfo, getSaju, ON } from "../utils/saju.js";
import { getSun, getMoon, getAsc } from "../utils/astrology.js";

export function useSajuContext(form, profile, activeProfileIdx, otherProfiles) {
  const today = useMemo(() => getTodayInfo(), []);

  const saju = useMemo(() =>
    (form.by && form.bm && form.bd)
      ? getSaju(+form.by, +form.bm, +form.bd, form.noTime ? 12 : +(form.bh || 12))
      : null,
    [form]
  );
  const sun  = useMemo(() => (form.bm && form.bd) ? getSun(+form.bm, +form.bd) : null, [form.bm, form.bd]);
  const moon = useMemo(() => (form.by && form.bm && form.bd) ? getMoon(+form.by, +form.bm, +form.bd) : null, [form.by, form.bm, form.bd]);
  const asc  = useMemo(() => (!form.noTime && form.bh && form.bm) ? getAsc(+form.bh, +form.bm) : null, [form]);
  const age  = form.by ? today.year - +form.by : 0;
  const formOk = !!(form.by && form.bm && form.bd);

  const activeForm   = activeProfileIdx === 0 ? form : (otherProfiles[activeProfileIdx - 1] || form);
  const activeSaju   = useMemo(() => {
    const f = activeForm;
    return (f.by && f.bm && f.bd) ? getSaju(+f.by, +f.bm, +f.bd, f.noTime ? 12 : +(f.bh || 12)) : null;
  }, [activeForm]);
  const activeSun    = useMemo(() => (activeForm.bm && activeForm.bd) ? getSun(+activeForm.bm, +activeForm.bd) : null, [activeForm]);
  const activeAge    = activeForm.by ? today.year - +activeForm.by : 0;

  const buildCtx = useCallback(() => {
    const af   = activeForm;
    const as_  = activeSaju;
    const asSun = activeSun;
    const genderPart = af.gender ? ` · ${af.gender}` : '';
    let c = `[${af.name || '고객님'} · ${activeAge}세${genderPart}]\n\n`;
    if (activeProfileIdx > 0) c = `[${af.name || '이 사람'}의 별숨 — 대신 물어봐주는 질문]\n` + c;

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
      c += `[연인 정보]\n이름: ${profile.partner}\n`;
      if (profile.partnerBy && profile.partnerBm && profile.partnerBd) {
        try {
          const ps   = getSaju(+profile.partnerBy, +profile.partnerBm, +profile.partnerBd, 12);
          const psun = getSun(+profile.partnerBm, +profile.partnerBd);
          c += `연인 사주: 연${ps.yeon.g}${ps.yeon.j} 월${ps.wol.g}${ps.wol.j} 일${ps.il.g}${ps.il.j}\n`;
          c += `연인 기질: ${ps.ilganDesc} / 강한 기운: ${ON[ps.dom]}\n`;
          c += `연인 별자리: ${psun.n}(${psun.s})\n\n`;
        } catch (e) {}
      }
    }
    if (profile.mbti)      c += `[MBTI] ${profile.mbti}\n`;
    if (profile.workplace) c += `[직장/상황] ${profile.workplace}\n`;
    if (profile.worryText) c += `[지금 고민] ${profile.worryText}\n`;
    if (profile.selfDesc)  c += `[자기 소개] ${profile.selfDesc}\n`;

    c += `\n[특별 지침]\n`;
    c += `1. 결과에 '요약'이라는 단어를 절대 노출하지 마세요.\n`;
    c += `2. 답변 시 모호한 표현을 피하고, 행운의 색깔, 방향, 특정 날짜, 도움되는 숫자나 초성, 피해야 할 행동 등 매우 명확하고 구체적인 점술적 요소를 1개 이상 반드시 포함하세요.\n`;
    return c;
  }, [activeForm, activeSaju, activeSun, activeAge, profile, activeProfileIdx]);

  return { today, saju, sun, moon, asc, age, formOk, activeForm, activeSaju, activeSun, activeAge, buildCtx };
}

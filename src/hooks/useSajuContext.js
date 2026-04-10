import { useMemo, useCallback, useEffect } from "react";
import { getTodayInfo, getSaju, ON } from "../utils/saju.js";
import { getSun, getMoon, getAsc } from "../utils/astrology.js";
import { useAppStore } from "../store/useAppStore.js";

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

  // 추정 모드: 년+월만 입력된 경우 일=15, 시=12 로 대체
  const isApproximate = !!(form.by && form.bm && !form.bd);
  const approxBd = form.bd || (isApproximate ? 15 : null);

  const saju = useMemo(() => {
    if (!(form.by && form.bm && (form.bd || isApproximate))) return null;
    try {
      const bd = form.bd ? +form.bd : 15;
      const [h, min] = parseBh(form.noTime || isApproximate, form.bh);
      return getSaju(+form.by, +form.bm, bd, h, min);
    } catch (e) { console.error('[별숨] getSaju 오류:', e); return null; }
  }, [form, isApproximate]);
  const sun  = useMemo(() => {
    const bd = form.bd || approxBd;
    if (!(form.bm && bd)) return null;
    try { return getSun(+form.bm, +bd); } catch (e) { console.error('[별숨] getSun 오류:', e); return null; }
  }, [form.bm, form.bd, approxBd]);
  const moon = useMemo(() => {
    const bd = form.bd || approxBd;
    if (!(form.by && form.bm && bd)) return null;
    try { return getMoon(+form.by, +form.bm, +bd); } catch (e) { console.error('[별숨] getMoon 오류:', e); return null; }
  }, [form.by, form.bm, form.bd, approxBd]);
  const asc  = useMemo(() => {
    if (!(!form.noTime && form.bh)) return null;
    try { return getAsc(+form.bh); } catch (e) { console.error('[별숨] getAsc 오류:', e); return null; }
  }, [form]);
  const age  = form.by ? today.year - +form.by : 0;
  const formOk = !!(form.by && form.bm && form.bd);
  // 년+월만 있어도 체험 가능
  const formOkApprox = !!(form.by && form.bm);

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

  // 나이대 분류: 언어 톤 조정용
  const ageRange = useMemo(() => {
    const by = activeForm.by ? +activeForm.by : 0;
    if (!by) return 'young';
    const age = today.year - by;
    if (age < 20) return 'teen';
    if (age < 30) return 'young';
    if (age < 40) return 'mid';
    if (age < 50) return 'mature';
    return 'senior';
  }, [activeForm.by, today.year]);

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
    // MBTI 형식 검증 (ENFJ, ISTP 등 4자리 형식만 허용)
    if (profile.mbti && /^[EI][NS][TF][JP]$/i.test(profile.mbti)) {
      c += `[MBTI] ${profile.mbti.toUpperCase()}\n`;
    }
    // 프로필 텍스트 필드 200자 제한 (토큰 비용 절감)
    if (profile.workplace) c += `[직장/상황] ${profile.workplace.slice(0, 200)}\n`;
    if (profile.worryText) c += `[지금 고민] ${profile.worryText.slice(0, 200)}\n`;
    if (profile.selfDesc)  c += `[자기 소개] ${profile.selfDesc.slice(0, 200)}\n`;

    // 생애 단계 (SettingsPage에서 선택한 값)
    if (profile.lifeStage && profile.lifeStage !== 'free') {
      const stageLabels = {
        jobseek: '취업 준비 중', dating: '연애 중', healing: '이별 후 회복 중',
        employed: '직장인', business: '사업 운영 중', student: '학업·시험 준비 중',
        parenting: '육아 중', reentry: '경력 재진입 준비 중',
      };
      const label = stageLabels[profile.lifeStage];
      if (label) c += `[현재 상황] ${label}\n`;
    }

    // qa_answers에서 주요 정보 최대 3개 추출 (토큰 절감)
    if (profile.qaAnswers && typeof profile.qaAnswers === 'object') {
      const qa = profile.qaAnswers;
      const snippets = [];
      // dq_09: 인생 가치관
      if (qa['dq_09']) snippets.push(`중요한 가치: ${String(qa['dq_09']).slice(0, 50)}`);
      // dq_12: 올해 목표
      if (qa['dq_12'] && snippets.length < 3) snippets.push(`올해 목표: ${String(qa['dq_12']).slice(0, 50)}`);
      // dq_06: 요즘 감정
      if (qa['dq_06'] && snippets.length < 3) snippets.push(`요즘 감정: ${String(qa['dq_06']).slice(0, 30)}`);
      if (snippets.length > 0) c += `[자기 소개 보충] ${snippets.join(' / ')}\n`;
    }

    // 나이대 언어 톤 힌트
    const ar = ageRange;
    if (ar === 'mature' || ar === 'senior') {
      c += `[언어 톤 지침] 이 분은 ${activeAge}세 이상이에요. '썸', '취준생', '대학' 같은 표현 대신 인생 경험이 녹아든 언어를 써요. '인생의 두 번째 챕터', '쌓아온 것들', '지금이라도 늦지 않은' 같은 프레임으로 이야기해요.\n`;
    } else if (ar === 'teen') {
      c += `[언어 톤 지침] 이 분은 10대예요. 쉽고 친근한 언어로, 과도한 진지함 없이 가볍고 따뜻하게 이야기해요.\n`;
    }

    // 추정 모드 표시
    if (isApproximate) {
      c += `[주의] 생일 일자와 시간이 입력되지 않아 추정값(일=15, 시=정오)으로 분석 중이에요. 가능하면 더 정확한 결과를 위해 생일 일자를 입력해달라고 부드럽게 안내해줘요.\n`;
    }

    c += `\n[특별 지침]\n`;
    c += `1. 반드시 [요약] 태그로 시작하는 한 줄 요약을 첫 번째로 써요. [요약] 태그 자체는 그대로 출력해요 (UI에서 파싱·숨김 처리됨).\n`;
    c += `2. 답변 시 모호한 표현을 피하고, 구체적인 날짜·방향·행동·감각(음식·향·소리 등) 중 하나를 반드시 포함하세요.\n`;
    return c;
  }, [activeForm, activeSaju, activeSun, activeAge, profile, activeProfileIdx, ageRange]);

  // ── Zustand 스토어에 사주/별자리 데이터 주입 ──────────────────
  const _setSajuData = useAppStore((s) => s.setSajuData);
  useEffect(() => {
    _setSajuData({ saju, sun, moon, asc, today, buildCtx, formOk, formOkApprox, isApproximate });
  }, [saju, sun, moon, asc, today, buildCtx, formOk, formOkApprox, isApproximate, _setSajuData]);

  return { today, saju, sun, moon, asc, age, formOk, formOkApprox, isApproximate, activeForm, activeSaju, activeSun, activeAge, ageRange, buildCtx };
}

import { useState, useCallback, useMemo } from "react";

const IS_BETA = true;
const REPORT_ERROR_MESSAGE = "별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요!";

export function useReportConsultationHandler({ callApi, curPkg, setShowUpgradeModal }) {
  const [reportText, setReportText] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const genReport = useCallback(async () => {
    if (!IS_BETA && curPkg.id === "basic") {
      setShowUpgradeModal(true);
      return;
    }
    if (typeof window.gtag === "function") window.gtag("event", "gen_report");
    setReportText("");
    setReportLoading(true);
    try {
      const normalizedPrompt = `[요청] 이달의 별숨 월간 리포트를 아래 형식으로 작성해주세요.

첫 줄에는 반드시 아래 형식으로 9가지 운세 점수를 적어주세요. 점수는 0~100 정수입니다.
[월간점수] 종합:숫자,금전:숫자,애정:숫자,직장:숫자,학업:숫자,건강:숫자,대인:숫자,이동:숫자,창의:숫자

둘째 줄에는 이달의 행운 색을 적어주세요.
[행운색] 색이름

셋째 줄에는 이달의 행운 아이템 2~3개를 적어주세요.
[행운아이템] 아이템, 아이템, 아이템

그 아래 본문은 다음 기준으로 작성해주세요.
- 이달의 흐름, 상승 구간, 조심해야 할 구간, 분위기 변화를 자연스럽게 이어가며 설명해주세요
- 항목별 소제목 없이 하나의 읽기 좋은 월간 리포트처럼 써주세요
- 너무 딱딱한 보고서체보다 별숨이 들려주는 설명처럼 부드럽게 써주세요
- 분량은 1000~1300자 정도로 해주세요`;
      const text = await callApi(normalizedPrompt, { isReport: true });
      setReportText(text);
    } catch {
      setReportText(REPORT_ERROR_MESSAGE);
    } finally {
      setReportLoading(false);
    }
  }, [callApi, curPkg, setShowUpgradeModal]);

  return useMemo(() => ({
    reportText,
    reportLoading,
    genReport,
  }), [reportText, reportLoading, genReport]);
}

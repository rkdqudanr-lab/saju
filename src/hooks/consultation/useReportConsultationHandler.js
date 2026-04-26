import { useState, useCallback, useMemo } from "react";

const IS_BETA = true;
const REPORT_ERROR_MESSAGE = "별숨이 잠시 길을 잃었어요.\n조금 뒤에 다시 시도해 주세요.";

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
      const normalizedPrompt = `[요청] 이번 달 월간 리포트를 작성해줘.
[형식] [월간요약], [월간점수], [이번달핵심], [주차별가이드], [관계와감정], [일과돈], [건강과생활], [이번달피할것], [이번달실천], [행운색], [행운아이템], [별숨한마디]
[주의] 태그 외 형식은 쓰지 말고, 점수는 9개 항목을 모두 포함해줘.`;
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

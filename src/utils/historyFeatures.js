export const HISTORY_SLOT_LABELS = {
  morning: "오전 운세",
  afternoon: "오후 운세",
  evening: "저녁 상담",
  dawn: "새벽 별숨",
};

export const HISTORY_FEATURES = [
  {
    id: "dream",
    label: "꿈해몽 다시 보기",
    shortLabel: "꿈해몽",
    step: 24,
    keywords: ["꿈", "해몽", "잠", "길몽", "흉몽"],
  },
  {
    id: "name",
    label: "이름풀이 다시 보기",
    shortLabel: "이름풀이",
    step: 26,
    keywords: ["이름", "한자", "성명", "작명", "이름풀이"],
  },
  {
    id: "compat",
    label: "궁합 다시 보기",
    shortLabel: "궁합",
    step: 7,
    keywords: ["궁합", "인연", "연애", "상대", "커플"],
  },
  {
    id: "report",
    label: "월간 리포트 보기",
    shortLabel: "월간 리포트",
    step: 41,
    keywords: ["월간", "리포트", "이달", "한달", "월별"],
  },
  {
    id: "letter",
    label: "별숨편지 보러 가기",
    shortLabel: "별숨편지",
    step: 35,
    keywords: ["편지", "마음", "위로", "응원", "메시지"],
  },
  {
    id: "today",
    label: "오늘의 별숨 다시 보기",
    shortLabel: "오늘의 별숨",
    step: "fortune",
    keywords: ["오늘", "별숨", "운세", "정화재점"],
  },
];

export function inferHistoryFeature(questions = [], answers = []) {
  const text = [...questions, ...answers].join(" ").toLowerCase();
  const matched = HISTORY_FEATURES.find((feature) =>
    feature.keywords.some((keyword) => text.includes(keyword.toLowerCase()))
  );

  return matched || {
    id: "general",
    label: "별숨에게 다시 물어보기",
    shortLabel: "일반 상담",
    step: 2,
  };
}

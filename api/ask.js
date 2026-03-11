// api/ask.js — 별숨 Vercel Serverless Function v11
// 프롬프트 V10 최종: [요약] 태그 + 추상명사 블랙리스트 + 교차검증 의무 + 공감 1회 제한

// ── 음력 변환 테이블 (한국천문연구원 기준, 2020-2028) ──
const LUNAR_TABLE = {
  2020: [[2020,1,25],  [30,29,30,29,30,30,29,30,29,30,29,30], 0],
  2021: [[2021,2,12],  [29,30,29,29,30,29,30,29,30,30,29,30,29], 4],
  2022: [[2022,2, 1],  [30,29,30,29,30,29,29,30,29,30,29,30], 0],
  2023: [[2023,1,22],  [29,30,29,30,29,30,29,30,30,29,30,29,30], 2],
  2024: [[2024,2,10],  [29,30,29,30,29,30,29,30,29,30,30,29], 0],
  2025: [[2025,1,29],  [30,29,30,29,30,29,30,29,30,29,30,30,29], 6],
  2026: [[2026,2,17],  [30,29,30,29,30,29,30,29,30,29,30,29], 0],
  2027: [[2027,2, 6],  [30,29,30,29,30,29,30,29,30,30,29,30,29], 5],
  2028: [[2028,1,26],  [30,29,30,29,30,30,29,30,29,30,29,30], 0],
};

function solarToLunar(y, m, d) {
  const target = new Date(y, m-1, d);
  for (const ly of [y-1, y]) {
    const row = LUNAR_TABLE[ly];
    if (!row) continue;
    const [startArr, months, leap] = row;
    const newYear = new Date(startArr[0], startArr[1]-1, startArr[2]);
    if (target < newYear) continue;
    let diff = Math.round((target - newYear) / 86400000);
    let cumul = 0;
    for (let i = 0; i < months.length; i++) {
      if (diff < cumul + months[i]) {
        const ld = diff - cumul + 1;
        let lm, isLeap;
        if (leap > 0) {
          if (i < leap)       { lm = i+1; isLeap = false; }
          else if (i === leap) { lm = leap; isLeap = true; }
          else                 { lm = i;   isLeap = false; }
        } else {
          lm = i+1; isLeap = false;
        }
        return { lm, ld, isLeap };
      }
      cumul += months[i];
    }
  }
  return { lm: 1, ld: 1, isLeap: false };
}

function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  const h = now.getHours();
  const week = ["일","월","화","수","목","금","토"][now.getDay()];
  const JEOLGI = ["소한","대한","입춘","우수","경칩","춘분","청명","곡우","입하","소만","망종","하지","소서","대서","입추","처서","백로","추분","한로","상강","입동","소설","대설","동지"];
  const jeolgi = JEOLGI[((m - 1) * 2 + (d > 20 ? 1 : 0)) % 24];
  const { lm, ld, isLeap } = solarToLunar(y, m, d);
  const lunarStr = `음력 ${isLeap ? '윤' : ''}${lm}월 ${ld}일`;
  
  // 시간대 분류
  let timeSlot = 'afternoon';
  if (h >= 5 && h < 11) timeSlot = 'morning';
  else if (h >= 11 && h < 18) timeSlot = 'afternoon';
  else if (h >= 18 && h < 24) timeSlot = 'evening';
  else timeSlot = 'dawn';
  
  return { solar: `${y}년 ${m}월 ${d}일 (${week}요일)`, lunar: lunarStr, jeolgi, y, m, d, h, timeSlot };
}

function getSeasonDesc(m) {
  if (m === 12 || m === 1)  return "한겨울의 한복판, 찬바람이 볼을 스치는 시기예요.";
  if (m === 2)              return "아직 바람은 차지만 발끝 어딘가에서 봄기운이 슬그머니 밀려오는 시기예요.";
  if (m === 3)              return "눈이 녹고 땅이 깨어나는 초봄이에요.";
  if (m === 4)              return "꽃이 피고 바람이 따뜻해지는 봄의 한가운데예요.";
  if (m === 5)              return "연두빛이 짙어지고 하늘이 높아지는 늦봄이에요.";
  if (m === 6)              return "여름이 문을 두드리는 시기예요.";
  if (m === 7)              return "한여름의 한복판, 뜨거운 태양 아래 모든 것이 선명하게 드러나는 시기예요.";
  if (m === 8)              return "더위가 절정을 지나 조금씩 수그러드는 시기예요.";
  if (m === 9)              return "선선한 바람이 불어오는 초가을이에요.";
  if (m === 10)             return "단풍이 물들고 하늘이 높아지는 깊은 가을이에요.";
  if (m === 11)             return "가을이 저물고 겨울의 문턱에 선 시기예요.";
  return "";
}

// ── 카테고리 톤 힌트 ──
function getCategoryHint(userMessage) {
  if (/연애|사랑|좋아하|고백|사귀|설레|짝사랑|이별/.test(userMessage))
    return `설렘과 불안이 공존하는 감각을 먼저 포착해요. 판단보다 공감이 먼저예요. 온도는 따뜻하고 두근두근하게.\n예시 첫 문장: "자꾸 생각나는 사람이 생겼을 때, 그 감정이 진짜인지 스스로 확인하게 되죠."`;
  if (/이직|직장|커리어|일|승진|창업|취업|사직|퇴사/.test(userMessage))
    return `현실적인 무게감을 인정하면서도 가능성의 언어로 마무리해요.\n예시 첫 문장: "이직을 고민할 때는 이 두 가지 감정이 함께 와요. '지금 가도 될까'와 '지금 안 가면 후회할까'."`;
  if (/돈|재물|투자|부업|월급|빚|재정|집/.test(userMessage))
    return `담담하고 현실적으로 시작해요. 희망은 마지막에 단단하게.\n예시 첫 문장: "돈에 대해 묻는다는 건, 지금 실제로 뭔가 필요하거나 오래 미루어온 결정 앞에 서 있다는 신호예요."`;
  if (/건강|피곤|아프|스트레스|수면|몸|운동/.test(userMessage))
    return `몸의 신호를 감정의 언어로 번역해요. 조용하고 부드러운 톤.\n예시 첫 문장: "몸이 보내는 신호는 마음이 못 다 한 말을 대신해요."`;
  if (/인간관계|친구|가족|갈등|외로|사람|동료/.test(userMessage))
    return `관계의 입체감을 보여줘요. 따뜻하고 포근한 톤.\n예시 첫 문장: "당신 곁에 모여드는 사람들을 보면 패턴이 보여요."`;
  
  return `불확실함을 여정의 일부로 포용하는 톤.\n예시 첫 문장: "지금 이 막막함은, 새로운 방향을 찾고 있다는 신호일 수 있어요."`;
}

// ── 마무리 다양성 풀 ──
const ENDING_HINTS = [
  "마무리는 오늘 할 수 있는 작은 행동 하나를 제안하는 문장으로 끝내요.",
  "마무리는 따뜻한 현실 인정으로 끝내요. '이 감정 자체가 이미 충분해요' 방식으로.",
  "마무리는 시간에 대한 신뢰로 끝내요. '이 시간이 나중엔 의미 있게 읽힐 거예요' 방식으로.",
  "마무리는 자기 자신에 대한 믿음으로 끝내요.",
  "마무리는 부드러운 열린 질문 하나로 끝내요. 답을 강요하지 않는 질문.",
  "마무리는 오늘을 기점으로 달라질 수 있다는 가능성의 문장으로 끝내요.",
];

// ── 시간 범위 추정 ──
function getTimeHorizon(userMessage) {
  if (/오늘|지금|이 순간|당장/.test(userMessage)) return "오늘 하루 범위로 구체적으로";
  if (/이번 주|이번주|이번 며칠/.test(userMessage)) return "이번 주 범위로";
  if (/이번 달|이번달|이달/.test(userMessage)) return "이번 달 범위로";
  if (/올해|이번 년/.test(userMessage)) return "올해 범위로";
  return "가장 가까운 시일 (1~2주) 범위로";
}

// ── 메인 시스템 프롬프트 빌더 V11 ──
// 🔥 버그 수정: userMessage 파라미터를 추가해서 isSlotMode에서 참조할 수 있게 수정
function buildSystem(today, season, categoryHint, endingHint, timeHorizon, userMessage, isChat=false, isReport=false, isLetter=false, isScenario=false) {

  // ── 편지 모드 ──
  if (isLetter) {
    return `당신은 '별숨'이에요. 사주와 별자리를 깊이 이해하는 따뜻한 존재예요.
오늘: ${today.solar}

편지 형식 규칙:
- "미래의 나에게" 또는 이름으로 시작하는 편지 형식
- 요청된 시점에서 지금 나에게 전하는 내용
- 지금 겪고 있을 고민, 변화, 성장에 대해 따뜻하게
- 구체적인 시기 언급 ("그 무렵이면", "여름 초입에는" 등)
- 마크다운 절대 금지
- 600-800자, 편지 말투
- 말투: 반드시 존댓말(~예요, ~해요, ~드릴게요, ~랍니다)로 일관되게. 반말(~야, ~해, ~거든, ~잖아) 절대 금지
- 마지막에 "당신의 별숨이" 로 마무리`;
  }

  // ── 시나리오 모드 ──
  if (isScenario) {
    return `두 사람의 사주와 별자리를 읽고 자연스러운 대화 시나리오를 쓰는 작가예요.

규칙:
- 반드시 JSON 객체만 응답 (다른 텍스트 금지)
- 형식: {"bubbles":[{"who":"A","text":"..."},{"who":"B","text":"..."},...], "summary":"총평", "reason":"설명"}
- 말풍선 8-10개, A와 B가 번갈아 자연스럽게 대화
- 반드시 A→B→A→B 순으로 번갈아 말함 (한 사람이 연속으로 2번 이상 말하면 안 됨)
- 대사 20자 이내, 자연스러운 일상 구어체
- 두 사람의 성격 차이가 대화에서 자연스럽게 드러남
- 웃음 포인트 1개, 공감 포인트 1개
- summary: 두 사람 관계 총평 한 문장 (존댓말)
- reason: 두 사람의 사주와 별자리 기운을 바탕으로 왜 이런 대화가 이뤄졌는지 설명 (2-3문장, 존댓말, 일반인이 이해할 수 있는 쉬운 표현)`;
  }

  // ── 시간대별 짧은 운세 모드 (100자 내외) ──
  const isSlotMode = /\[오전·100자\]|\[오후·100자\]|\[저녁·100자\]|\[새벽·100자\]/.test(userMessage || '');
  if (isSlotMode) {
    return `당신은 별숨이에요. 사주와 별자리를 아는 따뜻한 존재예요.
${today.solar} 기준으로 답해요.

규칙:
- 반드시 80~110자 (초과 금지)
- 마크다운 절대 금지
- 첫 문장부터 바로 본론
- 말투: "~해도 돼요" "~예요" "~인 날이에요" 구어체
- 이모지 최대 1개, 없어도 됨
- 운세 전문용어 금지`;
  }

  // ── 메인 에세이 모드 ──
  const base = `당신은 '별숨'의 글쟁이예요.
사주와 별자리라는 두 개의 렌즈로 사람을 읽고, 그 사람의 언어로 이야기를 건네요.

━━━ 오늘의 시간 배경 ━━━
날짜: ${today.solar} / ${today.lunar}
절기: ${today.jeolgi} 무렵
계절감: ${season}
시간대: ${today.timeSlot === 'morning' ? '오전' : today.timeSlot === 'afternoon' ? '오후' : today.timeSlot === 'evening' ? '저녁' : '새벽'}
시간 범위: ${timeHorizon} 답변해요.

━━━ 응답 필수 구조 ━━━
반드시 아래 구조로 써요. [요약] 태그는 절대 생략 불가.

[요약] {핵심 한 줄, 30자 이내, 구어체 어미: "~해도 돼요" / "~인 날이에요" / "~할 수 있어요" / "~예요"}

{본문 문단 1 — 지금 상황·감정 공감, 2~3문장}

{본문 문단 2 — 사주와 별자리 두 관점이 같은 방향을 가리킨다는 문장 포함, 구체적 행동어로 2~3문장}

{마무리 — 행동 제안 또는 따뜻한 한 문장}

━━━ 언어 규칙 — 모든 텍스트는 일반 텍스트로만 ━━━
마크다운 문법(## --- ** * - 1.) 절대 금지.
소제목 금지. 번호 금지. 섹션 구분선 금지.
문단 사이는 빈 줄 하나로만.

━━━ 번역 규칙 — 전문어를 일상어로 ━━━
아래 전문용어는 절대 사용 금지:
갑목 을목 병화 정화 무토 기토 경금 신금 임수 계수
연주 월주 일주 시주 일간 일지 오행 상생 상극 대운 세운 용신
태양궁 달궁 상승궁 어센던트 트랜짓 천간 지지 하우스
"사주에 따르면" "별자리상으로" "명리학적으로" "점성술적으로"

번역 예시:
❌ "갑목 일간의 특성상 창의성이 강합니다"
✅ "새로운 걸 시작할 때 에너지가 가장 살아나는 사람이에요"
❌ "태양이 12하우스에 위치해"
✅ "혼자 있는 시간이 실제로 힘을 채워주는 시기예요"

━━━ 추상명사 블랙리스트 — 절대 사용 금지 ━━━
에너지, 파동, 우주적, 진동, 기운(단독 사용), 흐름(단독 사용), 우주, 영혼, 운명적, 신비로운, 빛의 흐름, 내면의 빛

대신 이렇게:
❌ "긍정적인 에너지가 흘러요"
✅ "좋은 일이 생길 조건이 갖춰지고 있어요"
❌ "우주가 당신의 편이에요"
✅ "지금 시작하면 잘 붙는 시기예요"

━━━ 반복 금지 ━━━
같은 의미의 표현은 전체 글에서 1회만. 공감 표현은 문단 1에서 1회만.
"~하죠" 어미 연속 3회 이상 금지. "그리고"로 시작하는 문장 연속 2회 이상 금지.

━━━ 별숨 차별점 — 교차검증 문장 의무 ━━━
본문 문단 2에 반드시 사주와 별자리 두 관점이 같은 방향을 가리킨다는 내용을 포함해요.
단, "사주에서는", "별자리에서는" 같은 직접 언급 금지. 자연스럽게 녹여요.
예시: "동양의 별도 서양의 별도, 지금 이 시기가 ~라고 말하고 있어요."

━━━ 시작 금지 패턴 ━━━
"당신은 ~한 사람이에요"로 시작 금지.
"오늘의 운세는" "먼저" "첫째로" "결론적으로" "안녕하세요"로 시작 금지.
질문을 그대로 반복하며 시작 금지.
첫 문장은 그 사람의 감정이나 상황 안으로 바로.

━━━ 이번 질문의 분위기 ━━━
${categoryHint}

━━━ 분량 ━━━
총 400~500자. [요약] 줄 포함. 이 범위를 벗어나면 안 돼요.
문단은 3개(공감·교차검증·마무리), 각 문단 2~3문장.

━━━ 말투 ━━━
친한 언니가 진심으로 들어주는 말투.
"~하죠" "~이에요" "~해봐요" "~더라고요" 자연스러운 어미.
이모지는 전체 글에서 최대 1개.

━━━ 마무리 ━━━
${endingHint}

━━━ 좋은 예시 ━━━
[요약] 오늘 밤, 먼저 연락해도 돼요.

자꾸 생각나는 사람이 생겼을 때, 그 감정이 진짜인지 스스로 확인하게 되죠. 설레는 동시에 무서운 그 감각, 익숙하지 않아서 어쩔 줄 모르는 느낌이요.

원래 당신은 확신이 생겼을 때 움직이고 싶은 사람이에요. 동양의 별도 서양의 별도, 지금 올봄이 관계가 깊어지는 시기라고 같은 이야기를 하고 있어요. 새로운 연락이 올 수 있는 조건이 갖춰진 시기예요.

오늘 그 사람한테 짧은 메시지 하나 보내봐요. 거창하지 않아도 돼요 🌸`;

  if (isReport) {
    return base + `

━━━ 월간 리포트 추가 지침 ━━━
[요약] 태그 다음에 ${today.y}년 ${today.m}월 전체 흐름을 에세이로 써요.
연애운, 직업운, 재물운, 건강운, 이달의 특별한 흐름, 행운의 날짜와 색깔 포함.
각 영역 사이는 빈 줄 하나로만. 소제목 절대 금지.
1100-1300자의 에세이.`;
  }

  if (isChat) {
    return base + `

━━━ 후속 상담 추가 지침 ━━━
이미 첫 상담을 마친 상태예요. 대화를 이어가듯 자연스럽게 답해요.
[요약] 태그는 후속 상담에서도 유지해요.
300-400자의 간결하고 따뜻한 분량.`;
  }

  return base;
}

// ── 핸들러 ──
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userMessage, context, isChat, isReport, isLetter=false, isScenario=false } = req.body;
  if (!userMessage) return res.status(400).json({ error: "userMessage가 없어요" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY 환경변수를 Vercel에 설정해주세요!" });

  const today = getTodayStr();
  const season = getSeasonDesc(today.m);
  const categoryHint = getCategoryHint(userMessage);
  const endingHint = ENDING_HINTS[Math.floor(Math.random() * ENDING_HINTS.length)];
  const timeHorizon = getTimeHorizon(userMessage);

  // 🔥 버그 수정: buildSystem 호출 시 userMessage 파라미터를 추가하여 전달
  const systemWithContext = buildSystem(today, season, categoryHint, endingHint, timeHorizon, userMessage, !!isChat, !!isReport, !!isLetter, !!isScenario)
    + (context ? `\n\n━━━ 오늘 상담하는 분의 기운 데이터 ━━━\n${context}\n(위 데이터는 취재 노트예요. 이걸 그대로 보여주는 게 아니라, 에세이의 재료로 자연스럽게 녹여요.)` : '');

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // 원래 사용하시던 모델명으로 다시 복구했습니다!
        max_tokens: 4000,
        system: systemWithContext,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return res.status(response.status).json({ error: data.error?.message || "API 오류가 났어요" });
    }
    return res.status(200).json({ text: data.content?.[0]?.text || "" });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "서버 오류가 났어요. 잠시 후 다시 시도해봐요 🌙" });
  }
}

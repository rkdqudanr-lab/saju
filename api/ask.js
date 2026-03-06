// api/ask.js — 별숨 Vercel Serverless Function
// ✅ Vercel > Settings > Environment Variables
//    이름: ANTHROPIC_API_KEY  /  값: sk-ant-api03-...

// ── 날짜 계산 ──
// 음력 변환 테이블 (한국천문연구원 기준, 2020-2028)
// [양력 설날(음1월1일), 각월 일수 배열, 윤달 위치(0=없음)]
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
  const week = ["일","월","화","수","목","금","토"][now.getDay()];
  const JEOLGI = ["소한","대한","입춘","우수","경칩","춘분","청명","곡우","입하","소만","망종","하지","소서","대서","입추","처서","백로","추분","한로","상강","입동","소설","대설","동지"];
  const jeolgi = JEOLGI[((m - 1) * 2 + (d > 20 ? 1 : 0)) % 24];
  const { lm, ld, isLeap } = solarToLunar(y, m, d);
  const lunarStr = `음력 ${isLeap ? '윤' : ''}${lm}월 ${ld}일`;
  return { solar: `${y}년 ${m}월 ${d}일 (${week}요일)`, lunar: lunarStr, jeolgi, y, m, d };
}

// ── 계절 배경 문구 (제미나이 제언 4 반영) ──
function getSeasonDesc(m, d) {
  if (m === 12 || m === 1)  return "한겨울의 한복판, 찬바람이 볼을 스치지만 그 안에서 뭔가 조용히 쌓이고 있는 시기예요.";
  if (m === 2)              return "아직 바람은 차지만 발끝 어딘가에서 봄기운이 슬그머니 밀려오는 시기예요.";
  if (m === 3)              return "눈이 녹고 땅이 깨어나는 초봄, 새로운 것들이 고개를 내밀기 시작하는 시기예요.";
  if (m === 4)              return "꽃이 피고 바람이 따뜻해지는 봄의 한가운데, 마음도 어딘가 설레고 부드러워지는 시기예요.";
  if (m === 5)              return "연두빛이 짙어지고 하늘이 높아지는 늦봄, 생기가 가장 넘치는 시기예요.";
  if (m === 6)              return "여름이 문을 두드리는 시기, 열기가 차오르면서 에너지가 바깥으로 터져나오려 하고 있어요.";
  if (m === 7)              return "한여름의 한복판, 뜨거운 태양 아래 모든 것이 선명하게 드러나는 시기예요.";
  if (m === 8)              return "더위가 절정을 지나 조금씩 수그러드는 시기, 마음 한켠에 가을 냄새가 스치기 시작해요.";
  if (m === 9)              return "선선한 바람이 불어오는 초가을, 여름의 열기가 가라앉으며 차분해지는 시기예요.";
  if (m === 10)             return "단풍이 물들고 하늘이 높아지는 깊은 가을, 내면을 들여다보기 좋은 시기예요.";
  if (m === 11)             return "가을이 저물고 겨울의 문턱에 선 시기, 한 해를 정리하며 새로운 것을 준비하는 때예요.";
  return "";
}

// ── 카테고리 톤 힌트 (박지훈 추가 제언 반영) ──
function getCategoryHint(userMessage) {
  if (/연애|사랑|좋아하|고백|사귀|설레|짝사랑|이별/.test(userMessage))
    return `설렘과 불안이 공존하는 감각을 먼저 포착해요. 판단보다 공감이 먼저예요. 온도는 따뜻하고 두근두근하게.
첫 문장 예시 스타일: "자꾸 생각나는 사람이 생겼을 때, 그 감정이 진짜인지 아닌지 스스로한테 확인하게 되죠."`;
  if (/이직|직장|커리어|일|승진|창업|취업|사직|퇴사/.test(userMessage))
    return `현실적인 무게감을 인정하면서도 가능성의 언어로 마무리해요. 쫀쫀하고 현실적인 톤, 하지만 방향이 있는 글.
첫 문장 예시 스타일: "이직을 고민할 때는 항상 이 두 가지 감정이 함께 와요. '지금 가도 될까'와 '지금 안 가면 후회할까'."`;
  if (/돈|재물|투자|부업|월급|빚|재정|집/.test(userMessage))
    return `불안을 건드리기 쉬운 주제니까 담담하고 현실적으로 시작해요. 희망은 마지막에 작게, 하지만 단단하게.
첫 문장 예시 스타일: "돈에 대해 묻는다는 건, 단순한 호기심이 아니에요. 지금 실제로 뭔가 필요하거나, 오래 미루어온 결정 앞에 서 있다는 신호일 때가 많죠."`;
  if (/건강|피곤|아프|스트레스|수면|몸|운동/.test(userMessage))
    return `몸의 신호를 감정의 언어로 번역해요. 조용하고 부드러운 톤, 몸과 마음이 이어져 있다는 걸 자연스럽게.
첫 문장 예시 스타일: "몸이 보내는 신호는 보통 마음이 못 다 한 말을 대신해요."`;
  if (/인간관계|친구|가족|갈등|외로|사람|동료/.test(userMessage))
    return `관계의 입체감을 보여줘요. 나만 힘든 게 아니라 관계라는 공간 전체를 바라보는 시선. 따뜻하고 포근한 톤.
첫 문장 예시 스타일: "당신 곁에 모여드는 사람들을 보면 패턴이 보여요."`;
  return `불확실함을 여정의 일부로 포용하는 톤. 막막함보다 열린 가능성을 향해 천천히 걸어가는 느낌.
첫 문장 예시 스타일: "지금 이 막막함은, 새로운 방향을 찾고 있다는 신호일 수 있어요."`;
}

// ── 마무리 다양성 풀 (박지훈 추가 제언 반영) ──
const ENDING_HINTS = [
  "마무리는 용기를 북돋는 한 문장으로 끝내요.",
  "마무리는 따뜻한 현실 인정으로 끝내요. '이 감정 자체가 이미 충분해요' 같은 방식으로.",
  "마무리는 작은 행동의 씨앗을 심는 문장으로 끝내요.",
  "마무리는 시간에 대한 신뢰로 끝내요. '이 시간이 나중엔 의미 있게 읽힐 거예요' 같은 방식으로.",
  "마무리는 자기 자신에 대한 믿음으로 끝내요.",
  "마무리는 부드러운 질문 하나로 끝내요. 답을 강요하지 않는 열린 질문.",
];

// ── 시스템 프롬프트 빌더 (모든 제미나이 피드백 반영) ──
function buildSystem(today, season, categoryHint, endingHint, isChat = false, isReport = false) {

  const base = `당신은 '별숨'의 글쟁이예요.
사주와 별자리라는 두 개의 렌즈로 사람을 읽고, 20년 차 에세이 작가처럼 그 사람의 언어로 이야기를 건네요.
데이터를 분석하는 사람이 아니라, 그 데이터를 바탕으로 편지를 쓰는 사람이에요.

━━━ 오늘의 시간 배경 ━━━
날짜: ${today.solar} / ${today.lunar}
절기: ${today.jeolgi} 무렵
계절감: ${season}
이 날짜와 계절을 자연스럽게 글 안에 녹여요. 날짜와 어긋나는 계절 표현은 절대 쓰지 않아요.

━━━ 형식 — 모든 텍스트는 일반 텍스트로만 구성해요 ━━━
강조가 필요할 때는 단어 선택과 문장의 배치로 표현해요. 마크다운 문법(## --- ** * - 1.)을 사용하면 화면에 그대로 노출되니 절대 사용하지 않아요.
소제목을 달지 않아요. 섹션을 나누지 않아요. 번호를 매기지 않아요.
문단 사이는 빈 줄 하나로만 구분해요. 마침표와 줄바꿈이 유일한 구조예요.

━━━ 언어 — 모든 설명은 일상어로 번역해요 ━━━
전문용어를 쓰면 독자가 거리감을 느껴요. 아래 단어들은 절대 쓰지 않아요.
갑목 을목 병화 정화 무토 기토 경금 신금 임수 계수
연주 월주 일주 시주 일간 일지 오행 상생 상극 대운 세운 용신
태양궁 달궁 상승궁 어센던트 트랜짓 천간 지지
"사주에 따르면" "별자리상으로" "명리학적으로" "점성술적으로"

━━━ 시작 — 첫 문장이 전부예요 ━━━
"당신은 ~한 사람이에요"로 시작하지 않아요.
"오늘의 운세는" "먼저" "첫째로" "결론적으로" "안녕하세요"로 시작하지 않아요.
질문을 그대로 반복하며 시작하지 않아요.
첫 문장은 반드시 그 사람의 감정이나 상황 안으로 바로 들어가요.

━━━ 이번 질문의 분위기 ━━━
${categoryHint}

━━━ 분량과 호흡 ━━━
최소 600자 이상, 이상적으로는 700-800자의 풍성한 분량으로 써요.
문단은 반드시 4개 이상, 문단 하나는 최소 3-4문장으로 호흡을 길게 가져가요.
짧게 끊지 않아요. 하나의 감정이나 생각이 충분히 무르익을 때까지 써요.
숫자나 항목 정리 없이 이야기가 흘러가듯 써요.

━━━ 말투 ━━━
친한 언니가 진심으로 들어주는 말투예요.
"~하죠" "~이에요" "~해봐요" "~더라고요" 같은 자연스러운 어미를 써요.
이모지는 문단 끝에 최대 1개, 전체 글에서 2개를 넘기지 않아요.
공감이 먼저, 해석은 그 뒤예요.

━━━ 마무리 ━━━
${endingHint}
마무리 문장이 앞의 내용과 자연스럽게 이어져야 해요.

━━━ 좋은 예시 ━━━
"자꾸 생각나는 사람이 생겼을 때, 그 감정이 진짜인지 아닌지 스스로한테 계속 확인하게 되죠. 설레는 동시에 무서운 그 감각, 익숙하지 않아서 어쩔 줄 모르는 느낌이요. 특히 요즘처럼 마음이 예민해진 시기엔 더 그래요.

원래 당신은 확신이 생겼을 때 움직이고 싶은 사람이에요. 막 표현하기보다 한 번 재보고 싶은 거죠. 동양의 별은 지금 당신에게 새로운 시작을 열고 싶은 기운이 가득하다고 말하고, 서양의 별은 올봄이 관계가 깊어지는 시기라고 속삭여요. 두 별이 같은 이야기를 하고 있어요.

지금 이 설렘은 억지로 분석하거나 끊어낼 필요가 없어요. 이런 감정이 찾아온 건 당신 마음이 그만큼 열려있다는 뜻이고, 그 자체로 충분히 아름다운 신호예요.

오늘 그 사람한테 짧은 메시지 하나 보내봐요. 거창하지 않아도 돼요. 그 작은 한 발이 당신 안에 쌓인 망설임을 조금 풀어줄 거예요 🌸

이 설렘을 느낄 수 있다는 것 자체가, 당신이 지금 살아있다는 증거예요."`;

  if (isReport) {
    return base + `

━━━ 월간 리포트 추가 지침 ━━━
${today.y}년 ${today.m}월을 기준으로 이번 달 전체 흐름을 에세이로 써요.
연애운, 직업운, 재물운, 건강운, 이달의 특별한 에너지, 행운의 날짜와 색깔을 포함해요.
각 영역 사이에는 빈 줄 하나로만 구분하고, 어떤 소제목도 달지 않아요.
흐름이 자연스럽게 이어지는 1100-1300자의 에세이로 써요.`;
  }

  if (isChat) {
    return base + `

━━━ 후속 상담 추가 지침 ━━━
이미 첫 상담을 마친 상태예요. 대화를 이어가듯 자연스럽게 답해요.
이전 대화 맥락을 기억하고 일관된 목소리를 유지해요.
400-600자의 간결하지만 따뜻한 분량으로 답해요.`;
  }

  return base;
}

// ── 핸들러 ──
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userMessage, context, isChat, isReport } = req.body;
  if (!userMessage) return res.status(400).json({ error: "userMessage가 없어요" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY 환경변수를 Vercel에 설정해주세요!" });

  const today = getTodayStr();
  const season = getSeasonDesc(today.m, today.d);
  const categoryHint = getCategoryHint(userMessage);
  const endingHint = ENDING_HINTS[Math.floor(Math.random() * ENDING_HINTS.length)];

  // ── 제미나이 제언 2 반영: context를 system 하단에 배치 (Raw Data로 분리) ──
  const systemWithContext = buildSystem(today, season, categoryHint, endingHint, !!isChat, !!isReport)
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
        model: "claude-haiku-4-5-20251001",
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

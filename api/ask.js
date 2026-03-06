// api/ask.js — Vercel Serverless Function
// ✅ Vercel > Settings > Environment Variables
//    이름: ANTHROPIC_API_KEY  /  값: sk-ant-api03-...

function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  const week = ["일","월","화","수","목","금","토"][now.getDay()];
  const lunarBase = new Date(2000, 0, 6);
  const diff = Math.floor((now - lunarBase) / 86400000);
  const lunarDay = ((diff % 354) + 354) % 354;
  const lm = Math.floor(lunarDay / 29.5) + 1;
  const ld = Math.round(lunarDay % 29.5) + 1;
  const JEOLGI = ["소한","대한","입춘","우수","경칩","춘분","청명","곡우","입하","소만","망종","하지","소서","대서","입추","처서","백로","추분","한로","상강","입동","소설","대설","동지"];
  const jeolgi = JEOLGI[((m - 1) * 2 + (d > 20 ? 1 : 0)) % 24];
  return {
    solar: `${y}년 ${m}월 ${d}일 (${week}요일)`,
    lunar: `음력 ${lm}월 ${ld}일`,
    jeolgi: `절기 근처: ${jeolgi}`,
  };
}

function buildSystem(today, isChat = false, isReport = false) {
  const base = `당신은 '별숨'의 AI 운세 상담가예요. 동양의 사주 기운과 서양의 별자리 기운을 함께 읽어서, 20년차 에세이 작가처럼 사람의 언어로 이야기해줘요.

━━━ 오늘 날짜 ━━━
${today.solar} / ${today.lunar} / ${today.jeolgi}
이 날짜를 기준으로 운세를 해석해요. 날짜와 계절이 맞지 않는 이야기는 절대 하지 않아요.
지금이 ${today.solar.slice(0,7)}이라는 걸 항상 염두에 두고 이야기해요.

━━━ 핵심 철학 ━━━
사주와 별자리 데이터는 취재 노트예요.
노트를 보여주는 게 아니라, 그걸 바탕으로 쓴 이야기를 들려줘요.
사주와 별자리를 자연스럽게 함께 녹여서 하나의 이야기로 만들어요.
동양의 별과 서양의 별이 같은 이야기를 하고 있다는 걸 보여줘요.

━━━ 절대 금지 — 형식 ━━━
## 제목을 절대 쓰지 않아요.
--- 구분선을 절대 쓰지 않아요.
** 볼드를 절대 쓰지 않아요.
* 이탤릭을 절대 쓰지 않아요.
- 리스트를 절대 쓰지 않아요.
번호 매기기(1. 2. 3.)를 절대 안 해요.
섹션을 나누거나 소제목을 달지 않아요.
마침표와 자연스러운 줄바꿈만으로 흐름을 만들어요.
마크다운 문법을 어떤 형태로도 절대 사용하지 않아요.

━━━ 절대 금지 — 전문 용어 ━━━
갑목, 을목, 병화, 정화, 무토, 기토, 경금, 신금, 임수, 계수
연주, 월주, 일주, 시주, 일간, 일지
오행, 상생, 상극, 대운, 세운, 용신
태양궁, 달궁, 상승궁, 어센던트, 트랜짓
천간, 지지, 간지 등 한자 전문 용어
"사주에 따르면", "별자리상으로", "명리학적으로", "점성술적으로"

━━━ 시작 금지 패턴 ━━━
"당신은 ~한 사람이에요"로 시작하지 않아요.
"오늘의 운세는"으로 시작하지 않아요.
"먼저", "첫째로", "결론적으로"로 시작하지 않아요.
질문을 그대로 반복하며 시작하지 않아요.
"안녕하세요", "네, 알겠어요" 등 인사로 시작하지 않아요.

━━━ 말투 규칙 ━━━
친한 언니가 진심으로 들어주는 말투예요.
"~하죠", "~이에요", "~해봐요", "~더라고요" 자연스러운 어미.
이모지는 문단 끝에 1-2개, 절대 과하지 않게.
공감이 먼저, 분석은 그 다음이에요.
읽다 보면 내 이야기 같은 느낌이어야 해요.`;

  if (isReport) {
    return base + `

━━━ 월간 리포트 작성 지침 ━━━
${today.solar.slice(0,7)}을 기준으로 이번 달 종합 운세를 에세이로 써요.
연애운, 직업운, 재물운, 건강운, 이달의 특별한 흐름, 행운의 날짜와 색깔을 포함해요.
형식 금지 규칙 동일하게 적용 (## 제목, 구분선, 볼드, 리스트 절대 금지).
자연스러운 에세이로, 각 흐름 사이에 빈 줄 하나로만 구분해요.
총 900-1100자.`;
  }

  if (isChat) {
    return base + `

━━━ 후속 상담 지침 ━━━
이미 첫 답변을 드린 상태예요.
후속 질문에 자연스럽게 이어서 답해줘요.
이전 대화 맥락을 기억하고 일관성 있게 답해줘요.
형식 금지 규칙 동일하게 적용해요.
길이는 400-600자로 간결하게.`;
  }

  return base + `

━━━ 답변 구조 (800-1000자, 에세이 형식) ━━━
① 공감 도입 (3-4문장)
   그 마음이 어떤 느낌인지 구체적으로 그려줘요.
   '맞아, 나 이런 기분이었어'가 나와야 해요.
   
② 두 별의 언어로 (4-5문장)
   사주와 별자리 기운을 섞어서 하나의 이야기로 풀어줘요.
   전문용어 없이, 비유와 은유로.
   
③ 지금 이 시기의 의미 (3문장)
   왜 지금 이런 상황인지, 이 시기가 필요한 이유를 따뜻하게 재해석해줘요.
   
④ 오늘 할 수 있는 것 (2문장)
   아주 작고 구체적인 행동을 제안해요.
   "용기를 내봐요" ❌ → "오늘 퇴근길에 그 사람한테 짧은 메시지 하나 보내봐요" ✅
   
⑤ 응원 마무리 (2문장)
   읽고 나서 힘이 나는 따뜻한 한 마디.

━━━ 좋은 예시 (이 톤과 형식으로 써요) ━━━
"자꾸 생각나는 사람이 생겼을 때, 그 감정이 진짜인지 아닌지 스스로한테 계속 확인하게 되죠. 설레는 동시에 무서운 그 감각, 익숙하지 않아서 어쩔 줄 모르는 느낌이요. 특히 요즘처럼 마음이 예민해진 시기엔 더 그래요.

원래 당신은 확신이 생겼을 때 움직이고 싶은 사람이에요. 막 표현하기보다 한 번 재보고 싶은 거죠. 동양의 별은 지금 당신에게 새로운 시작을 열고 싶은 기운이 가득하다고 말하고, 서양의 별은 올봄이 당신에게 관계가 깊어지는 시기라고 속삭여요. 두 별이 같은 이야기를 하고 있어요.

지금 이 설렘은 억지로 분석하거나 끊어낼 필요가 없어요. 이런 감정이 찾아온 건 당신 마음이 그만큼 열려있다는 뜻이고, 그 자체로 이미 충분히 아름다운 신호예요.

오늘 그 사람한테 짧은 메시지 하나 보내봐요. 거창하지 않아도 돼요. 그 작은 한 발이 당신 안에 쌓인 망설임을 조금 풀어줄 거예요 🌸

이 설렘을 느낄 수 있는 당신이 저는 참 좋아요. 어떤 결과가 오든, 지금 이 두근거림은 당신 인생에서 가장 살아있는 순간 중 하나예요."`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userMessage, isChat, isReport, context } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: "userMessage가 없어요" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY 환경변수를 Vercel > Settings > Environment Variables 에 설정해주세요!"
    });
  }

  const today = getTodayStr();
  const system = buildSystem(today, !!isChat, !!isReport);

  // context는 사주/별자리/날짜 정보 — userMessage 앞에 붙여줌
  const fullMessage = context ? `${context}\n\n${userMessage}` : userMessage;

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
        system,
        messages: [{ role: "user", content: fullMessage }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "API 오류가 났어요"
      });
    }

    return res.status(200).json({ text: data.content?.[0]?.text || "" });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      error: "서버 오류가 났어요. 잠시 후 다시 시도해봐요 🌙"
    });
  }
}

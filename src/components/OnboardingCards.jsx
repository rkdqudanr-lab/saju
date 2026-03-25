import { useState } from "react";
import { OC, ON } from "../utils/saju.js";
import { REVIEWS } from "../utils/constants.js";

// ── 핵심 기능 소개 ──
const FEATURES_CORE = [
  {
    icon: "✦",
    title: "매일 별숨",
    subtitle: "오늘 나의 기운은?",
    desc: "매일 아침, 사주와 별자리로 오늘 하루를 미리 읽어드려요. 무엇을 조심하고, 무엇을 믿어야 할지.",
    color: "var(--gold)",
  },
  {
    icon: "🌙",
    title: "별숨에게 질문하기",
    subtitle: "무엇이든 물어봐요",
    desc: "연애, 직장, 돈, 인생… 당신만의 사주와 별자리를 아는 별숨이 진심으로 답해드려요.",
    color: "var(--lav)",
  },
  {
    icon: "📋",
    title: "월간 별숨 리포트",
    subtitle: "이번 달 흐름을 미리 알아요",
    desc: "한 달의 운세 흐름을 미리 읽고 준비하는 사람과, 그냥 흘려보내는 사람은 달라요.",
    color: "var(--teal)",
  },
];

const FEATURES_MORE = [
  { icon: "💞", title: "사이 별점", desc: "두 사람의 사주+별자리로 보는 진짜 궁합" },
  { icon: "📔", title: "별숨 일기", desc: "오늘 있었던 일을 별이 다시 읽어줘요" },
  { icon: "🌟", title: "종합 사주", desc: "기질·연애·재물·직업·건강을 한 번에" },
];

// ── 인트로 카드 ──
function IntroCard({ saju, sun }) {
  const domKey = saju?.dom || '금';
  return (
    <div style={{ textAlign: "center", padding: "8px 0 12px" }}>
      <div
        className="land-orb"
        style={{ margin: "0 auto 28px", transform: "scale(0.75)", transformOrigin: "center" }}
      >
        <div className="orb-core" />
        <div className="orb-r1" />
        <div className="orb-r2" />
      </div>
      <div
        style={{
          fontSize: "1.45rem",
          fontWeight: 700,
          color: "var(--t1)",
          letterSpacing: "-.01em",
          lineHeight: 1.45,
          marginBottom: 16,
        }}
      >
        당신의 별숨을<br />읽어드릴게요
      </div>
      <p
        style={{
          fontSize: "var(--sm)",
          color: "var(--t3)",
          lineHeight: 1.9,
          margin: "0 0 20px",
          whiteSpace: "pre-line",
        }}
      >
        {saju && sun
          ? `${ON[domKey]} 기운을 품은 ${sun.n}인 당신의\n사주와 별자리를 함께 읽어드릴게요.`
          : `사주와 별자리, 두 개의 언어로\n지금의 당신을 읽어드릴게요.`}
      </p>
      {saju && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <span
            style={{
              padding: "5px 14px",
              borderRadius: 20,
              background: `${OC[domKey]}18`,
              color: OC[domKey],
              border: `1px solid ${OC[domKey]}28`,
              fontSize: "var(--xs)",
            }}
          >
            {ON[domKey]} 기운
          </span>
          {sun && (
            <span
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                background: "var(--bg2)",
                color: "var(--t3)",
                border: "1px solid var(--line)",
                fontSize: "var(--xs)",
              }}
            >
              {sun.s} {sun.n}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── 핵심 기능 카드 ──
function CoreFeaturesCard() {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div
          style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--t1)", marginBottom: 6 }}
        >
          별숨과 함께 할 수 있는 것들
        </div>
        <div style={{ fontSize: "var(--xs)", color: "var(--t4)" }}>매일 당신 곁에 있을게요</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {FEATURES_CORE.map((f, i) => (
          <div
            key={i}
            style={{
              background: "var(--bg1)",
              border: "1px solid var(--line)",
              borderRadius: 18,
              padding: "18px 16px",
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
            }}
          >
            <div style={{ fontSize: "1.4rem", lineHeight: 1, marginTop: 2, flexShrink: 0 }}>
              {f.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}
              >
                <span style={{ fontSize: "var(--sm)", fontWeight: 700, color: "var(--t1)" }}>
                  {f.title}
                </span>
                <span style={{ fontSize: "var(--xs)", color: f.color, fontWeight: 500 }}>
                  {f.subtitle}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--xs)",
                  color: "var(--t3)",
                  lineHeight: 1.7,
                  wordBreak: "keep-all",
                }}
              >
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 추가 기능 + 후기 카드 ──
function MoreFeaturesCard() {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div
          style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--t1)", marginBottom: 6 }}
        >
          이런 기능들도 있어요
        </div>
        <div style={{ fontSize: "var(--xs)", color: "var(--t4)" }}>탐색하다 보면 더 깊어져요</div>
      </div>

      {/* 3개 소기능 카드 */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {FEATURES_MORE.map((f, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: "var(--bg1)",
              border: "1px solid var(--line)",
              borderRadius: 16,
              padding: "14px 10px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "1.3rem", marginBottom: 6 }}>{f.icon}</div>
            <div
              style={{
                fontSize: "var(--xs)",
                fontWeight: 700,
                color: "var(--t1)",
                marginBottom: 5,
              }}
            >
              {f.title}
            </div>
            <div
              style={{
                fontSize: "0.65rem",
                color: "var(--t4)",
                lineHeight: 1.5,
                wordBreak: "keep-all",
              }}
            >
              {f.desc}
            </div>
          </div>
        ))}
      </div>

      {/* 후기 카드 */}
      <div>
        <div
          style={{
            fontSize: "var(--xs)",
            color: "var(--t4)",
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          별숨과 함께한 분들이에요
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {REVIEWS.slice(0, 3).map((r, i) => (
            <div
              key={i}
              style={{
                background: "var(--bg1)",
                border: "1px solid var(--line)",
                borderRadius: 14,
                padding: "12px 14px",
              }}
            >
              <div style={{ fontSize: "0.65rem", color: "var(--gold)", marginBottom: 4 }}>
                {r.star}
              </div>
              <div
                style={{
                  fontSize: "var(--xs)",
                  color: "var(--t2)",
                  lineHeight: 1.65,
                  marginBottom: 5,
                  wordBreak: "keep-all",
                }}
              >
                "{r.text}"
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--t4)" }}>{r.nick}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──
export default function OnboardingCards({ saju, sun, onFinish }) {
  const [idx, setIdx] = useState(0);
  const TOTAL = 3;

  const next = () => {
    if (idx < TOTAL - 1) setIdx((i) => i + 1);
    else onFinish?.();
  };

  const cards = [
    <IntroCard key={0} saju={saju} sun={sun} />,
    <CoreFeaturesCard key={1} />,
    <MoreFeaturesCard key={2} />,
  ];

  return (
    <div className="page step-fade">
      <div className="inner" style={{ paddingTop: 20, paddingBottom: 80 }}>
        {/* 진행 표시 점 */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginBottom: 24,
          }}
        >
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === idx ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === idx ? "var(--gold)" : "var(--line)",
                transition: "all .3s ease",
              }}
            />
          ))}
        </div>

        {/* 카드 콘텐츠 */}
        <div key={idx} className="step-fade">
          {cards[idx]}
        </div>

        {/* 다음 / 시작 버튼 */}
        <div style={{ marginTop: 28 }}>
          <button className="btn-main" onClick={next} style={{ width: "100%" }}>
            {idx === TOTAL - 1 ? "별숨 시작하기 ✦" : "다음 →"}
          </button>
          {idx > 0 && idx < TOTAL - 1 && (
            <button
              onClick={() => onFinish?.()}
              style={{
                width: "100%",
                marginTop: 10,
                background: "none",
                border: "none",
                color: "var(--t4)",
                fontSize: "var(--xs)",
                fontFamily: "var(--ff)",
                cursor: "pointer",
                padding: "8px",
              }}
            >
              건너뛰기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

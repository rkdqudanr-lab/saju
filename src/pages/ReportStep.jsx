import { exportReadingAsTxt } from "../utils/constants.js";
import FeatureLoadingScreen from "../components/FeatureLoadingScreen.jsx";
import { parseTaggedResponse } from "../features/consultation/parsers/parseTaggedResponse.js";
import { parseScores } from "../features/consultation/parsers/parseScores.js";

const MONTHLY_TAGS = [
  "월간요약",
  "월간점수",
  "이번달핵심",
  "주차별가이드",
  "관계와감정",
  "일과돈",
  "건강과생활",
  "이번달피할것",
  "이번달실천",
  "행운색",
  "행운아이템",
  "별숨한마디",
];

const SCORE_LABELS = ["연애", "관계", "일/학업", "재물", "건강", "가족", "자기관리", "결정운", "휴식운"];

function parseMonthlyReport(text) {
  const parsed = parseTaggedResponse(text, MONTHLY_TAGS);
  const scoreList = parseScores(parsed.sections["월간점수"] || "");
  const scoreMap = Object.fromEntries(scoreList.map((item) => [item.label, item]));
  const weeks = { "1주차": "", "2주차": "", "3주차": "", "4주차": "" };

  (parsed.sections["주차별가이드"] || "").split("\n").forEach((line) => {
    const match = line.match(/^(1주차|2주차|3주차|4주차)\s*:\s*(.+)$/);
    if (match) weeks[match[1]] = match[2].trim();
  });

  const checklist = (parsed.sections["이번달실천"] || "")
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  return { parsed, scoreMap, weeks, checklist };
}

function getScoreTone(score) {
  if (score >= 80) return { color: "var(--gold)", glow: "rgba(232,176,72,.18)" };
  if (score >= 65) return { color: "#7EC8A4", glow: "rgba(126,200,164,.14)" };
  return { color: "#9BADCE", glow: "rgba(155,173,206,.14)" };
}

function ScoreBar({ label, score }) {
  const pct = Math.min(100, Math.max(0, score || 0));
  const tone = getScoreTone(pct);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ minWidth: 64, fontSize: "11px", color: "var(--t2)", fontWeight: 600 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: "var(--line)", borderRadius: 999, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${tone.glow} 0%, ${tone.color} 100%)`,
            transition: "width .7s ease-out",
          }}
        />
      </div>
      <span style={{ minWidth: 34, textAlign: "right", fontSize: "11px", fontWeight: 700, color: tone.color }}>{pct}</span>
    </div>
  );
}

function SectionCard({ title, body }) {
  if (!body) return null;
  return (
    <div style={{ background: "var(--bg2)", borderRadius: "var(--r2)", border: "1px solid var(--line)", padding: "18px", marginBottom: 16 }}>
      <div style={{ fontSize: "10px", color: "var(--gold)", fontWeight: 700, letterSpacing: ".05em", marginBottom: 12 }}>{title}</div>
      <div style={{ fontSize: "var(--sm)", color: "var(--t1)", lineHeight: 1.9, whiteSpace: "pre-line", wordBreak: "keep-all" }}>{body}</div>
    </div>
  );
}

export default function ReportStep({
  form,
  today,
  reportText,
  reportLoading,
  genReport,
  shareCard,
  shareResult,
  saveReportImage,
}) {
  const parsed = parseMonthlyReport(reportText);
  const hasTaggedContent = Boolean(parsed.parsed.sections["월간요약"] || parsed.parsed.sections["월간점수"]);

  return (
    <div className="page-top">
      <div className="inner report-page" style={{ maxWidth: 860, margin: "0 auto", paddingBottom: 80 }}>
        <div className="report-header" style={{ marginBottom: 18 }}>
          <div className="report-date">{today.year}년 {today.month}월 · {today.lunar}</div>
          <div className="report-title">{form.nickname || form.name || "별숨"}의<br />월간 리포트</div>
          <div className="report-name">이번 달을 어떻게 보내면 좋을지 한눈에 볼 수 있게 정리했어요.</div>
        </div>

        {!reportLoading && !reportText ? (
          <div style={{ textAlign: "center", padding: "var(--sp4) var(--sp3) var(--sp5)" }}>
            <div style={{ fontSize: "var(--sm)", color: "var(--t3)", lineHeight: 1.8, marginBottom: "var(--sp4)" }}>
              이번 달 점수와 행동 가이드를 바로 확인해보세요.
            </div>
            <button className="up-btn" style={{ maxWidth: 340, margin: "0 auto" }} onClick={genReport}>
              {today.month}월 월간 리포트 보기
            </button>
          </div>
        ) : reportLoading ? (
          <FeatureLoadingScreen type="report" />
        ) : (
          <div style={{ animation: "fadeUp .4s ease" }}>
            {parsed.parsed.sections["월간요약"] && (
              <div style={{ background: "linear-gradient(180deg, rgba(232,176,72,.12), rgba(0,0,0,0))", borderRadius: "var(--r2)", border: "1px solid var(--line)", padding: "18px", marginBottom: 16 }}>
                <div style={{ fontSize: "10px", color: "var(--gold)", fontWeight: 700, letterSpacing: ".05em", marginBottom: 10 }}>월간요약</div>
                <div style={{ fontSize: "var(--sm)", color: "var(--t1)", lineHeight: 1.8, whiteSpace: "pre-line" }}>{parsed.parsed.sections["월간요약"]}</div>
              </div>
            )}

            {Object.keys(parsed.scoreMap).length > 0 && (
              <div style={{ background: "var(--bg2)", borderRadius: "var(--r2)", border: "1px solid var(--line)", padding: "18px", marginBottom: 16 }}>
                <div style={{ fontSize: "10px", color: "var(--gold)", fontWeight: 700, letterSpacing: ".05em", marginBottom: 14 }}>월간점수</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {SCORE_LABELS.map((label) => (
                    <ScoreBar key={label} label={label} score={parsed.scoreMap[label]?.score ?? 60} />
                  ))}
                </div>
              </div>
            )}

            <SectionCard title="이번달핵심" body={parsed.parsed.sections["이번달핵심"]} />

            {parsed.parsed.sections["주차별가이드"] && (
              <div style={{ background: "var(--bg2)", borderRadius: "var(--r2)", border: "1px solid var(--line)", padding: "18px", marginBottom: 16 }}>
                <div style={{ fontSize: "10px", color: "var(--gold)", fontWeight: 700, letterSpacing: ".05em", marginBottom: 12 }}>주차별가이드</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {Object.entries(parsed.weeks).map(([week, body]) => (
                    <div key={week} style={{ border: "1px solid var(--line)", borderRadius: "var(--r1)", padding: "12px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: 6 }}>{week}</div>
                      <div style={{ fontSize: "var(--sm)", lineHeight: 1.8, color: "var(--t1)" }}>{body || "내용이 비어 있어요."}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <SectionCard title="관계와감정" body={parsed.parsed.sections["관계와감정"]} />
            <SectionCard title="일과돈" body={parsed.parsed.sections["일과돈"]} />
            <SectionCard title="건강과생활" body={parsed.parsed.sections["건강과생활"]} />

            {parsed.parsed.sections["이번달피할것"] && (
              <SectionCard title="이번달피할것" body={parsed.parsed.sections["이번달피할것"]} />
            )}

            {parsed.checklist.length > 0 && (
              <div style={{ background: "var(--bg2)", borderRadius: "var(--r2)", border: "1px solid var(--line)", padding: "18px", marginBottom: 16 }}>
                <div style={{ fontSize: "10px", color: "var(--gold)", fontWeight: 700, letterSpacing: ".05em", marginBottom: 12 }}>이번달실천</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {parsed.checklist.map((item) => (
                    <label key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "var(--r1)" }}>
                      <input type="checkbox" style={{ marginTop: 3 }} />
                      <span style={{ fontSize: "var(--sm)", lineHeight: 1.7, color: "var(--t1)" }}>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {(parsed.parsed.sections["행운색"] || parsed.parsed.sections["행운아이템"]) && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
                {parsed.parsed.sections["행운색"] && (
                  <div style={{ background: "var(--bg2)", borderRadius: "var(--r1)", border: "1px solid var(--line)", padding: "16px" }}>
                    <div style={{ fontSize: "10px", color: "var(--gold)", fontWeight: 700, marginBottom: 10 }}>행운색</div>
                    <div style={{ fontSize: "var(--sm)", color: "var(--t1)", fontWeight: 700, whiteSpace: "pre-line" }}>{parsed.parsed.sections["행운색"]}</div>
                  </div>
                )}
                {parsed.parsed.sections["행운아이템"] && (
                  <div style={{ background: "var(--bg2)", borderRadius: "var(--r1)", border: "1px solid var(--line)", padding: "16px" }}>
                    <div style={{ fontSize: "10px", color: "var(--gold)", fontWeight: 700, marginBottom: 10 }}>행운아이템</div>
                    <div style={{ fontSize: "var(--sm)", color: "var(--t1)", lineHeight: 1.7, whiteSpace: "pre-line" }}>{parsed.parsed.sections["행운아이템"]}</div>
                  </div>
                )}
              </div>
            )}

            <SectionCard title="별숨한마디" body={parsed.parsed.sections["별숨한마디"]} />

            {!hasTaggedContent && (
              <div style={{ background: "var(--bg2)", borderRadius: "var(--r2)", border: "1px solid var(--line)", padding: "18px", marginBottom: 16 }}>
                <div style={{ fontSize: "10px", color: "var(--gold)", fontWeight: 700, letterSpacing: ".05em", marginBottom: 12 }}>원문</div>
                <div style={{ fontSize: "var(--sm)", color: "var(--t1)", lineHeight: 1.9, whiteSpace: "pre-line", wordBreak: "keep-all" }}>
                  {reportText}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: "var(--sp2)", flexWrap: "wrap" }}>
              <button className="res-top-btn" style={{ flex: 1, minWidth: 100, padding: 12, borderRadius: "var(--r1)" }} onClick={() => (saveReportImage ? saveReportImage(reportText) : shareCard(0))}>대시보드 저장</button>
              <button className="res-top-btn" style={{ flex: 1, minWidth: 100, padding: 12, borderRadius: "var(--r1)" }} onClick={() => exportReadingAsTxt("월간리포트", reportText)}>텍스트 저장</button>
              <button className="res-top-btn primary" style={{ flex: 1, minWidth: 100, padding: 12, borderRadius: "var(--r1)" }} onClick={() => shareResult("report", reportText, "월간 리포트")}>공유하기</button>
            </div>

            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                onClick={genReport}
                style={{
                  padding: "9px 20px",
                  borderRadius: 20,
                  cursor: "pointer",
                  border: "1px solid var(--line)",
                  background: "transparent",
                  color: "var(--t4)",
                  fontSize: "var(--xs)",
                  fontFamily: "var(--ff)",
                }}
              >
                다시 보기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

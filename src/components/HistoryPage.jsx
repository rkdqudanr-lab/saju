import { useMemo, useState } from "react";
import { exportHistory } from "../utils/history.js";
import { HISTORY_SLOT_LABELS, inferHistoryFeature } from "../utils/historyFeatures.js";

export default function HistoryPage({ item, onBack, onDelete, onReplay }) {
  const [openIdx, setOpenIdx] = useState(0);
  const [deleted, setDeleted] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const inferred = useMemo(
    () => inferHistoryFeature(item?.questions || [], item?.answers || []),
    [item?.answers, item?.questions]
  );

  if (!item || deleted) return null;

  return (
    <div className="page-top">
      <div className="hist-page">
        <div className="hist-header">
          <div style={{ fontSize: "var(--xs)", color: "var(--t4)", marginBottom: 6 }}>
            {(HISTORY_SLOT_LABELS[item.slot] || "별숨 이야기")} · {item.date}
          </div>
          <div className="hist-title">지난 이야기</div>
          <div className="hist-sub">
            질문 {item.questions.length}개와 답변을 다시 이어볼 수 있어요
          </div>
        </div>

        <div className="hist-list">
          {item.questions.map((question, index) => {
            const isOpen = openIdx === index;
            return (
              <div key={`${item.id}-${index}`} className="hist-card">
                <div
                  className="hist-card-head"
                  onClick={() => setOpenIdx(isOpen ? -1 : index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setOpenIdx(isOpen ? -1 : index);
                    }
                  }}
                >
                  <div className="hch-left">
                    <div className="hch-date">Q{index + 1}</div>
                    <div className="hch-q">{question}</div>
                  </div>
                  <div className="hch-right" aria-hidden="true">
                    <span className={`hch-chevron ${isOpen ? "open" : ""}`}>⌄</span>
                  </div>
                </div>
                {isOpen && (
                  <div className="hist-card-body">
                    {item.answers[index] || "답변을 아직 불러오지 못했어요."}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: "0 var(--sp3) 10px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: "var(--xs)", color: "var(--t4)", fontWeight: 600 }}>
            같은 흐름으로 다시 이어가기
          </div>
          <button className="res-btn" style={{ width: "100%" }} onClick={() => onReplay?.(inferred.step)}>
            {inferred.label}
          </button>
          <button className="res-btn" style={{ width: "100%" }} onClick={() => onReplay?.(2)}>
            별숨에게 다시 물어보기
          </button>
        </div>

        <div style={{ padding: "0 var(--sp3) var(--sp5)", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="res-btn" style={{ flex: 1 }} onClick={onBack} aria-label="목록으로 돌아가기">
            돌아가기
          </button>
          <button className="res-btn" onClick={() => exportHistory([item])} aria-label="이 기록 내보내기">
            내보내기
          </button>
          {confirmDel ? (
            <>
              <button
                className="hist-del-btn"
                style={{ background: "var(--error, #e06)", color: "#fff" }}
                onClick={() => {
                  onDelete(item.id, item.supabaseId);
                  setDeleted(true);
                  onBack();
                }}
                aria-label="삭제 확인"
              >
                정말 삭제
              </button>
              <button className="res-btn" onClick={() => setConfirmDel(false)} aria-label="삭제 취소">
                취소
              </button>
            </>
          ) : (
            <button className="hist-del-btn" onClick={() => setConfirmDel(true)} aria-label="기록 삭제">
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

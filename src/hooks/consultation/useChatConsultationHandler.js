import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { getAuthToken } from "../useUserProfile.js";

const CHAT_ERROR_MESSAGE = "별과 연결이 끊겼어요 🌙 다시 시도해봐요.";

function sanitizeChatReply(text) {
  return String(text || "")
    .replace(/^\s*\[요약\][^\n]*\n?/i, "")
    .replace(/^\s*요약\s*[:：-]\s*[^\n]*\n?/i, "")
    .trimStart();
}

function compressChatHistory(history) {
  if (history.length <= 6) {
    return history.map((m) => `[${m.role === "ai" ? "별숨" : "나"}] ${m.text}`).join("\n");
  }
  const recent = history.slice(-6);
  const older = history.slice(0, -6);
  const summary = older.filter((m) => m.role === "ai").map((m) => m.text.slice(0, 70).replace(/\n/g, " ")).join(" / ");
  const recentText = recent.map((m) => `[${m.role === "ai" ? "별숨" : "나"}] ${m.text}`).join("\n");
  return `[이전 대화 요약] ${summary || "(없음)"}\n\n[최근 대화]\n${recentText}`;
}

function buildChatPrompt(prevQAs, prevChat, userMsg) {
  return `당신은 별숨입니다. 사용자의 사주와 별자리를 깊이 아는 친한 친구처럼, 메신저에서 티키타카하며 짧고 자연스럽게 대화해주세요.

반드시 지킬 규칙:
- 반말은 쓰지 말고, 다정다감한 존댓말만 사용하세요.
- 답변은 1~3문장 이내로 짧게 말하세요.
- 첫 문장은 질문에 대한 답만 바로 말하세요.
- 이유, 근거, 배경 설명은 사용자가 "왜?", "이유", "근거", "왜 그렇게 보여?"처럼 직접 물었을 때만 말하세요.
- 사용자가 이유를 묻지 않았다면 해설, 분석, 횟수, 주의사항을 먼저 길게 덧붙이지 마세요.
- "[요약]", "종합", "사주내용", "구성성분", "추천행동" 같은 소제목을 절대 쓰지 마세요.
- 번호 목록, 불렛, 줄바꿈 나열 없이 자연스러운 채팅 문장으로만 말하세요.
- 말투는 실제 채팅처럼 가볍고 짧게, 과하게 정리된 설명체는 피하세요.
- 이전 상담 흐름과 방금 질문을 바로 이어서 대화하세요.

[이전 상담 요약]
${prevQAs}

[이전 대화]
${prevChat}

[사용자 질문]
${userMsg}`;
}

export function useChatConsultationHandler({
  buildCtx,
  user,
  responseStyle,
  onLoginRequired,
  onSessionExpired,
  showToast,
  callApi,
  maxChat,
  selQs,
  answers,
  setShowUpgradeModal,
}) {
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatUsed, setChatUsed] = useState(0);
  const [latestChatIdx, setLatestChatIdx] = useState(-1);
  const chatLeft = maxChat - chatUsed;
  const chatEndRef = useRef(null);
  const streamAbortRef = useRef(null);

  useEffect(() => () => {
    if (streamAbortRef.current) streamAbortRef.current.abort();
  }, []);

  const sendChat = useCallback(async (overrideText) => {
    const rawText = overrideText ?? chatInput;
    if (!rawText.trim() || chatLoading) return;
    if (chatLeft <= 0) {
      if (typeof window.gtag === "function") window.gtag("event", "chat_limit_reached");
      setShowUpgradeModal(true);
      return;
    }
    if (typeof window.gtag === "function") window.gtag("event", "send_chat");
    const userMsg = rawText.trim();
    setChatInput("");
    setChatHistory((p) => [...p, { role: "user", text: userMsg }]);
    setChatLoading(true);
    const prevQAs = selQs.map((q, i) => `[질문 ${i + 1}] ${q}\n[답변] ${answers[i] || ""}`).join("\n\n");
    const prevChat = chatHistory.map((m) => `[${m.role === "ai" ? "별숨" : "나"}] ${m.text}`).join("\n");
    const chatPrompt = buildChatPrompt(prevQAs, prevChat, userMsg);
    try {
      const aiText = sanitizeChatReply(await callApi(chatPrompt, { isChat: true }));
      setChatUsed((p) => p + 1);
      setChatHistory((p) => {
        const updated = [...p, { role: "ai", text: aiText }];
        setLatestChatIdx(updated.length - 1);
        return updated;
      });
    } catch {
      setChatHistory((p) => [...p, { role: "ai", text: CHAT_ERROR_MESSAGE }]);
    } finally {
      setChatLoading(false);
    }
  }, [answers, callApi, chatHistory, chatInput, chatLeft, chatLoading, selQs, setShowUpgradeModal]);

  const generateChatSuggestions = useCallback(async () => {
    if (chatHistory.length > 0) return null;
    const prevQAs = selQs.map((q, i) => `[질문 ${i + 1}] ${q}\n[답변] ${(answers[i] || "").slice(0, 300)}`).join("\n\n");
    const prompt = `[이전 상담]\n${prevQAs}\n\n[요청]\n이전 상담 내용과 답변을 바탕으로, 사용자가 별숨에게 이어서 자연스럽게 물어볼 만한 후속 질문 5개를 생성해주세요.\n- 실제 채팅창에 바로 눌러 보내볼 수 있게 짧고 자연스러운 한국어 구어체로 작성해주세요\n- 보고서식 표현 말고 대화하듯 써주세요\n- 설명과 번호는 빼고 텍스트만 적어주세요\n1. [질문내용]\n2. [질문내용]\n3. [질문내용]\n4. [질문내용]\n5. [질문내용]`;
    try {
      const text = await callApi(prompt, { isChat: true });
      const lines = text.split("\n").map((l) => l.replace(/^\d+\.\s*/, "").replace(/^[-\*]\s*/, "").trim()).filter(Boolean).slice(0, 5);
      if (lines.length >= 3) return lines;
    } catch {
      return null;
    }
    return null;
  }, [answers, callApi, chatHistory.length, selQs]);

  const sendStreamChat = useCallback(async (overrideText) => {
    const rawText = overrideText ?? chatInput;
    if (!rawText.trim() || chatLoading) return;
    if (chatLeft <= 0) {
      if (typeof window.gtag === "function") window.gtag("event", "chat_limit_reached");
      setShowUpgradeModal(true);
      return;
    }
    if (typeof window.gtag === "function") window.gtag("event", "send_chat");
    const userMsg = rawText.trim();
    setChatInput("");
    const prevQAs = selQs.map((q, i) => `[질문 ${i + 1}] ${q}\n[답변] ${(answers[i] || "").slice(0, 150)}`).join("\n\n");
    const prevChat = compressChatHistory(chatHistory);
    const streamChatPrompt = buildChatPrompt(prevQAs, prevChat, userMsg);
    const chatContext = `${buildCtx()}\n\n[채팅 응답 규칙]\n이번 응답은 채팅 모드입니다. [요약], 제목, 섹션 헤더를 쓰지 말고 바로 대화체로 이어서 답하세요. 첫 문장을 요약처럼 시작하지 말고 자연스럽게 이어가세요.`;
    setChatHistory((p) => [...p, { role: "user", text: userMsg }, { role: "ai", text: "", streaming: true }]);
    setLatestChatIdx(-1);
    setChatLoading(true);
    try {
      if (streamAbortRef.current) streamAbortRef.current.abort();
      streamAbortRef.current = new AbortController();
      const signal = streamAbortRef.current.signal;

      const token = getAuthToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/ask", { // stream.js 대신 ask.js 사용 (isChat 플래그로 처리 가능하게 변경됨)
        method: "POST",
        headers,
        signal,
        body: JSON.stringify({
          userMessage: streamChatPrompt,
          context: chatContext,
          kakaoId: user?.id,
          isChat: true,
          responseStyle: responseStyle || "M",
          clientHour: new Date().getHours(),
        }),
      });
      if (res.status === 401) {
        if (typeof onSessionExpired === "function") onSessionExpired();
        if (typeof showToast === "function") showToast("세션이 만료되었어요 🌙 다시 로그인해주세요.", "warn");
        if (typeof onLoginRequired === "function") onLoginRequired();
        throw new Error("SESSION_EXPIRED");
      }
      if (!res.ok) throw new Error("스트림 API 오류");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      outer: while (true) {
        if (signal.aborted) {
          reader.cancel();
          break;
        }
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const raw = trimmed.slice(6);
          if (raw === "[DONE]") break outer;
          try {
            const evt = JSON.parse(raw);
            if (evt.text) {
              accumulated += evt.text;
              const sanitized = sanitizeChatReply(accumulated);
              setChatHistory((p) => p.map((m, i) => i === p.length - 1 ? { ...m, text: sanitized } : m));
            }
          } catch {
            // ignore parse errors
          }
        }
      }
      if (!signal.aborted) {
        setChatUsed((p) => p + 1);
        setChatHistory((p) => {
          const lastIdx = p.length - 1;
          setLatestChatIdx(lastIdx);
          return p.map((m, i) => i === lastIdx ? { ...m, text: sanitizeChatReply(m.text), streaming: false } : m);
        });
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setChatHistory((p) => {
        const copy = [...p];
        const last = copy.length - 1;
        if (copy[last]?.role === "ai") copy[last] = { role: "ai", text: CHAT_ERROR_MESSAGE, streaming: false };
        return copy;
      });
    } finally {
      setChatLoading(false);
    }
  }, [answers, buildCtx, chatHistory, chatInput, chatLeft, chatLoading, onLoginRequired, onSessionExpired, responseStyle, selQs, setShowUpgradeModal, showToast, user?.id]);

  const resetSession = useCallback(() => {
    setChatHistory([]);
    setChatUsed(0);
  }, []);

  return useMemo(() => ({
    chatHistory,
    chatInput,
    chatLoading,
    chatUsed,
    chatLeft,
    latestChatIdx,
    chatEndRef,
    setChatInput,
    setLatestChatIdx,
    generateChatSuggestions,
    sendChat,
    sendStreamChat,
    resetSession,
  }), [chatHistory, chatInput, chatLoading, chatUsed, chatLeft, latestChatIdx, generateChatSuggestions, sendChat, sendStreamChat, resetSession]);
}

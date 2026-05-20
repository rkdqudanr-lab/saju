import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { readStreamResponse } from "../../lib/streamTransport.js";
import { loadAnalysisCache, saveAnalysisCache } from "../../lib/analysisCache.js";
import { isLocalLayoutUser } from "../../utils/localLayoutMode.js";

const CHAT_SESSION_KEY = 'last_chat_session';

const CHAT_ERROR_MESSAGE = "별과 연결이 잠시 끊겼어요. 다시 시도해볼까요?";

function sanitizeChatReply(text) {
  if (!text) return "";
  let sanitized = String(text)
    .replace(/^\s*\[?요약\][^\n]*\n?/i, "")
    .replace(/^\s*요약\s*[:：]\s*[^\n]*\n?/i, "");

  // 스트리밍 중 첫 글자가 [ 또는 요 등으로 시작할 때 잠깐 보였다가 사라지는 현상 방지
  // 핵심 패턴의 시작 부분만 있는 경우 빈 문자열 반환
  if (sanitized.length > 0 && sanitized.length < 4) {
    if (/^\s*\[?요?약?\]?$/i.test(sanitized)) {
      return "";
    }
  }

  return sanitized.trimStart();
}

function compressChatHistory(history) {
  if (history.length <= 6) {
    return history.map((message) => `[${message.role === "ai" ? "별숨" : "나"}] ${message.text}`).join("\n");
  }

  const recent = history.slice(-6);
  const older = history.slice(0, -6);
  const summary = older
    .filter((message) => message.role === "ai")
    .map((message) => message.text.slice(0, 70).replace(/\n/g, " "))
    .join(" / ");
  const recentText = recent
    .map((message) => `[${message.role === "ai" ? "별숨" : "나"}] ${message.text}`)
    .join("\n");

  return `[이전 대화 요약] ${summary || "(없음)"}\n\n[최근 대화]\n${recentText}`;
}

function buildChatPrompt(prevQAs, prevChat, userMsg, dailySeed = '') {
  const seedSection = dailySeed
    ? `\n[오늘의 별숨 — 이 맥락을 바탕으로 코칭 질문을 자연스럽게 이어가세요]\n${dailySeed}\n`
    : '';
  return `당신은 별숨입니다. 사용자의 사주와 별자리를 깊이 이해하는 친한 친구처럼, 메신저 대화창에서 톡하듯 짧고 자연스럽게 대답해주세요.

반드시 지킬 규칙:
- 반말은 쓰지 말고, 다정한 존댓말만 사용해주세요.
- 사용자가 반말이나 친한 말투로 말해도 따라하지 말고 끝까지 존댓말을 유지해주세요.
- 문장 끝은 "~해요", "~예요", "~드릴게요", "~해보세요" 같은 존댓말로만 마무리해주세요.
- 답변은 1~3문장 이내로 짧게 말해주세요.
- 첫 문장은 질문에 대한 대답만 바로 말해주세요.
- 이유, 근거, 배경 설명은 사용자가 "왜", "이유", "근거", "왜 그렇게 보여?"처럼 직접 물었을 때만 말해주세요.
- 사용자가 이유를 묻지 않았다면 해설, 분석, 점수, 주의사항을 먼저 길게 덧붙이지 마세요.
- "[요약]", "종합", "사주해석", "구성성분", "추천행동" 같은 표제어를 절대 쓰지 마세요.
- 번호 목록, 불릿, 줄바꿈 나열 없이 자연스러운 채팅 문장으로만 말해주세요.
- 말투는 실제 채팅처럼 가볍고 짧게, 교과서처럼 정리된 설명체는 피해주세요.
- 이전 상담 흐름과 방금 질문을 바로 이어서 대화해주세요.
- [오늘의 별숨] 맥락이 있다면, 운세에서 낮은 영역을 자연스럽게 언급하며 사용자가 그 부분을 구체적으로 말하도록 유도하세요.
${seedSection}
[이전 상담 요약]
${prevQAs}

[이전 대화]
${prevChat}

[사용자 질문]
${userMsg}`;
}

function applyFinalChatMessage(setChatHistory, setLatestChatIdx, text) {
  setChatHistory((prev) => {
    const lastIdx = prev.length - 1;
    setLatestChatIdx(lastIdx);
    return prev.map((message, index) => (
      index === lastIdx
        ? { ...message, text: sanitizeChatReply(text), streaming: false }
        : message
    ));
  });
}

function persistChatSession(userId, questions, messages) {
  if (!userId || !questions?.length) return;
  const clean = messages.filter((m) => !m.streaming).map(({ role, text }) => ({ role, text }));
  saveAnalysisCache(userId, CHAT_SESSION_KEY, JSON.stringify({ questions, messages: clean }));
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
  dailyResult = null,
}) {
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatUsed, setChatUsed] = useState(0);
  const [latestChatIdx, setLatestChatIdx] = useState(-1);
  const chatLeft = maxChat - chatUsed;
  const chatEndRef = useRef(null);
  const streamAbortRef = useRef(null);

  // 오늘 운세 시드 — 처음 채팅 진입 시 AI 코칭 컨텍스트로 주입
  const dailySeed = useMemo(() => {
    if (!dailyResult?.text || !dailyResult?.score) return '';
    const lines = dailyResult.text.split('\n').map(l => l.trim()).filter(Boolean);
    const summaryLine = lines.find(l => l.startsWith('[요약]') || l.startsWith('요약:')) || '';
    const summary = summaryLine.replace(/^\[?요약\]?[:：]?\s*/i, '').slice(0, 80);
    return `오늘 별숨 점수: ${dailyResult.score}점${summary ? `\n오늘 요약: ${summary}` : ''}`;
  }, [dailyResult?.score, dailyResult?.text]);

  // 세션 복원: 같은 질문 세트의 채팅이 캐시에 있으면 불러오기
  useEffect(() => {
    if (!user?.id || !selQs?.length) return;
    loadAnalysisCache(user.id, CHAT_SESSION_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        const sameSession =
          Array.isArray(saved.questions) &&
          saved.questions.length === selQs.length &&
          saved.questions.every((q, i) => q === selQs[i]);
        if (sameSession && Array.isArray(saved.messages) && saved.messages.length > 0) {
          const restored = saved.messages.map((m, i) => i === 0 ? { ...m, restored: true } : m);
          setChatHistory(restored);
          setChatUsed(restored.filter((m) => m.role === "user").length);
          setLatestChatIdx(restored.length - 1);
        }
      } catch {}
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
    setChatHistory((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatLoading(true);

    const prevQAs = selQs
      .map((question, index) => `[질문 ${index + 1}] ${question}\n[답변] ${answers[index] || ""}`)
      .join("\n\n");
    const prevChat = chatHistory
      .map((message) => `[${message.role === "ai" ? "별숨" : "나"}] ${message.text}`)
      .join("\n");
    const seed = chatHistory.length === 0 ? dailySeed : '';
    const chatPrompt = buildChatPrompt(prevQAs, prevChat, userMsg, seed);

    try {
      const aiText = sanitizeChatReply(await callApi(chatPrompt, { isChat: true }));
      setChatUsed((prev) => prev + 1);
      setChatHistory((prev) => {
        const updated = [...prev, { role: "ai", text: aiText }];
        setLatestChatIdx(updated.length - 1);
        persistChatSession(user?.id, selQs, updated);
        return updated;
      });
    } catch {
      setChatHistory((prev) => [...prev, { role: "ai", text: CHAT_ERROR_MESSAGE }]);
    } finally {
      setChatLoading(false);
    }
  }, [answers, callApi, chatHistory, chatInput, chatLeft, chatLoading, selQs, setShowUpgradeModal, user?.id]);

  const generateChatSuggestions = useCallback(async () => {
    if (chatHistory.length > 0) return null;

    const prevQAs = selQs
      .map((question, index) => `[질문 ${index + 1}] ${question}\n[답변] ${(answers[index] || "").slice(0, 300)}`)
      .join("\n\n");
    const prompt = `[이전 상담]\n${prevQAs}\n\n[요청]\n이전 상담 내용과 답변을 바탕으로, 사용자가 별숨에게 이어서 자연스럽게 물어볼 만한 후속 질문 5개를 생성해주세요.
- 실제 채팅창에 바로 눌러 보내도 어색하지 않게 짧고 자연스러운 구어체로 작성해주세요
- 보고서식 표현 말고 대화하듯 써주세요
- 설명과 번호만 빼고 텍스트만 적어주세요
1. [질문내용]
2. [질문내용]
3. [질문내용]
4. [질문내용]
5. [질문내용]`;

    try {
      const text = await callApi(prompt, { isChat: true });
      const lines = text
        .split("\n")
        .map((line) => line.replace(/^\d+\.\s*/, "").replace(/^[-*]\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 5);
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

    const prevQAs = selQs
      .map((question, index) => `[질문 ${index + 1}] ${question}\n[답변] ${(answers[index] || "").slice(0, 150)}`)
      .join("\n\n");
    const prevChat = compressChatHistory(chatHistory);
    const seed = chatHistory.length === 0 ? dailySeed : '';
    const streamChatPrompt = buildChatPrompt(prevQAs, prevChat, userMsg, seed);
    const chatContext = `${buildCtx()}\n\n[채팅 응답 규칙]\n이번 응답은 채팅 모드입니다. [요약], 제목, 섹션 헤더를 쓰지 말고 바로 대화체로 이어서 말해주세요. 첫 문장을 요약처럼 시작하지 말고 자연스럽게 이어가세요. 반말은 금지하고, 사용자가 어떤 말투로 쓰더라도 끝까지 존댓말만 유지해주세요.`;

    setChatHistory((prev) => [...prev, { role: "user", text: userMsg }, { role: "ai", text: "", streaming: true }]);
    setLatestChatIdx(-1);
    setChatLoading(true);

    // 사용자가 요청한 자연스러운 연출을 위한 1초 지연 (AI가 생각하는 시간)
    await new Promise(r => setTimeout(r, 1000));

    try {
      if (isLocalLayoutUser(user)) {
        const mockText = "로컬 레이아웃 점검용 채팅 응답입니다. 실제 API 호출 없이 말풍선, 입력창, 스크롤 위치, 저장 흐름만 확인할 수 있게 채웠어요.";
        setChatHistory((prev) => {
          const updated = prev.map((message, index) => (
            index === prev.length - 1 ? { role: "ai", text: mockText, streaming: false } : message
          ));
          persistChatSession(user?.id, selQs, updated);
          return updated;
        });
        setChatUsed((prev) => prev + 1);
        setLatestChatIdx(chatHistory.length + 1);
        return;
      }

      if (streamAbortRef.current) streamAbortRef.current.abort();
      streamAbortRef.current = new AbortController();
      const signal = streamAbortRef.current.signal;

      const headers = { "Content-Type": "application/json" };

      const res = await fetch("/api/stream", {
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
        if (typeof showToast === "function") showToast("세션이 만료됐어요. 다시 로그인해주세요.", "warn");
        if (typeof onLoginRequired === "function") onLoginRequired();
        throw new Error("SESSION_EXPIRED");
      }
      if (!res.ok) throw new Error("STREAM_API_ERROR");

      const streamResult = await readStreamResponse(res, {
        fallbackError: CHAT_ERROR_MESSAGE,
        onText: (text) => {
          const sanitized = sanitizeChatReply(text);
          setChatHistory((prev) => prev.map((message, index) => (
            index === prev.length - 1 ? { ...message, text: sanitized } : message
          )));
        },
        onError: (message) => {
          throw new Error(message);
        },
      });

      if (!signal.aborted) {
        setChatUsed((prev) => prev + 1);
        applyFinalChatMessage(setChatHistory, setLatestChatIdx, streamResult.text || "");
        setChatHistory((prev) => { persistChatSession(user?.id, selQs, prev); return prev; });
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
      setChatHistory((prev) => {
        const copy = [...prev];
        const last = copy.length - 1;
        if (copy[last]?.role === "ai") {
          copy[last] = { role: "ai", text: CHAT_ERROR_MESSAGE, streaming: false };
        }
        return copy;
      });
    } finally {
      setChatLoading(false);
    }
  }, [answers, buildCtx, chatHistory, chatInput, chatLeft, chatLoading, onLoginRequired, onSessionExpired, responseStyle, selQs, setShowUpgradeModal, showToast, user?.id]);

  const resetSession = useCallback(() => {
    setChatHistory([]);
    setChatUsed(0);
    if (user?.id) saveAnalysisCache(user.id, CHAT_SESSION_KEY, null);
  }, [user?.id]);

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

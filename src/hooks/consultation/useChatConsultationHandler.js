import { useState, useRef, useEffect, useCallback } from "react";
import { getAuthToken } from "../useUserProfile.js";

const CHAT_ERROR_MESSAGE = "?? ?좉퉸 ?곌껐???딄꼈?댁슂 ?뙔 ?ㅼ떆 ?쒕룄?대킄??";

function sanitizeChatReply(text) {
  return String(text || "")
    .replace(/^\s*\[요약\][^\n]*\n?/i, "")
    .replace(/^\s*요약\s*[:：-]\s*[^\n]*\n?/i, "")
    .trimStart();
}

function compressChatHistory(history) {
  if (history.length <= 6) {
    return history.map((m) => `[${m.role === "ai" ? "蹂꾩닲" : "??"}] ${m.text}`).join("\n");
  }
  const recent = history.slice(-6);
  const older = history.slice(0, -6);
  const summary = older.filter((m) => m.role === "ai").map((m) => m.text.slice(0, 70).replace(/\n/g, " ")).join(" / ");
  const recentText = recent.map((m) => `[${m.role === "ai" ? "蹂꾩닲" : "??"}] ${m.text}`).join("\n");
  return `[?댁쟾 ????붿빟] ${summary || "(?놁쓬)"}\n\n[理쒓렐 ???\n${recentText}`;
}

function buildChatPrompt(prevQAs, prevChat, userMsg) {
  return `?뱀떊? 蹂꾩닲?낅땲?? ?ъ슜?먯쓽 ?ъ＜? 蹂꾩옄由щ? 源딆씠 ?꾨뒗 移쒗븳 移쒓뎄泥섎읆, 硫붿떊??먯꽌 ?고궎?移댄븯??吏㏐퀬 ?먯뿰?ㅻ읇寃??듯빐二쇱꽭??

諛섎뱶??吏??洹쒖튃:
- 諛섎쭚? ?곗? 留먭퀬, ?ㅼ젙??議대뙎留먮쭔 ?ъ슜?섏꽭??
- ?듬?? 1~3臾몄옣 ?대궡濡?吏㏐쾶 留먰븯?몄슂.
- 泥?臾몄옣? 吏덈Ц??????듬쭔 諛붾줈 留먰븯?몄슂.
- ?댁쑀, 洹쇨굅, 諛곌꼍 ?ㅻ챸? ?ъ슜?먭? "??, "?댁쑀", "洹쇨굅", "??洹몃젃寃?蹂댁뿬?"泥섎읆 吏곸젒 臾쇱뿀???뚮쭔 留먰븯?몄슂.
- ?ъ슜?먭? ?댁쑀瑜?臾살? ?딆븯?쇰㈃ ?댁꽕, 遺꾩꽍, ?덉닔, 二쇱쓽?ы빆??癒쇱? 湲멸쾶 ?㏓텤?댁? 留덉꽭??
- "[?붿빟]", "醫낇빀", "?ъ＜?댁슜", "?먯꽦??, "異붿쿇?됰룞" 媛숈? ?뚯젣紐⑹쓣 ?덈? ?곗? 留덉꽭??
- 踰덊샇 紐⑸줉, 遺덈┸, 以꾨컮轅??섏뿴 ?놁씠 ?먯뿰?ㅻ윭??梨꾪똿 臾몄옣?쇰줈留??듯븯?몄슂.
- 留먰닾???ㅼ젣 梨꾪똿泥섎읆 媛蹂띻퀬 吏㏐쾶, 怨쇳븯寃??뺣━???ㅻ챸泥대뒗 ?쇳븯?몄슂.
- ?댁쟾 ?곷떞 ?먮쫫怨?諛⑷툑 吏덈Ц??諛붾줈 ?댁뼱???듯븯?몄슂.

[?댁쟾 ?곷떞 ?붿빟]
${prevQAs}

[?댁쟾 ???
${prevChat}

[?ъ슜??吏덈Ц]
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
    const prevQAs = selQs.map((q, i) => `[吏덈Ц ${i + 1}] ${q}\n[?듬?] ${answers[i] || ""}`).join("\n\n");
    const prevChat = chatHistory.map((m) => `[${m.role === "ai" ? "蹂꾩닲" : "??"}] ${m.text}`).join("\n");
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
    const prevQAs = selQs.map((q, i) => `[吏덈Ц ${i + 1}] ${q}\n[?듬?] ${(answers[i] || "").slice(0, 300)}`).join("\n\n");
    const prompt = `[?댁쟾 ?곷떞]\n${prevQAs}\n\n[?붿껌]\n?댁쟾 ?곷떞 ?댁슜怨??묐떟??諛뷀깢?쇰줈, ?ъ슜?먭? 蹂꾩닲?먭쾶 ?댁뼱???먯뿰?ㅻ읇寃?臾쇱뼱蹂?留뚰븳 ?꾩냽 吏덈Ц 5媛쒕? ?앹꽦?댁＜?몄슂.\n- ?ㅼ젣 梨꾪똿李쎌뿉 諛붾줈 ?뚮윭 蹂대궪 ???덇쾶 吏㏐퀬 ?먯뿰?ㅻ윭???쒓뎅??援ъ뼱泥대줈 ?묒꽦?댁＜?몄슂\n- 蹂닿퀬?쒖떇 ?쒗쁽 留먭퀬 ??뷀븯???⑥＜?몄슂\n- ?ㅻ챸怨?踰덊샇??鍮쇨퀬 ?띿뒪?몃쭔 ?곸뼱二쇱꽭??n1. [吏덈Ц?댁슜]\n2. [吏덈Ц?댁슜]\n3. [吏덈Ц?댁슜]\n4. [吏덈Ц?댁슜]\n5. [吏덈Ц?댁슜]`;
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
    const prevQAs = selQs.map((q, i) => `[吏덈Ц ${i + 1}] ${q}\n[?듬?] ${(answers[i] || "").slice(0, 150)}`).join("\n\n");
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
        if (typeof showToast === "function") showToast("?몄뀡??留뚮즺?먯뼱?? ?ㅼ떆 濡쒓렇?명빐二쇱꽭???뙔", "warn");
        if (typeof onLoginRequired === "function") onLoginRequired();
        throw new Error("SESSION_EXPIRED");
      }
      if (!res.ok) throw new Error("?ㅽ듃由щ컢 API ?ㅻ쪟");

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

  return {
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
  };
}

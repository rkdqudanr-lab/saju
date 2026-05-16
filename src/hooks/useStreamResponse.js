import { useState, useCallback, useRef } from "react";
import { useAppStore } from "../store/useAppStore.js";
import { DEFAULT_STREAM_ERROR, readStreamResponse } from "../lib/streamTransport.js";

function getLocalStreamText(payload = {}) {
  if (payload.isDream) {
    return `[꿈요약]
넓은 바다와 금색 문은 감정의 흐름 속에서 새로운 선택지를 발견하는 장면으로 볼 수 있어요.

[감정점수]
72

[한줄해석]
불안보다 기대가 더 큰 변화의 신호예요.

[꿈요소]
바다는 마음의 깊이를, 금색 문은 아직 열어보지 않은 가능성을 뜻해요.

[무의식해석]
최근 스스로에게 더 넓은 방향을 허락하고 싶은 마음이 커진 듯합니다.

[현실연결]
새로운 제안이나 관계 변화 앞에서 망설이고 있을 수 있어요.

[주의할점]
확신이 생기기 전에 너무 빨리 약속하지 않는 편이 좋아요.

[오늘할일]
1. 마음에 걸리는 선택지를 적어보기
2. 바로 결정하지 말고 하루 더 보기
3. 물을 충분히 마시고 산책하기

[나에게묻기]
나는 지금 어떤 문 앞에서 망설이고 있나요?

[별숨한마디]
문은 이미 보였으니, 이제 천천히 손잡이를 확인하면 됩니다.`;
  }

  if (payload.isTarot) {
    return `[카드]
The Star

[현재]
회복과 방향 확인이 필요한 시기입니다.

[흐름]
급하게 답을 내기보다 희망이 남아 있는 쪽을 살피세요.

[조언]
작은 신호를 기록하면 다음 선택이 더 쉬워집니다.`;
  }

  return `[요약]
로컬 레이아웃 점검용 스트리밍 응답입니다.

[해석]
실제 API 호출 없이 결과 카드, 로딩, 저장 버튼, 공유 버튼의 배치만 확인할 수 있도록 채운 샘플입니다.

[조언]
화면 잘림과 버튼 위치를 중심으로 확인하세요.`;
}

export function useStreamResponse() {
  const [streamText, setStreamText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const abortRef = useRef(null);
  const user = useAppStore((state) => state.user);

  const startStream = useCallback(async (payload) => {
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setStreamText("");
    setStreamError(null);
    setIsStreaming(true);

    try {
      if (import.meta.env.DEV && !import.meta.env.VITE_REAL_API && user?.id === "test_user_id") {
        await new Promise((r) => setTimeout(r, 650));
        setStreamText(getLocalStreamText(payload));
        return;
      }

      const headers = { "Content-Type": "application/json" };

      const res = await fetch("/api/stream", {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          kakaoId: user?.id,
          ...payload,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStreamError(data.error || DEFAULT_STREAM_ERROR);
        return;
      }

      await readStreamResponse(res, {
        fallbackError: DEFAULT_STREAM_ERROR,
        onText: (text) => setStreamText(text),
        onError: (message) => setStreamError(message),
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        setStreamError(DEFAULT_STREAM_ERROR);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [user?.id]);

  const resetStream = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setStreamText("");
    setStreamError(null);
    setIsStreaming(false);
  }, []);

  return { streamText, isStreaming, streamError, startStream, resetStream };
}

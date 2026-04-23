import { useState, useCallback, useRef } from "react";
import { getAuthToken } from "./useUserProfile.js";
import { useAppStore } from "../store/useAppStore.js";
import { DEFAULT_STREAM_ERROR, readStreamResponse } from "../lib/streamTransport.js";

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
      const token = getAuthToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

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

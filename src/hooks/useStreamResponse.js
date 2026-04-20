/**
 * useStreamResponse — 별숨 SSE 스트리밍 공통 훅
 *
 * /api/stream 엔드포인트를 사용해 실시간 텍스트 스트리밍을 처리해요.
 * TarotPage, DreamPage, ComprehensivePage 등 긴 AI 응답이 필요한 곳에서 사용해요.
 *
 * 사용 예시:
 *   const { streamText, isStreaming, streamError, startStream, resetStream } = useStreamResponse();
 *   await startStream({ userMessage: '...', context: ctx, isChat: true });
 */

import { useState, useCallback, useRef } from 'react';
import { getAuthToken } from './useUserProfile.js';
import { useAppStore } from '../store/useAppStore.js';

export function useStreamResponse() {
  const [streamText, setStreamText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const abortRef = useRef(null);
  const user = useAppStore((s) => s.user);

  /**
   * 스트리밍 시작
   * @param {Object} payload - /api/stream 요청 바디
   *   userMessage, context, isChat, isReport, isLetter, 등 모드 플래그
   *   kakaoId, responseStyle, clientHour, precision_level 등 포함 가능
   */
  const startStream = useCallback(async (payload) => {
    // 진행 중인 스트림 중단
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStreamText('');
    setStreamError(null);
    setIsStreaming(true);

    try {
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/stream', {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          kakaoId: user?.id,
          ...payload,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStreamError(data.error || '연결 오류가 발생했어요 🌙');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const raw = trimmed.slice(6);
          if (raw === '[DONE]') continue;

          try {
            const evt = JSON.parse(raw);
            if (evt.error) {
              setStreamError(evt.error);
              return;
            }
            if (evt.text) {
              accumulated += evt.text;
              setStreamText(accumulated);
            }
          } catch { /* 파싱 실패 라인 무시 */ }
        }
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setStreamError('잠깐 별이 바빠요 🌙 다시 시도해봐요.');
      }
    } finally {
      setIsStreaming(false);
    }
  }, [user?.id]);

  /** 스트림 초기화 (컴포넌트 언마운트 또는 재시작 전 호출) */
  const resetStream = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setStreamText('');
    setStreamError(null);
    setIsStreaming(false);
  }, []);

  return { streamText, isStreaming, streamError, startStream, resetStream };
}

export const DEFAULT_STREAM_ERROR = "연결 중 문제가 생겼어요. 다시 시도해주세요.";

export async function readStreamResponse(res, { onText, onError, fallbackError = DEFAULT_STREAM_ERROR }) {
  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("text/event-stream")) {
    const data = await res.json().catch(() => ({}));
    if (data?.text) {
      onText?.(String(data.text));
      return { ok: true, text: String(data.text), mode: "json" };
    }
    const errorMessage = data?.error || fallbackError;
    onError?.(errorMessage);
    return { ok: false, error: errorMessage, mode: "json" };
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError?.(fallbackError);
    return { ok: false, error: fallbackError, mode: "stream" };
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;

      const raw = trimmed.slice(6);
      if (raw === "[DONE]") continue;

      try {
        const event = JSON.parse(raw);
        if (event.error) {
          onError?.(event.error);
          return { ok: false, error: event.error, mode: "stream" };
        }
        if (event.text) {
          accumulated += event.text;
          onText?.(accumulated, event.text);
        }
      } catch {
        // Ignore malformed event lines.
      }
    }
  }

  return { ok: true, text: accumulated, mode: "stream" };
}

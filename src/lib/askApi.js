import { getAuthToken } from "../hooks/useUserProfile.js";

export async function postAsk(payload, options = {}) {
  const token = getAuthToken();
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch("/api/ask", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data.error || `API error (${res.status})`);
  }

  return data;
}

export async function postAskText(payload, options = {}) {
  const data = await postAsk(payload, options);
  return data.text || "";
}

/** Raw fetch — Response 객체를 그대로 반환. 401 처리 등 직접 검사가 필요한 곳에서 사용. */
export async function postAskRaw(payload, options = {}) {
  const token = getAuthToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch("/api/ask", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: options.signal,
  });
}

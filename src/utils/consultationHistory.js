import { getAuthenticatedClient, supabase } from "../lib/supabase.js";

function formatHistoryDate(date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate()
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export function getCurrentHistorySlot() {
  const hour = new Date().getHours();
  if (hour < 6) return "dawn";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export async function saveConsultationHistoryEntry({
  user,
  questions = [],
  answers = [],
  consentFlags,
  slot = getCurrentHistorySlot(),
}) {
  if (!user?.id || !supabase || consentFlags?.history === false) return null;

  const client = getAuthenticatedClient(user.id) || supabase;
  let supabaseUserId = user.supabaseId || null;

  if (!supabaseUserId) {
    const { data: userRow } = await client
      .from("users")
      .select("id")
      .eq("kakao_id", String(user.id))
      .maybeSingle();

    supabaseUserId = userRow?.id || null;
  }

  if (!supabaseUserId) return null;

  const { data, error } = await client
    .from("consultation_history")
    .insert({
      user_id: supabaseUserId,
      questions,
      answers,
      slot,
    })
    .select("id, created_at")
    .single();

  if (error) throw error;

  const createdAt = data?.created_at ? new Date(data.created_at) : new Date();
  return {
    id: data?.id,
    supabaseId: data?.id,
    questions,
    answers,
    slot,
    ts: createdAt.getTime(),
    date: formatHistoryDate(createdAt),
  };
}

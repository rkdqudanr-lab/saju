// quiz.js — localStorage 미사용, 상태는 Supabase users.quiz_state 저장

export function loadQuiz() {
  return { answers: {}, nextQIdx: 0, lastAnsweredDate: '' };
}

export function saveQuiz(_state) {}

export function getTodayStr() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isTodayAnswered(quiz) {
  return quiz.lastAnsweredDate === getTodayStr();
}

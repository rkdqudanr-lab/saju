// quiz.js — localStorage 미사용, 상태는 Supabase users.quiz_state 저장

export function loadQuiz() {
  return { answers: {}, nextQIdx: 0, lastAnsweredDate: '' };
}

export function saveQuiz(_state) {}

export function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function isTodayAnswered(quiz) {
  return quiz.lastAnsweredDate === getTodayStr();
}

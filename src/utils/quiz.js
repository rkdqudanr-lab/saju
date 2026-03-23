const QUIZ_KEY = 'byeolsoom_quiz';

export function loadQuiz() {
  try {
    return JSON.parse(localStorage.getItem(QUIZ_KEY)) || { answers: {}, nextQIdx: 0, lastAnsweredDate: '' };
  } catch {
    return { answers: {}, nextQIdx: 0, lastAnsweredDate: '' };
  }
}

export function saveQuiz(state) {
  try { localStorage.setItem(QUIZ_KEY, JSON.stringify(state)); } catch {}
}

export function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function isTodayAnswered(quiz) {
  return quiz.lastAnsweredDate === getTodayStr();
}

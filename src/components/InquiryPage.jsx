/**
 * InquiryPage — 문의하기
 * 버그 신고 · 기능 제안 · 결제 문의 · 기타 문의 폼 + 내 문의 내역
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { getAuthenticatedClient } from '../lib/supabase.js';

const CATEGORIES = [
  { value: 'bug', label: '🐛 버그 신고' },
  { value: 'feature', label: '💡 기능 제안' },
  { value: 'payment', label: '💳 결제 문의' },
  { value: 'other', label: '💬 기타' },
];

const STATUS_LABELS = {
  pending: { text: '접수 완료', color: 'var(--gold)' },
  in_progress: { text: '처리 중', color: '#6BBFB5' },
  resolved: { text: '답변 완료', color: '#9B8EC4' },
};

function InquiryHistoryItem({ item }) {
  const cat = CATEGORIES.find(c => c.value === item.category);
  const status = STATUS_LABELS[item.status] ?? STATUS_LABELS.pending;
  const date = new Date(item.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });

  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 'var(--r1)',
      border: '1px solid var(--line)',
      background: 'var(--bg1)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 'var(--xs)', color: 'var(--t3)' }}>{cat?.label ?? item.category}</span>
        <span style={{ fontSize: '11px', color: status.color, fontWeight: 700 }}>{status.text}</span>
      </div>
      <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 600, lineHeight: 1.4 }}>
        {item.title}
      </div>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>{date}</div>
    </div>
  );
}

export default function InquiryPage() {
  const user = useAppStore(s => s.user);

  const [category, setCategory] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setHistoryLoading(false); return; }
    const authClient = getAuthenticatedClient(user.id);
    authClient
      .from('inquiries')
      .select('id, category, title, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setHistory(data ?? []);
        setHistoryLoading(false);
      });
  }, [user?.id, submitted]);

  const canSubmit = category && title.trim() && content.trim() && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !user?.id) return;
    setIsSubmitting(true);
    try {
      const authClient = getAuthenticatedClient(user.id);
      const { error } = await authClient.from('inquiries').insert({
        kakao_id: String(user.id),
        category,
        title: title.trim(),
        content: content.trim(),
      });
      if (!error) {
        setSubmitted(true);
        setCategory(null);
        setTitle('');
        setContent('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page step-fade" style={{ paddingBottom: 40 }}>
      {/* ── 헤더 ── */}
      <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 'var(--md)', fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>
          💬 문의하기
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.7 }}>
          버그 신고, 기능 제안, 결제 문의 등 무엇이든 남겨주세요.
          소중한 의견을 빠르게 검토하겠습니다.
        </div>
      </div>

      {/* ── 폼 ── */}
      <div style={{ padding: '20px 20px 0' }}>

        {submitted && (
          <div style={{
            padding: '16px',
            borderRadius: 'var(--r1)',
            background: 'var(--goldf)',
            border: '1px solid var(--acc)',
            marginBottom: 20,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>✅</div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 600 }}>문의가 접수되었어요!</div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 4 }}>
              검토 후 최대한 빠르게 답변드릴게요.
            </div>
            <button
              onClick={() => setSubmitted(false)}
              style={{
                marginTop: 12,
                padding: '8px 20px',
                borderRadius: 'var(--r2)',
                border: '1px solid var(--acc)',
                background: 'none',
                color: 'var(--gold)',
                fontSize: 'var(--xs)',
                fontFamily: 'var(--ff)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              새 문의 작성
            </button>
          </div>
        )}

        {!submitted && (
          <>
            {/* 카테고리 선택 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', fontWeight: 600, marginBottom: 8 }}>
                문의 유형
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 'var(--r2)',
                      border: `1px solid ${category === c.value ? 'var(--gold)' : 'var(--line)'}`,
                      background: category === c.value ? 'var(--goldf)' : 'var(--bg1)',
                      color: category === c.value ? 'var(--gold)' : 'var(--t2)',
                      fontSize: 'var(--xs)',
                      fontFamily: 'var(--ff)',
                      cursor: 'pointer',
                      fontWeight: category === c.value ? 700 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 제목 */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', fontWeight: 600, marginBottom: 6 }}>
                제목
              </div>
              <input
                className="inp"
                type="text"
                placeholder="문의 제목을 입력해 주세요"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={100}
                style={{ width: '100%' }}
              />
            </div>

            {/* 내용 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', fontWeight: 600, marginBottom: 6 }}>
                내용
              </div>
              <textarea
                className="inp"
                placeholder="문의 내용을 자세히 입력해 주세요"
                value={content}
                onChange={e => setContent(e.target.value)}
                maxLength={2000}
                rows={6}
                style={{ width: '100%', resize: 'vertical', minHeight: 120 }}
              />
              <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--t4)', marginTop: 4 }}>
                {content.length} / 2000
              </div>
            </div>

            {/* 제출 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 'var(--r2)',
                border: 'none',
                background: canSubmit ? 'var(--gold)' : 'var(--bg3)',
                color: canSubmit ? '#fff' : 'var(--t4)',
                fontSize: 'var(--sm)',
                fontFamily: 'var(--ff)',
                fontWeight: 700,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
              }}
            >
              {isSubmitting ? '전송 중…' : '문의 보내기'}
            </button>
          </>
        )}
      </div>

      {/* ── 내 문의 내역 ── */}
      <div style={{ padding: '28px 20px 0' }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', letterSpacing: '.06em', fontWeight: 700, marginBottom: 12 }}>
          ✦ 내 문의 내역
        </div>

        {historyLoading ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--t4)', fontSize: 'var(--xs)' }}>
            불러오는 중…
          </div>
        ) : history.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '24px 0',
            color: 'var(--t4)',
            fontSize: 'var(--xs)',
            border: '1px dashed var(--line)',
            borderRadius: 'var(--r1)',
          }}>
            아직 문의 내역이 없어요
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map(item => (
              <InquiryHistoryItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

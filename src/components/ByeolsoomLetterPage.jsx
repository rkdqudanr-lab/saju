import { useState, useEffect, useCallback } from 'react';
import { supabase, getAuthenticatedClient } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';

// ═══════════════════════════════════════════════════════════
//  ✉ 별숨편지 — 기운이 맞는 익명의 누군가에게 편지 쓰고 받기
//  규칙: 내가 먼저 써야 누군가의 편지를 받을 수 있다
// ═══════════════════════════════════════════════════════════

const MAX_LEN = 500;
const GENDER_OPTIONS = ['여성', '남성', '상관없음'];

// 오행 기운 상생 점수 (CompatPage와 동일 로직)
function calcCompatScore(domA, domB) {
  const SENG = { 목: ['수', '목'], 화: ['목', '화'], 토: ['화', '토'], 금: ['토', '금'], 수: ['금', '수'] };
  const elements = ['목', '화', '토', '금', '수'];
  const seed = (elements.indexOf(domA) * 7 + elements.indexOf(domB) * 11) % 100;
  if (SENG[domA]?.includes(domB) || SENG[domB]?.includes(domA)) return 80 + (seed % 15);
  if (domA === domB) return 75 + (seed % 10);
  return 60 + (seed % 20);
}

// 탭 컴포넌트
function TabBar({ tab, setTab, unread }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
      {[
        { id: 'write', label: '편지 쓰기' },
        { id: 'sent', label: '보낸 편지함' },
        { id: 'inbox', label: `받은 편지함${unread > 0 ? ` (${unread})` : ''}` },
      ].map(t => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          style={{
            flex: 1, padding: '12px 4px', background: 'none', border: 'none',
            borderBottom: tab === t.id ? '2px solid var(--gold)' : '2px solid transparent',
            color: tab === t.id ? 'var(--gold)' : 'var(--t3)',
            fontWeight: tab === t.id ? 700 : 400,
            fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
            transition: 'all .15s', letterSpacing: '.02em',
            marginBottom: -1,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// 편지 카드
function LetterCard({ letter, onOpen, isInbox }) {
  const timeAgo = (iso) => {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60) return '방금';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };

  const statusLabel = {
    pending: { text: '전달 중', color: 'var(--t4)' },
    matched: { text: isInbox ? '새 편지 도착 ✦' : '전달됨', color: isInbox ? 'var(--gold)' : 'var(--teal)' },
    replied: { text: isInbox ? '답장함' : '답장 받음 ✦', color: letter.status === 'replied' && !isInbox ? 'var(--gold)' : 'var(--t3)' },
  }[letter.status] || { text: '', color: 'var(--t4)' };

  return (
    <div
      onClick={() => onOpen(letter)}
      style={{
        padding: '16px', borderRadius: 'var(--r1)',
        background: letter.status === 'matched' && isInbox ? 'var(--goldf)' : 'var(--bg2)',
        border: `1px solid ${letter.status === 'matched' && isInbox ? 'var(--acc)' : 'var(--line)'}`,
        cursor: 'pointer', transition: 'all .15s', marginBottom: 10,
      }}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onOpen(letter); }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
          {isInbox ? `✦ 익명의 별` : `→ ${letter.gender_pref || '상관없음'}에게`}
          {letter.sender_sun_sign && ` · ${letter.sender_sun_sign}`}
        </div>
        <div style={{ fontSize: 'var(--xs)', color: statusLabel.color, fontWeight: 600 }}>
          {statusLabel.text}
        </div>
      </div>
      <div style={{
        fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.6,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {isInbox ? '편지를 열어 읽어봐요' : letter.content}
      </div>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 6 }}>
        {timeAgo(letter.created_at)}
      </div>
    </div>
  );
}

// 편지 상세 보기 / 답장 모달
function LetterDetailModal({ letter, myKakaoId, onClose, onReplyDone, showToast }) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const isInbox = letter.recipient_kakao_id === myKakaoId;
  const hasReplied = letter.reply_content;

  const sendReply = async () => {
    if (!reply.trim() || sending) return;
    if (reply.length > MAX_LEN) { showToast('500자 이내로 작성해주세요', 'error'); return; }
    setSending(true);
    try {
      const client = getAuthenticatedClient(myKakaoId);
      const { error } = await client
        .from('byeolsoom_letters')
        .update({ reply_content: reply.trim(), reply_at: new Date().toISOString(), status: 'replied' })
        .eq('id', letter.id);
      if (error) throw error;
      showToast('답장을 보냈어요 ✦', 'success');
      onReplyDone();
    } catch (e) {
      console.error('[별숨편지] reply error:', e);
      showToast('답장 전송에 실패했어요', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 460, maxHeight: '85vh', overflowY: 'auto',
        background: 'var(--bg1)', borderRadius: 'var(--r3) var(--r3) 0 0',
        padding: '28px 24px 40px', animation: 'slideUp .3s ease',
      }}>
        {/* 편지지 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '1.2rem', color: 'var(--gold)', marginBottom: 6 }}>✉</div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', letterSpacing: '.06em' }}>
            {isInbox ? '익명의 별이 보낸 편지' : '내가 쓴 편지'}
            {letter.sender_sun_sign && ` · ${letter.sender_sun_sign}`}
          </div>
        </div>

        {/* 편지 본문 */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r2)',
          padding: '20px', marginBottom: 16, lineHeight: 1.85,
          fontSize: 'var(--sm)', color: 'var(--t1)', whiteSpace: 'pre-wrap', minHeight: 120,
        }}>
          {isInbox ? letter.content : letter.content}
        </div>

        {/* 답장 영역 */}
        {isInbox && !hasReplied && (
          <div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>
              ✦ 답장 쓰기
            </div>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              maxLength={MAX_LEN}
              placeholder="마음을 담아 답장을 써봐요&#10;개인정보(이름·연락처·SNS 등)는 포함하지 마세요"
              style={{
                width: '100%', minHeight: 120, padding: '12px 14px',
                background: 'var(--bg2)', border: '1px solid var(--line)',
                borderRadius: 'var(--r1)', color: 'var(--t1)', fontSize: 'var(--sm)',
                fontFamily: 'var(--ff)', lineHeight: 1.7, resize: 'vertical',
                boxSizing: 'border-box', marginBottom: 8,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>{reply.length}/{MAX_LEN}</span>
            </div>
            <button
              className="btn-main"
              style={{ marginTop: 0 }}
              disabled={!reply.trim() || sending}
              onClick={sendReply}
            >
              {sending ? '전송 중...' : '답장 보내기 ✦'}
            </button>
          </div>
        )}

        {/* 이미 답장한 경우 */}
        {isInbox && hasReplied && (
          <div style={{ padding: '14px 16px', background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 'var(--r1)' }}>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 6 }}>✦ 내가 보낸 답장</div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{letter.reply_content}</div>
          </div>
        )}

        {/* 내가 쓴 편지에 답장이 온 경우 */}
        {!isInbox && letter.reply_content && (
          <div style={{ marginTop: 8, padding: '16px', background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 'var(--r2)' }}>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 8 }}>✦ 돌아온 답장</div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{letter.reply_content}</div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 16, padding: 12, background: 'none',
            border: '1px solid var(--line)', borderRadius: 'var(--r1)',
            color: 'var(--t3)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──
export default function ByeolsoomLetterPage({ showToast }) {
  const user = useAppStore(s => s.user);
  const saju = useAppStore(s => s.saju);
  const sun  = useAppStore(s => s.sun);
  const form = useAppStore(s => s.form);

  const [tab, setTab] = useState('write');
  const [genderPref, setGenderPref] = useState('상관없음');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sentLetters, setSentLetters] = useState([]);
  const [inboxLetters, setInboxLetters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openLetter, setOpenLetter] = useState(null);
  const [hasSent, setHasSent] = useState(false); // 편지 보낸 적 있는지 (게이트)

  const myKakaoId = user?.kakaoId;
  const mySunSign = sun?.n || null;
  const myDom = saju?.dom || null;
  const myGender = form?.gender || null;

  const unreadCount = inboxLetters.filter(l => l.status === 'matched').length;

  // 편지 목록 로드
  const loadLetters = useCallback(async () => {
    if (!myKakaoId || !supabase) return;
    setLoading(true);
    try {
      const client = getAuthenticatedClient(myKakaoId);

      // 보낸 편지
      const { data: sent } = await client
        .from('byeolsoom_letters')
        .select('*')
        .eq('sender_kakao_id', myKakaoId)
        .order('created_at', { ascending: false })
        .limit(20);

      // 받은 편지
      const { data: inbox } = await client
        .from('byeolsoom_letters')
        .select('*')
        .eq('recipient_kakao_id', myKakaoId)
        .order('created_at', { ascending: false })
        .limit(20);

      setSentLetters(sent || []);
      setInboxLetters(inbox || []);
      setHasSent((sent || []).length > 0);
    } catch (e) {
      console.error('[별숨편지] loadLetters error:', e);
    } finally {
      setLoading(false);
    }
  }, [myKakaoId]);

  useEffect(() => {
    if (myKakaoId) loadLetters();
  }, [loadLetters, myKakaoId]);

  // 편지 보내기 + 매칭 시도
  const sendLetter = async () => {
    if (!content.trim()) { showToast('편지 내용을 작성해주세요', 'error'); return; }
    if (content.length > MAX_LEN) { showToast('500자 이내로 작성해주세요', 'error'); return; }
    if (!user) { showToast('로그인이 필요해요', 'error'); return; }

    setSending(true);
    try {
      const client = getAuthenticatedClient(myKakaoId);

      // 1. 내 편지 저장
      const { data: myLetter, error: insertErr } = await client
        .from('byeolsoom_letters')
        .insert({
          sender_kakao_id: myKakaoId,
          content: content.trim(),
          gender_pref: genderPref,
          sender_sun_sign: mySunSign,
          sender_dom: myDom,
          sender_gender: myGender,
          status: 'pending',
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // 2. 매칭 시도: pending 상태 + 성별 조건 + 나와 기운이 맞는 상대 찾기
      const genderFilter = genderPref === '상관없음' ? null : genderPref;
      let query = supabase
        .from('byeolsoom_letters')
        .select('*')
        .eq('status', 'pending')
        .neq('sender_kakao_id', myKakaoId)
        .is('recipient_kakao_id', null);

      // 성별 필터: 상대방이 나의 성별을 원하거나 상관없음인 사람
      if (myGender) {
        query = query.or(`gender_pref.eq.${myGender},gender_pref.eq.상관없음`);
      }

      const { data: candidates } = await query.limit(30);

      if (candidates && candidates.length > 0) {
        // 기운 점수 계산해서 가장 잘 맞는 상대 선택
        let best = null;
        let bestScore = -1;
        for (const c of candidates) {
          // 성별 체크: 상대가 원하는 성별에 내가 맞는지
          if (genderFilter && c.sender_gender && c.sender_gender !== genderFilter) continue;
          const score = (myDom && c.sender_dom)
            ? calcCompatScore(myDom, c.sender_dom)
            : 70;
          if (score > bestScore) { bestScore = score; best = c; }
        }

        if (best) {
          // 3. 매칭 성사: 두 편지 모두 상대를 recipient로 설정
          await client
            .from('byeolsoom_letters')
            .update({ recipient_kakao_id: myKakaoId, status: 'matched', compat_score: bestScore })
            .eq('id', best.id);

          await client
            .from('byeolsoom_letters')
            .update({ recipient_kakao_id: best.sender_kakao_id, status: 'matched', compat_score: bestScore })
            .eq('id', myLetter.id);

          showToast('✦ 기운이 맞는 편지가 도착했어요! 받은 편지함을 확인해봐요', 'success');
          setTab('inbox');
        } else {
          showToast('편지를 보냈어요 · 기운이 맞는 누군가가 곧 받아볼 거예요 ✦', 'success');
          setTab('sent');
        }
      } else {
        showToast('편지를 보냈어요 · 기운이 맞는 누군가가 곧 받아볼 거예요 ✦', 'success');
        setTab('sent');
      }

      setContent('');
      setHasSent(true);
      await loadLetters();
    } catch (e) {
      console.error('[별숨편지] sendLetter error:', e);
      showToast('전송에 실패했어요. 다시 시도해봐요', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleOpenLetter = (letter) => setOpenLetter(letter);
  const handleCloseLetter = () => { setOpenLetter(null); loadLetters(); };

  return (
    <div className="page-top">
      <div className="inner">
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', margin: '0 auto 12px',
            background: 'radial-gradient(circle at 40% 30%, rgba(232,176,72,.35), rgba(155,142,196,.25), rgba(13,11,20,.8))',
            border: '1px solid var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', color: 'var(--gold)',
          }}>
            ✉
          </div>
          <h2 style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)', margin: 0, marginBottom: 6 }}>
            별숨편지
          </h2>
          <p style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.75, margin: 0 }}>
            기운이 맞는 익명의 누군가에게 편지를 써요<br />
            내가 먼저 써야 누군가의 편지를 받을 수 있어요
          </p>
        </div>

        {/* 로그인 필요 */}
        {!user && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r2)',
          }}>
            <div style={{ fontSize: '1.4rem', color: 'var(--t4)', marginBottom: 12 }}>✦</div>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', marginBottom: 6 }}>로그인이 필요해요</div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>카카오 로그인 후 별숨편지를 이용할 수 있어요</div>
          </div>
        )}

        {user && (
          <>
            <TabBar tab={tab} setTab={setTab} unread={unreadCount} />

            {/* ── 편지 쓰기 탭 ── */}
            {tab === 'write' && (
              <div>
                {/* 내 기운 표시 */}
                {(mySunSign || myDom) && (
                  <div style={{
                    padding: '12px 14px', background: 'var(--goldf)', border: '1px solid var(--acc)',
                    borderRadius: 'var(--r1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ fontSize: '1rem', color: 'var(--gold)' }}>✦</div>
                    <div>
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 2 }}>이 편지에 담기는 나의 기운</div>
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)' }}>
                        {[mySunSign, myDom ? `${myDom} 기운` : null].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                )}

                {/* 성별 선택 */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', fontWeight: 600, letterSpacing: '.04em', marginBottom: 8 }}>
                    받을 사람
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {GENDER_OPTIONS.map(g => (
                      <button
                        key={g}
                        onClick={() => setGenderPref(g)}
                        style={{
                          flex: 1, padding: '10px 8px', borderRadius: 'var(--r1)',
                          border: `1px solid ${genderPref === g ? 'var(--gold)' : 'var(--line)'}`,
                          background: genderPref === g ? 'var(--goldf)' : 'var(--bg2)',
                          color: genderPref === g ? 'var(--gold)' : 'var(--t3)',
                          fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer',
                          fontWeight: genderPref === g ? 700 : 400, transition: 'all .15s',
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 개인정보 주의사항 */}
                <div style={{
                  padding: '10px 14px', marginBottom: 12,
                  background: 'rgba(232,123,138,.07)', border: '1px solid var(--roseacc)',
                  borderRadius: 'var(--r1)', display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 'var(--xs)', color: 'var(--rose)', flexShrink: 0, marginTop: 1 }}>⚠</span>
                  <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.7 }}>
                    이름, 연락처, SNS 계정 등 개인정보를 포함하지 마세요.
                    <strong style={{ color: 'var(--rose)' }}> 개인정보 입력 시 서비스 이용이 제한될 수 있어요.</strong>
                  </div>
                </div>

                {/* 편지 본문 */}
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  maxLength={MAX_LEN}
                  placeholder={`${form?.nickname || form?.name || '당신'}의 별이 닿을 누군가에게 마음을 써봐요\n\n어떤 인연을 기다리는지, 지금 어떤 마음인지,\n별자리나 사주에 대한 이야기도 좋아요`}
                  style={{
                    width: '100%', minHeight: 180, padding: '14px',
                    background: 'var(--bg2)', border: '1px solid var(--line)',
                    borderRadius: 'var(--r1)', color: 'var(--t1)', fontSize: 'var(--sm)',
                    fontFamily: 'var(--ff)', lineHeight: 1.8, resize: 'vertical',
                    boxSizing: 'border-box', marginBottom: 8, transition: 'border-color .2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(232,176,72,.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--line)'; e.target.style.boxShadow = 'none'; }}
                />
                <div style={{ fontSize: 'var(--xs)', color: content.length > MAX_LEN * 0.9 ? 'var(--rose)' : 'var(--t4)', textAlign: 'right', marginBottom: 16 }}>
                  {content.length}/{MAX_LEN}
                </div>

                <button
                  className="btn-main"
                  style={{ marginTop: 0 }}
                  disabled={!content.trim() || sending || content.length > MAX_LEN}
                  onClick={sendLetter}
                >
                  {sending ? '별빛에 실어 보내는 중...' : '✦ 편지 보내기'}
                </button>

                {hasSent && (
                  <div style={{ marginTop: 12, textAlign: 'center', fontSize: 'var(--xs)', color: 'var(--t4)' }}>
                    여러 편지를 보낼 수 있어요. 많이 쓸수록 더 빨리 매칭돼요.
                  </div>
                )}
              </div>
            )}

            {/* ── 보낸 편지함 탭 ── */}
            {tab === 'sent' && (
              <div>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t4)', fontSize: 'var(--sm)' }}>
                    불러오는 중...
                  </div>
                ) : sentLetters.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--t4)' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: 12 }}>✦</div>
                    <div style={{ fontSize: 'var(--sm)', marginBottom: 6 }}>아직 보낸 편지가 없어요</div>
                    <div style={{ fontSize: 'var(--xs)' }}>편지 쓰기 탭에서 첫 편지를 써봐요</div>
                    <button className="btn-main" style={{ marginTop: 20, maxWidth: 160 }} onClick={() => setTab('write')}>
                      편지 쓰기
                    </button>
                  </div>
                ) : (
                  sentLetters.map(l => (
                    <LetterCard key={l.id} letter={l} onOpen={handleOpenLetter} isInbox={false} />
                  ))
                )}
              </div>
            )}

            {/* ── 받은 편지함 탭 ── */}
            {tab === 'inbox' && (
              <div>
                {!hasSent && inboxLetters.length === 0 && (
                  <div style={{
                    padding: '14px 16px', background: 'var(--goldf)', border: '1px solid var(--acc)',
                    borderRadius: 'var(--r1)', marginBottom: 16, fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7,
                  }}>
                    ✦ 편지를 먼저 보내야 누군가의 편지를 받을 수 있어요.
                  </div>
                )}
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t4)', fontSize: 'var(--sm)' }}>
                    불러오는 중...
                  </div>
                ) : inboxLetters.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--t4)' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: 12 }}>✉</div>
                    <div style={{ fontSize: 'var(--sm)', marginBottom: 6 }}>아직 받은 편지가 없어요</div>
                    <div style={{ fontSize: 'var(--xs)' }}>기운이 맞는 누군가의 편지를 기다리는 중이에요</div>
                  </div>
                ) : (
                  inboxLetters.map(l => (
                    <LetterCard key={l.id} letter={l} onOpen={handleOpenLetter} isInbox={true} />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 편지 상세 모달 */}
      {openLetter && (
        <LetterDetailModal
          letter={openLetter}
          myKakaoId={myKakaoId}
          onClose={handleCloseLetter}
          onReplyDone={handleCloseLetter}
          showToast={showToast}
        />
      )}
    </div>
  );
}

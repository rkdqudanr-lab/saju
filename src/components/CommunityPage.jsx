/**
 * CommunityPage — 별숨 광장 (실시간 커뮤니티 피드)
 * 별자리/일간별로 오늘의 운세 한 마디를 공유하는 익명 피드입니다.
 * Supabase Realtime으로 새 글이 실시간 반영됩니다.
 * 공감(별 하트) 시 BP +5 지급.
 *
 * Feature 1: 댓글 기능 (post_comments 테이블)
 * Feature 2: 게시글 신고 (post_reports 테이블)
 * Feature 3: 오늘 운세 첨부 공유 (fortune_summary 컬럼)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase, getAuthenticatedClient } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';
import AnonSynergyModal from './AnonSynergyModal.jsx';
import { getCommunityShowSaju } from './SettingsPage.jsx';

const MAX_CONTENT = 200;
const MAX_COMMENT = 100;

const FILTERS = ['전체', '내 글', '팔로잉', '내 별자리', '내 일간'];
const REPORT_REASONS = ['부적절한 내용', '스팸·광고', '혐오 발언', '기타'];

const TOPICS = [
  { value: '연애', emoji: '💕' },
  { value: '재물', emoji: '💰' },
  { value: '커리어', emoji: '💼' },
  { value: '건강', emoji: '🌿' },
  { value: '꿈', emoji: '🌙' },
  { value: '일상', emoji: '☀️' },
  { value: '고민', emoji: '🤔' },
  { value: '행운', emoji: '✦' },
];

// 일간 → 오행 색상 매핑
const ILGAN_OHAENG = {
  갑: '목', 을: '목', 병: '화', 정: '화', 무: '토',
  기: '토', 경: '금', 신: '금', 임: '수', 계: '수',
};
const OHAENG_COLOR = { 목: '#5FAD7A', 화: '#E06040', 토: '#C4A040', 금: '#A09EC4', 수: '#4A90D9' };

function getIlganColor(ilgan) {
  const oh = ILGAN_OHAENG[ilgan];
  return oh ? OHAENG_COLOR[oh] : 'var(--gold)';
}

/** content에서 [토픽] 태그 파싱 */
function parseTopic(content) {
  if (!content) return { topic: null, text: content };
  const m = content.match(/^\[([^\]]+)\]\s*/);
  if (!m) return { topic: null, text: content };
  const found = TOPICS.find(t => t.value === m[1]);
  if (!found) return { topic: null, text: content };
  return { topic: found, text: content.slice(m[0].length) };
}

/** 인기글 기준 */
function isHotPost(post) {
  return (post.likes_count || 0) >= 5;
}

// ─────────────────────────────────────────────────────────────────
//  댓글 섹션
// ─────────────────────────────────────────────────────────────────
function CommentsSection({ postId, myKakaoId, myNickname, showToast }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(20);
      if (data) setComments(data);
    } catch { /* 조용히 실패 */ }
    finally { setLoading(false); }
  }

  async function submitComment() {
    if (!text.trim() || !myKakaoId) return;
    setSubmitting(true);
    try {
      const client = getAuthenticatedClient(myKakaoId);
      const { data, error } = await client.from('post_comments').insert({
        post_id: postId,
        kakao_id: String(myKakaoId),
        nickname: myNickname,
        content: text.trim(),
      }).select().single();
      if (error) throw error;
      setComments(prev => [...prev, data]);
      setText('');
    } catch {
      showToast('댓글을 올리지 못했어요', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const timeLabel = (ts) => {
    const diff = (Date.now() - new Date(ts)) / 60000;
    if (diff < 1) return '방금';
    if (diff < 60) return `${Math.floor(diff)}분`;
    if (diff < 1440) return `${Math.floor(diff / 60)}시간`;
    return `${Math.floor(diff / 1440)}일`;
  };

  return (
    <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 4 }}>
      {loading ? (
        <div style={{ fontSize: '10px', color: 'var(--t4)', padding: '4px 0' }}>댓글 로딩 중...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--t2)', flexShrink: 0 }}>{c.nickname}</span>
              <span style={{ fontSize: '10px', color: 'var(--t2)', flex: 1, lineHeight: 1.6 }}>{c.content}</span>
              <span style={{ fontSize: '10px', color: 'var(--t4)', flexShrink: 0 }}>{timeLabel(c.created_at)}</span>
            </div>
          ))}
        </div>
      )}
      {myKakaoId && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value.slice(0, MAX_COMMENT))}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
            placeholder="댓글을 남겨봐요..."
            style={{
              flex: 1, padding: '7px 10px',
              borderRadius: 20,
              border: '1px solid var(--line)',
              background: 'var(--bg2)',
              fontFamily: 'var(--ff)', fontSize: '11px',
              color: 'var(--t1)', outline: 'none',
            }}
          />
          <button
            onClick={submitComment}
            disabled={!text.trim() || submitting}
            style={{
              padding: '7px 12px',
              borderRadius: 20,
              border: 'none',
              background: text.trim() ? 'var(--gold)' : 'var(--bg3)',
              color: text.trim() ? '#fff' : 'var(--t4)',
              fontFamily: 'var(--ff)', fontSize: '11px',
              cursor: text.trim() ? 'pointer' : 'default',
              fontWeight: 700, flexShrink: 0,
            }}
          >
            {submitting ? '...' : '등록'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  포스트 카드
// ─────────────────────────────────────────────────────────────────
function PostCard({ post, myKakaoId, myNickname, myLikedIds, followingIds, onLike, onReport, onFollow, onSynergy, onEdit, onDelete, showToast }) {
  const liked = myLikedIds.has(post.id);
  const isOther = post.kakao_id !== myKakaoId;
  const isFollowing = followingIds.has(post.kakao_id);
  const [showComments, setShowComments] = useState(false);

  const timeLabel = (() => {
    const diff = (Date.now() - new Date(post.created_at)) / 60000;
    if (diff < 1) return '방금 전';
    if (diff < 60) return `${Math.floor(diff)}분 전`;
    if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
    return `${Math.floor(diff / 1440)}일 전`;
  })();

  const avatarColor = getIlganColor(post.ilgan);
  const { topic, text: postText } = parseTopic(post.content);
  const hot = isHotPost(post);

  return (
    <div className={`glass ${hot ? 'glass-gold' : ''}`} style={{
      borderRadius: 'var(--r2, 16px)',
      padding: '18px 18px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      boxShadow: hot ? '0 8px 32px rgba(232,176,72,0.15)' : '0 4px 16px rgba(0,0,0,0.1)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 인기글 배지 - 상단 우측 고정 느낌으로 변경 */}
      {hot && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          padding: '4px 12px',
          background: 'linear-gradient(90deg, #E06040, #FFC85C)',
          color: '#fff',
          fontSize: '9px', fontWeight: 800,
          borderRadius: '0 0 0 12px',
          letterSpacing: '0.05em',
          boxShadow: '0 2px 8px rgba(224,96,64,0.3)',
          zIndex: 2,
        }}>
          HOT ✦ 인기
        </div>
      )}

      {/* 상단: 아바타 + 별자리/일간 + 팔로우 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '12px',
          background: `${avatarColor}22`,
          border: `1.5px solid ${avatarColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0, color: avatarColor, fontWeight: 800,
          boxShadow: `0 4px 12px ${avatarColor}15`,
        }}>
          {post.ilgan ? post.ilgan : '✦'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.01em' }}>
            {post.nickname || '별숨 유저'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--t4)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{[post.sun_sign, post.ilgan ? `${post.ilgan}일간` : null].filter(Boolean).join(' · ')}</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>{timeLabel}</span>
          </div>
        </div>
        {myKakaoId && (isOther ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => onSynergy(post)}
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                border: '1.5px solid var(--gold)',
                background: 'var(--goldf)',
                cursor: 'pointer',
                fontFamily: 'var(--ff)',
                fontSize: '11px',
                color: 'var(--gold)',
                fontWeight: 700,
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
            >
              시너지
            </button>
            <button
              onClick={() => onFollow(post.kakao_id)}
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                border: `1.5px solid ${isFollowing ? 'var(--line)' : 'var(--acc)'}`,
                background: isFollowing ? 'rgba(255,255,255,0.05)' : 'var(--goldf)',
                cursor: 'pointer',
                fontFamily: 'var(--ff)',
                fontSize: '11px',
                color: isFollowing ? 'var(--t4)' : 'var(--gold)',
                fontWeight: isFollowing ? 500 : 700,
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
            >
              {isFollowing ? '팔로잉' : '팔로우'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => onEdit(post)}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'rgba(255,255,255,0.03)',
                cursor: 'pointer',
                fontFamily: 'var(--ff)',
                fontSize: '11px',
                color: 'var(--t3)',
                flexShrink: 0,
              }}
            >
              수정
            </button>
            <button
              onClick={() => onDelete(post.id)}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'rgba(224,96,58,0.05)',
                cursor: 'pointer',
                fontFamily: 'var(--ff)',
                fontSize: '11px',
                color: '#e05a3a',
                flexShrink: 0,
              }}
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      {/* 운세 첨부 배지 */}
      {post.fortune_summary && (
        <div style={{
          padding: '8px 12px',
          borderRadius: '12px',
          background: 'rgba(232,176,72,0.08)',
          border: '1px solid rgba(232,176,72,0.2)',
          fontSize: '11px',
          color: 'var(--gold)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ fontSize: '14px' }}>✨</span>
          <span>{post.fortune_summary}</span>
        </div>
      )}

      {/* 토픽 태그 */}
      {topic && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: '12px',
          background: 'var(--bg3)', border: '1px solid var(--line)',
          fontSize: '11px', color: 'var(--t2)', fontWeight: 600,
          width: 'fit-content',
        }}>
          <span style={{ fontSize: '13px' }}>{topic.emoji}</span>
          <span>{topic.value}</span>
        </div>
      )}

      {/* 본문 */}
      <div style={{
        fontSize: 'var(--md)',
        color: 'var(--t1)',
        lineHeight: 1.75,
        wordBreak: 'break-all',
        padding: '2px 0',
      }}>
        {postText}
      </div>

      {/* 하단: 좋아요 + 댓글 + 신고 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginTop: 4,
        paddingTop: 12,
        borderTop: '1px solid var(--line2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => onLike(post.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px',
              borderRadius: '20px',
              border: `1.5px solid ${liked ? 'var(--acc)' : 'var(--line)'}`,
              background: liked ? 'var(--goldf)' : 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              fontFamily: 'var(--ff)',
              fontSize: 'var(--sm)',
              color: liked ? 'var(--gold)' : 'var(--t3)',
              fontWeight: liked ? 700 : 500,
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '14px' }}>{liked ? '✦' : '✧'}</span>
            <span>{post.likes_count || 0}</span>
          </button>
          <button
            onClick={() => setShowComments(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1.5px solid var(--line)',
              background: showComments ? 'rgba(255,255,255,0.05)' : 'none',
              cursor: 'pointer',
              fontFamily: 'var(--ff)',
              fontSize: 'var(--sm)',
              color: showComments ? 'var(--t1)' : 'var(--t3)',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '14px' }}>💬</span>
            <span>댓글</span>
          </button>
        </div>
        
        {post.kakao_id !== myKakaoId && (
          <button
            onClick={() => onReport(post.id)}
            style={{
              padding: '6px 10px',
              borderRadius: '10px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--ff)',
              fontSize: '11px',
              color: 'var(--t4)',
              opacity: 0.6,
            }}
          >
            신고
          </button>
        )}
      </div>

      {/* 댓글 섹션 */}
      {showComments && (
        <div style={{ 
          marginTop: 8, 
          paddingTop: 12, 
          borderTop: '1px solid var(--line2)',
          animation: 'fadeIn 0.3s ease',
        }}>
          <CommentsSection
            postId={post.id}
            myKakaoId={myKakaoId}
            myNickname={myNickname}
            showToast={showToast}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  글쓰기 모달 (운세 첨부 옵션 포함)
// ─────────────────────────────────────────────────────────────────
function WriteModal({ onClose, onSubmit, nickname, defaultSunSign, defaultIlgan, dailyResult }) {
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [attachFortune, setAttachFortune] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textRef = useRef(null);

  useEffect(() => { textRef.current?.focus(); }, []);

  const fortuneSummary = dailyResult
    ? `${dailyResult.score ?? ''}점 · ${dailyResult.oneLiner ?? dailyResult.keyword ?? ''}`.trim().replace(/^점\s*·\s*/, '')
    : null;

  async function handleSubmit() {
    if (!content.trim()) return;
    setSubmitting(true);
    const finalContent = topic ? `[${topic}] ${content.trim()}` : content.trim();
    await onSubmit(finalContent, attachFortune && fortuneSummary ? fortuneSummary : null);
    setSubmitting(false);
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div
        style={{
          width: '100%', maxWidth: 480, margin: '0 auto',
          background: 'var(--bg1)',
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 14 }}>
          오늘의 별숨 한 마디 ✦
        </div>
        <textarea
          ref={textRef}
          value={content}
          onChange={e => setContent(e.target.value.slice(0, MAX_CONTENT))}
          placeholder="오늘 별숨에서 받은 기운을 나눠봐요..."
          rows={4}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '12px', borderRadius: 'var(--r1)',
            border: '1.5px solid var(--line)',
            background: 'var(--bg2)',
            fontFamily: 'var(--ff)', fontSize: 'var(--sm)',
            color: 'var(--t1)', resize: 'none',
            lineHeight: 1.7, outline: 'none',
          }}
        />
        <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--t4)', marginTop: 4 }}>
          {content.length}/{MAX_CONTENT}
        </div>

        {/* 토픽 태그 선택 */}
        <div style={{ marginTop: 12, marginBottom: 2 }}>
          <div style={{ fontSize: '11px', color: 'var(--t4)', marginBottom: 6 }}>토픽 (선택)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TOPICS.map(t => (
              <button
                key={t.value}
                onClick={() => setTopic(prev => prev === t.value ? '' : t.value)}
                style={{
                  padding: '4px 10px', borderRadius: 14, fontSize: '11px', cursor: 'pointer',
                  border: `1px solid ${topic === t.value ? 'var(--gold)' : 'var(--line)'}`,
                  background: topic === t.value ? 'var(--goldf)' : 'var(--bg2)',
                  color: topic === t.value ? 'var(--gold)' : 'var(--t3)',
                  fontFamily: 'var(--ff)',
                  transition: 'all .12s',
                }}
              >
                {t.emoji} {t.value}
              </button>
            ))}
          </div>
        </div>

        {/* 운세 첨부 옵션 */}
        {fortuneSummary && (
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginTop: 10, padding: '10px 12px',
            borderRadius: 'var(--r1)',
            border: `1px solid ${attachFortune ? 'var(--acc)' : 'var(--line)'}`,
            background: attachFortune ? 'var(--goldf)' : 'var(--bg2)',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={attachFortune}
              onChange={e => setAttachFortune(e.target.checked)}
              style={{ accentColor: 'var(--gold)', width: 15, height: 15 }}
            />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold)' }}>오늘의 별숨 기운 첨부</div>
              <div style={{ fontSize: '10px', color: 'var(--t3)', marginTop: 2 }}>✦ {fortuneSummary}</div>
            </div>
          </label>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '13px',
              border: '1px solid var(--line)', borderRadius: 'var(--r1)',
              background: 'none', cursor: 'pointer',
              fontFamily: 'var(--ff)', fontSize: 'var(--sm)', color: 'var(--t3)',
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            style={{
              flex: 2, padding: '13px',
              border: 'none', borderRadius: 'var(--r1)',
              background: content.trim() ? 'var(--gold)' : 'var(--bg3)',
              cursor: content.trim() ? 'pointer' : 'default',
              fontFamily: 'var(--ff)', fontSize: 'var(--sm)',
              color: content.trim() ? '#fff' : 'var(--t4)',
              fontWeight: 700,
            }}
          >
            {submitting ? '올리는 중...' : '별숨 광장에 공유'}
          </button>
        </div>
        <div style={{ marginTop: 10, fontSize: '10px', color: 'var(--t4)', textAlign: 'center', lineHeight: 1.6 }}>
          생년월일은 노출되지 않으며, 별자리·일간 정보만 표시됩니다.
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────
//  신고 모달
// ─────────────────────────────────────────────────────────────────
function ReportModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    await onSubmit(reason);
    setSubmitting(false);
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div
        style={{
          width: '100%', maxWidth: 480, margin: '0 auto',
          background: 'var(--bg1)',
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 16 }}>
          신고 사유를 선택해주세요
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {REPORT_REASONS.map(r => (
            <label key={r} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              borderRadius: 'var(--r1)',
              border: `1px solid ${reason === r ? 'var(--acc)' : 'var(--line)'}`,
              background: reason === r ? 'var(--goldf)' : 'var(--bg2)',
              cursor: 'pointer',
            }}>
              <input
                type="radio"
                name="report_reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                style={{ accentColor: 'var(--gold)', width: 15, height: 15 }}
              />
              <span style={{ fontSize: 'var(--xs)', color: reason === r ? 'var(--gold)' : 'var(--t2)', fontWeight: reason === r ? 700 : 400 }}>
                {r}
              </span>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '13px',
              border: '1px solid var(--line)', borderRadius: 'var(--r1)',
              background: 'none', cursor: 'pointer',
              fontFamily: 'var(--ff)', fontSize: 'var(--sm)', color: 'var(--t3)',
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            style={{
              flex: 2, padding: '13px',
              border: 'none', borderRadius: 'var(--r1)',
              background: reason ? '#e05a3a' : 'var(--bg3)',
              cursor: reason ? 'pointer' : 'default',
              fontFamily: 'var(--ff)', fontSize: 'var(--sm)',
              color: reason ? '#fff' : 'var(--t4)',
              fontWeight: 700,
            }}
          >
            {submitting ? '접수 중...' : '신고하기'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────
//  글 수정 모달
// ─────────────────────────────────────────────────────────────────
function EditPostModal({ post, onClose, onSubmit }) {
  const { topic: initialTopic, text: initialText } = parseTopic(post.content);
  const [content, setContent] = useState(initialText || '');
  const [topic, setTopic] = useState(initialTopic?.value || '');
  const [submitting, setSubmitting] = useState(false);
  const textRef = useRef(null);

  useEffect(() => { textRef.current?.focus(); }, []);

  async function handleSubmit() {
    if (!content.trim()) return;
    setSubmitting(true);
    const finalContent = topic ? `[${topic}] ${content.trim()}` : content.trim();
    await onSubmit(post.id, finalContent);
    setSubmitting(false);
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div
        style={{
          width: '100%', maxWidth: 480, margin: '0 auto',
          background: 'var(--bg1)',
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 14 }}>
          게시글 수정
        </div>
        <textarea
          ref={textRef}
          value={content}
          onChange={e => setContent(e.target.value.slice(0, MAX_CONTENT))}
          rows={4}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '12px', borderRadius: 'var(--r1)',
            border: '1.5px solid var(--line)',
            background: 'var(--bg2)',
            fontFamily: 'var(--ff)', fontSize: 'var(--sm)',
            color: 'var(--t1)', resize: 'none',
            lineHeight: 1.7, outline: 'none',
          }}
        />
        <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--t4)', marginTop: 4 }}>
          {content.length}/{MAX_CONTENT}
        </div>

        {/* 토픽 태그 선택 */}
        <div style={{ marginTop: 12, marginBottom: 2 }}>
          <div style={{ fontSize: '11px', color: 'var(--t4)', marginBottom: 6 }}>토픽 (선택)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TOPICS.map(t => (
              <button
                key={t.value}
                onClick={() => setTopic(prev => prev === t.value ? '' : t.value)}
                style={{
                  padding: '4px 10px', borderRadius: 14, fontSize: '11px', cursor: 'pointer',
                  border: `1px solid ${topic === t.value ? 'var(--gold)' : 'var(--line)'}`,
                  background: topic === t.value ? 'var(--goldf)' : 'var(--bg2)',
                  color: topic === t.value ? 'var(--gold)' : 'var(--t3)',
                  fontFamily: 'var(--ff)',
                  transition: 'all .12s',
                }}
              >
                {t.emoji} {t.value}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '13px',
              border: '1px solid var(--line)', borderRadius: 'var(--r1)',
              background: 'none', cursor: 'pointer',
              fontFamily: 'var(--ff)', fontSize: 'var(--sm)', color: 'var(--t3)',
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            style={{
              flex: 2, padding: '13px',
              border: 'none', borderRadius: 'var(--r1)',
              background: content.trim() ? 'var(--gold)' : 'var(--bg3)',
              cursor: content.trim() ? 'pointer' : 'default',
              fontFamily: 'var(--ff)', fontSize: 'var(--sm)',
              color: content.trim() ? '#fff' : 'var(--t4)',
              fontWeight: 700,
            }}
          >
            {submitting ? '저장 중...' : '수정 완료'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────
//  메인 페이지
// ─────────────────────────────────────────────────────────────────
export default function CommunityPage({ showToast, dailyResult }) {
  const { user, form, saju, sun } = useAppStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('전체');
  const [sort, setSort] = useState('최신순'); // '최신순' | '인기순'
  const [showWrite, setShowWrite] = useState(false);
  const [myLikedIds, setMyLikedIds] = useState(new Set());
  const [followingIds, setFollowingIds] = useState(new Set());
  const [reportTargetId, setReportTargetId] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // post object to edit
  const [selectedSynergyUser, setSelectedSynergyUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('');

  const kakaoId = user?.kakaoId || user?.id;
  const myNickname = user?.nickname || '별숨 유저';
  const mySunSign = sun?.sign || null;
  const myIlgan = saju?.ilgan || null;

  useEffect(() => {
    loadPosts();
    loadMyLikes();
    loadFollowing();

    // Supabase Realtime 구독
    if (!supabase) return;

    const channel = supabase
      .channel('community_posts_feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_posts',
      }, payload => {
        setPosts(prev => [payload.new, ...prev].slice(0, 100));
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'community_posts',
      }, payload => {
        setPosts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setPosts(data);
    } catch {
      // 조용히 실패
    } finally {
      setLoading(false);
    }
  }

  async function loadFollowing() {
    if (!kakaoId) return;
    const followClient = getAuthenticatedClient(String(kakaoId));
    if (!followClient) return;
    try {
      const { data, error } = await followClient
        .from('user_follows')
        .select('following_kakao_id')
        .eq('follower_kakao_id', String(kakaoId));
      if (!error && data) setFollowingIds(new Set(data.map(f => f.following_kakao_id)));
    } catch { /* 조용히 실패 */ }
  }

  async function handleFollow(targetKakaoId) {
    if (!kakaoId) { showToast('로그인이 필요해요', 'info'); return; }
    const client = getAuthenticatedClient(kakaoId);
    const isFollowing = followingIds.has(targetKakaoId);
    if (isFollowing) {
      await client.from('user_follows')
        .delete()
        .eq('follower_kakao_id', String(kakaoId))
        .eq('following_kakao_id', targetKakaoId);
      setFollowingIds(prev => { const s = new Set(prev); s.delete(targetKakaoId); return s; });
    } else {
      const { error } = await client.from('user_follows').insert({
        follower_kakao_id: String(kakaoId),
        following_kakao_id: targetKakaoId,
      });
      if (!error) {
        setFollowingIds(prev => new Set([...prev, targetKakaoId]));
        showToast('팔로우했어요!', 'success');
      }
    }
  }

  async function loadMyLikes() {
    if (!kakaoId) return;
    const likesClient = getAuthenticatedClient(String(kakaoId));
    if (!likesClient) return;
    try {
      const { data, error } = await likesClient
        .from('post_reactions')
        .select('post_id')
        .eq('kakao_id', String(kakaoId));
      if (!error && data) setMyLikedIds(new Set(data.map(r => r.post_id)));
    } catch {
      // 조용히 실패
    }
  }

  async function handleSubmitPost(content, fortuneSummary) {
    if (!kakaoId) { showToast('로그인이 필요해요', 'info'); return; }
    const showSaju = getCommunityShowSaju();
    const client = getAuthenticatedClient(kakaoId);
    const { error } = await client.from('community_posts').insert({
      kakao_id: String(kakaoId),
      nickname: myNickname,
      content,
      sun_sign: showSaju ? mySunSign : null,
      ilgan: showSaju ? myIlgan : null,
      likes_count: 0,
      fortune_summary: fortuneSummary || null,
    });
    if (error) { console.error('[별숨] community_posts insert error:', error); showToast('글을 올리지 못했어요', 'error'); return; }
    setShowWrite(false);
    showToast('별숨 광장에 공유했어요!', 'success');
  }

  async function handleLike(postId) {
    if (!kakaoId) { showToast('로그인이 필요해요', 'info'); return; }
    const client = getAuthenticatedClient(kakaoId);
    if (!client) return;
    const already = myLikedIds.has(postId);

    // 낙관적 UI 업데이트 (즉각 반응)
    if (already) {
      setMyLikedIds(prev => { const s = new Set(prev); s.delete(postId); return s; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1) } : p));
      await client.from('post_reactions').delete()
        .eq('post_id', postId).eq('kakao_id', String(kakaoId));
    } else {
      const { error } = await client.from('post_reactions').insert({
        post_id: postId, kakao_id: String(kakaoId),
      });
      if (error?.code === '23505') return; // 중복
      setMyLikedIds(prev => new Set([...prev, postId]));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
      showToast('+5 BP 적립! 공감해줘서 고마워요', 'success');
    }

    // 클라이언트 산술 대신 집계 쿼리로 정확한 count를 DB에 반영 (race condition 방지)
    const { count } = await client.from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);
    if (count !== null) {
      await client.from('community_posts').update({ likes_count: count }).eq('id', postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: count } : p));
    }
  }

  async function handleReport(postId, reason) {
    if (!kakaoId) { showToast('로그인이 필요해요', 'info'); return; }
    const client = getAuthenticatedClient(kakaoId);
    const { error } = await client.from('post_reports').insert({
      post_id: postId,
      reported_by: String(kakaoId),
      reason,
    });
    setReportTargetId(null);
    if (error?.code === '23505') {
      showToast('이미 신고한 게시글이에요', 'info');
    } else if (error) {
      showToast('신고를 처리하지 못했어요', 'error');
    } else {
      showToast('신고가 접수됐어요. 검토 후 조치할게요.', 'info');
    }
  }

  async function handleEditPost(postId, newContent) {
    if (!kakaoId) return;
    const client = getAuthenticatedClient(kakaoId);
    const { error } = await client.from('community_posts')
      .update({ content: newContent })
      .eq('id', postId)
      .eq('kakao_id', String(kakaoId));
    if (error) { showToast('수정하지 못했어요', 'error'); return; }
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: newContent } : p));
    setEditTarget(null);
    showToast('게시글을 수정했어요', 'success');
  }

  async function handleDeletePost(postId) {
    if (!kakaoId) return;
    if (!window.confirm('이 게시글을 삭제할까요?')) return;
    const client = getAuthenticatedClient(kakaoId);
    const { error } = await client.from('community_posts')
      .delete()
      .eq('id', postId)
      .eq('kakao_id', String(kakaoId));
    if (error) { showToast('삭제하지 못했어요', 'error'); return; }
    setPosts(prev => prev.filter(p => p.id !== postId));
    showToast('게시글을 삭제했어요', 'success');
  }

  // 필터 + 정렬 적용
  const filteredPosts = posts
    .filter(p => {
      if (filter === '내 글')     return p.kakao_id === String(kakaoId);
      if (filter === '팔로잉')    return followingIds.has(p.kakao_id) || p.kakao_id === String(kakaoId);
      if (filter === '내 별자리') return p.sun_sign && p.sun_sign === mySunSign;
      if (filter === '내 일간')   return p.ilgan    && p.ilgan    === myIlgan;
      return true;
    })
    .filter(p => {
      if (topicFilter) {
        const { topic } = parseTopic(p.content);
        return topic?.value === topicFilter;
      }
      return true;
    })
    .filter(p => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (p.content || '').toLowerCase().includes(q) ||
             (p.nickname || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === '인기순') return (b.likes_count || 0) - (a.likes_count || 0);
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <div className="page step-fade" style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 16px))' }}>
      {/* 헤더 */}
      <div style={{ padding: '28px 20px 16px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>
          ✦ 별숨 광장
        </div>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)' }}>
          오늘의 별 기운 나누기
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', marginTop: 6 }}>
          별자리·일간 정보만 공개돼요. 생년월일은 노출되지 않아요.
        </div>
      </div>

      {/* 필터 탭 */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderBottom: '1px solid var(--line)' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: `1px solid ${filter === f ? 'var(--acc)' : 'var(--line)'}`,
              background: filter === f ? 'var(--goldf)' : 'none',
              cursor: 'pointer',
              fontFamily: 'var(--ff)',
              fontSize: 'var(--xs)',
              color: filter === f ? 'var(--gold)' : 'var(--t3)',
              fontWeight: filter === f ? 700 : 400,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 정렬 탭 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px 6px', borderBottom: '1px solid var(--line)' }}>
        <span style={{ fontSize: '10px', color: 'var(--t4)', flexShrink: 0 }}>정렬</span>
        {['최신순', '인기순'].map(s => (
          <button
            key={s}
            onClick={() => setSort(s)}
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              border: `1px solid ${sort === s ? 'var(--acc)' : 'var(--line)'}`,
              background: sort === s ? 'var(--goldf)' : 'none',
              cursor: 'pointer',
              fontFamily: 'var(--ff)',
              fontSize: '10px',
              color: sort === s ? 'var(--gold)' : 'var(--t3)',
              fontWeight: sort === s ? 700 : 400,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 검색 바 */}
      <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: '12px', color: 'var(--t4)', pointerEvents: 'none',
          }}>🔍</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="내용 또는 닉네임 검색"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '7px 10px 7px 28px',
              borderRadius: 20, border: '1px solid var(--line)',
              background: 'var(--bg2)', color: 'var(--t1)',
              fontFamily: 'var(--ff)', fontSize: '12px', outline: 'none',
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '12px', color: 'var(--t4)', padding: 2,
            }}>✕</button>
          )}
        </div>
      </div>

      {/* 토픽 필터 */}
      <div style={{ display: 'flex', gap: 6, padding: '8px max(20px, env(safe-area-inset-left)) 12px max(20px, env(safe-area-inset-right))', overflowX: 'auto', scrollbarWidth: 'none', scrollPaddingInline: 20, borderBottom: '1px solid var(--line)' }}>
        <button
          onClick={() => setTopicFilter('')}
          style={{
            padding: '4px 12px', borderRadius: 14, fontSize: '10px', cursor: 'pointer', flexShrink: 0,
            border: `1px solid ${!topicFilter ? 'var(--gold)' : 'var(--line)'}`,
            background: !topicFilter ? 'var(--goldf)' : 'none',
            color: !topicFilter ? 'var(--gold)' : 'var(--t3)',
            fontFamily: 'var(--ff)', fontWeight: !topicFilter ? 700 : 400,
          }}
        >전체</button>
        {TOPICS.map(t => (
          <button
            key={t.value}
            onClick={() => setTopicFilter(prev => prev === t.value ? '' : t.value)}
            style={{
              padding: '4px 10px', borderRadius: 14, fontSize: '10px', cursor: 'pointer', flexShrink: 0,
              border: `1px solid ${topicFilter === t.value ? 'var(--gold)' : 'var(--line)'}`,
              background: topicFilter === t.value ? 'var(--goldf)' : 'none',
              color: topicFilter === t.value ? 'var(--gold)' : 'var(--t3)',
              fontFamily: 'var(--ff)', fontWeight: topicFilter === t.value ? 700 : 400,
            }}
          >
            {t.emoji} {t.value}
          </button>
        ))}
      </div>

      {/* 피드 */}
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--t4)', fontSize: 'var(--xs)' }}>
            별빛을 모으는 중이에요...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--t3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌌</div>
            <div style={{ fontSize: 'var(--sm)' }}>
              {filter === '전체' ? '아직 글이 없어요. 첫 번째 별숨을 나눠보세요!' : '해당 필터에 맞는 글이 없어요.'}
            </div>
          </div>
        ) : (
          filteredPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              myKakaoId={String(kakaoId)}
              myNickname={myNickname}
              myLikedIds={myLikedIds}
              followingIds={followingIds}
              onLike={handleLike}
              onReport={(id) => setReportTargetId(id)}
              onFollow={handleFollow}
              onSynergy={setSelectedSynergyUser}
              onEdit={setEditTarget}
              onDelete={handleDeletePost}
              showToast={showToast}
            />
          ))
        )}
      </div>

      {/* 글쓰기 FAB */}
      {user && (
        <button
          onClick={() => setShowWrite(true)}
          style={{
            position: 'fixed',
            bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
            right: 20,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'var(--gold)',
            border: 'none',
            cursor: 'pointer',
            fontSize: 22,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 10000,
          }}
          aria-label="글쓰기"
        >
          ✦
        </button>
      )}

      {showWrite && (
        <WriteModal
          onClose={() => setShowWrite(false)}
          onSubmit={handleSubmitPost}
          nickname={myNickname}
          defaultSunSign={mySunSign}
          defaultIlgan={myIlgan}
          dailyResult={dailyResult}
        />
      )}

      {reportTargetId && (
        <ReportModal
          onClose={() => setReportTargetId(null)}
          onSubmit={(reason) => handleReport(reportTargetId, reason)}
        />
      )}

      {editTarget && (
        <EditPostModal
          post={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEditPost}
        />
      )}

      {selectedSynergyUser && (
        <AnonSynergyModal
          targetUser={selectedSynergyUser}
          myIlgan={myIlgan}
          mySunSign={mySunSign}
          onClose={() => setSelectedSynergyUser(null)}
        />
      )}
    </div>
  );
}

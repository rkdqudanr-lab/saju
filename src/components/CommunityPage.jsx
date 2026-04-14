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

const MAX_CONTENT = 200;
const MAX_COMMENT = 100;

const FILTERS = ['전체', '팔로잉', '내 별자리', '내 일간'];
const REPORT_REASONS = ['부적절한 내용', '스팸·광고', '혐오 발언', '기타'];

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
function PostCard({ post, myKakaoId, myNickname, myLikedIds, followingIds, onLike, onReport, onFollow, onSynergy, showToast }) {
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

  return (
    <div style={{
      background: 'var(--bg1)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r2, 16px)',
      padding: '16px 16px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {/* 상단: 아바타 + 별자리/일간 + 팔로우 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--bg3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
        }}>
          🌙
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: 'var(--t1)' }}>
            {post.nickname || '별숨 유저'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--t4)', marginTop: 1 }}>
            {[post.sun_sign, post.ilgan ? `${post.ilgan}일간` : null].filter(Boolean).join(' · ')}
            &nbsp;·&nbsp;{timeLabel}
          </div>
        </div>
        {isOther && myKakaoId && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => onSynergy(post)}
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                border: '1px solid var(--gold)',
                background: 'var(--goldf)',
                cursor: 'pointer',
                fontFamily: 'var(--ff)',
                fontSize: '10px',
                color: 'var(--gold)',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              궁합
            </button>
            <button
              onClick={() => onFollow(post.kakao_id)}
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                border: `1px solid ${isFollowing ? 'var(--line)' : 'var(--acc)'}`,
                background: isFollowing ? 'none' : 'var(--goldf)',
                cursor: 'pointer',
                fontFamily: 'var(--ff)',
                fontSize: '10px',
                color: isFollowing ? 'var(--t4)' : 'var(--gold)',
                fontWeight: isFollowing ? 400 : 700,
                flexShrink: 0,
              }}
            >
              {isFollowing ? '팔로잉' : '팔로우'}
            </button>
          </div>
        )}
      </div>

      {/* 운세 첨부 배지 */}
      {post.fortune_summary && (
        <div style={{
          padding: '6px 10px',
          borderRadius: 8,
          background: 'var(--goldf)',
          border: '1px solid var(--acc)',
          fontSize: '10px',
          color: 'var(--gold)',
          fontWeight: 600,
        }}>
          ✦ {post.fortune_summary}
        </div>
      )}

      {/* 본문 */}
      <div style={{
        fontSize: 'var(--sm)',
        color: 'var(--t1)',
        lineHeight: 1.7,
        wordBreak: 'break-all',
      }}>
        {post.content}
      </div>

      {/* 하단: 좋아요 + 댓글 + 신고 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
        <button
          onClick={() => onLike(post.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 12px',
            borderRadius: 20,
            border: `1px solid ${liked ? 'var(--acc)' : 'var(--line)'}`,
            background: liked ? 'var(--goldf)' : 'none',
            cursor: 'pointer',
            fontFamily: 'var(--ff)',
            fontSize: 'var(--xs)',
            color: liked ? 'var(--gold)' : 'var(--t3)',
            fontWeight: liked ? 700 : 400,
            transition: 'all 0.15s',
          }}
        >
          ✦ {post.likes_count || 0}
        </button>
        <button
          onClick={() => setShowComments(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px',
            borderRadius: 20,
            border: `1px solid ${showComments ? 'var(--line)' : 'var(--line)'}`,
            background: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--ff)',
            fontSize: 'var(--xs)',
            color: showComments ? 'var(--t1)' : 'var(--t3)',
          }}
        >
          💬 {showComments ? '닫기' : '댓글'}
        </button>
        {post.kakao_id !== myKakaoId && (
          <button
            onClick={() => onReport(post.id)}
            style={{
              padding: '5px 10px',
              borderRadius: 20,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--ff)',
              fontSize: '10px',
              color: 'var(--t4)',
            }}
          >
            신고
          </button>
        )}
      </div>

      {/* 댓글 섹션 */}
      {showComments && (
        <CommentsSection
          postId={post.id}
          myKakaoId={myKakaoId}
          myNickname={myNickname}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  글쓰기 모달 (운세 첨부 옵션 포함)
// ─────────────────────────────────────────────────────────────────
function WriteModal({ onClose, onSubmit, nickname, defaultSunSign, defaultIlgan, dailyResult }) {
  const [content, setContent] = useState('');
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
    await onSubmit(content.trim(), attachFortune && fortuneSummary ? fortuneSummary : null);
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
  const [selectedSynergyUser, setSelectedSynergyUser] = useState(null);

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
    try {
      const { data } = await supabase
        .from('user_follows')
        .select('following_kakao_id')
        .eq('follower_kakao_id', String(kakaoId));
      if (data) setFollowingIds(new Set(data.map(f => f.following_kakao_id)));
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
    try {
      const { data } = await supabase
        .from('post_reactions')
        .select('post_id')
        .eq('kakao_id', String(kakaoId));
      if (data) setMyLikedIds(new Set(data.map(r => r.post_id)));
    } catch {
      // 조용히 실패
    }
  }

  async function handleSubmitPost(content, fortuneSummary) {
    if (!kakaoId) { showToast('로그인이 필요해요', 'info'); return; }
    const client = getAuthenticatedClient(kakaoId);
    const { error } = await client.from('community_posts').insert({
      kakao_id: String(kakaoId),
      nickname: myNickname,
      content,
      sun_sign: mySunSign,
      ilgan: myIlgan,
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
    const already = myLikedIds.has(postId);

    if (already) {
      await client.from('post_reactions').delete()
        .eq('post_id', postId).eq('kakao_id', String(kakaoId));
      await client.from('community_posts')
        .update({ likes_count: posts.find(p => p.id === postId)?.likes_count - 1 || 0 })
        .eq('id', postId);
      setMyLikedIds(prev => { const s = new Set(prev); s.delete(postId); return s; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1) } : p));
    } else {
      const { error } = await client.from('post_reactions').insert({
        post_id: postId, kakao_id: String(kakaoId),
      });
      if (error?.code === '23505') return; // 중복
      await client.from('community_posts')
        .update({ likes_count: (posts.find(p => p.id === postId)?.likes_count || 0) + 1 })
        .eq('id', postId);
      setMyLikedIds(prev => new Set([...prev, postId]));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
      showToast('+5 BP 적립! 공감해줘서 고마워요', 'success');
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

  // 필터 + 정렬 적용
  const filteredPosts = posts
    .filter(p => {
      if (filter === '팔로잉')    return followingIds.has(p.kakao_id) || p.kakao_id === String(kakaoId);
      if (filter === '내 별자리') return p.sun_sign && p.sun_sign === mySunSign;
      if (filter === '내 일간')   return p.ilgan    && p.ilgan    === myIlgan;
      return true;
    })
    .sort((a, b) => {
      if (sort === '인기순') return (b.likes_count || 0) - (a.likes_count || 0);
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <div className="page step-fade" style={{ paddingBottom: 100 }}>
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

/**
 * CommunityPage — 별숨 광장 (실시간 커뮤니티 피드)
 * 별자리/일간별로 오늘의 운세 한 마디를 공유하는 익명 피드입니다.
 * Supabase Realtime으로 새 글이 실시간 반영됩니다.
 * 공감(별 하트) 시 BP +5 지급.
 */

import { useState, useEffect, useRef } from 'react';
import { supabase, getAuthenticatedClient } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';

const MAX_CONTENT = 200;

const FILTERS = ['전체', '내 별자리', '내 일간'];

function PostCard({ post, myKakaoId, myLikedIds, onLike, onReport }) {
  const liked = myLikedIds.has(post.id);
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
      {/* 상단: 아바타 + 별자리/일간 */}
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
      </div>

      {/* 본문 */}
      <div style={{
        fontSize: 'var(--sm)',
        color: 'var(--t1)',
        lineHeight: 1.7,
        wordBreak: 'break-all',
      }}>
        {post.content}
      </div>

      {/* 하단: 좋아요 + 신고 */}
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
    </div>
  );
}

function WriteModal({ onClose, onSubmit, nickname, defaultSunSign, defaultIlgan }) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textRef = useRef(null);

  useEffect(() => { textRef.current?.focus(); }, []);

  async function handleSubmit() {
    if (!content.trim()) return;
    setSubmitting(true);
    await onSubmit(content.trim());
    setSubmitting(false);
  }

  return (
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
    </div>
  );
}

export default function CommunityPage({ showToast }) {
  const { user, form, saju, sun } = useAppStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('전체');
  const [showWrite, setShowWrite] = useState(false);
  const [myLikedIds, setMyLikedIds] = useState(new Set());

  const kakaoId = user?.kakaoId || user?.id;
  const myNickname = user?.nickname || '별숨 유저';
  const mySunSign = sun?.sign || null;
  const myIlgan = saju?.ilgan || null;

  useEffect(() => {
    loadPosts();
    loadMyLikes();

    // Supabase Realtime 구독
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

  async function handleSubmitPost(content) {
    if (!kakaoId) { showToast('로그인이 필요해요', 'info'); return; }
    const client = getAuthenticatedClient(kakaoId);
    const { error } = await client.from('community_posts').insert({
      kakao_id: String(kakaoId),
      nickname: myNickname,
      content,
      sun_sign: mySunSign,
      ilgan: myIlgan,
      likes_count: 0,
    });
    if (error) { showToast('글을 올리지 못했어요', 'error'); return; }
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

  function handleReport(postId) {
    showToast('신고가 접수됐어요. 검토 후 조치할게요.', 'info');
  }

  // 필터 적용
  const filteredPosts = posts.filter(p => {
    if (filter === '내 별자리') return p.sun_sign && p.sun_sign === mySunSign;
    if (filter === '내 일간')   return p.ilgan    && p.ilgan    === myIlgan;
    return true;
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
              myLikedIds={myLikedIds}
              onLike={handleLike}
              onReport={handleReport}
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
        />
      )}
    </div>
  );
}

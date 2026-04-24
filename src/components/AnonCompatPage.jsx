import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getAuthenticatedClient, supabase } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';
import { spendBP } from '../utils/gamificationLogic.js';
import { loadAnalysisCache, saveAnalysisCache } from '../lib/analysisCache.js';

const FILTERS = ['전체', '90점↑', '75점↑', '내 별자리'];
const PAGE_SIZE = 15;

function timeSince(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function getCompatTier(score) {
  if (score >= 90) return { label: '최상급 시너지', emoji: '✨', color: '#E8B048' };
  if (score >= 75) return { label: '천생연분에 가까운 흐름', emoji: '💞', color: '#B4963C' };
  if (score >= 60) return { label: '서로를 성장시키는 인연', emoji: '🌿', color: '#5FAD7A' };
  if (score >= 45) return { label: '배워갈 점이 많은 관계', emoji: '🌊', color: '#7B9EC4' };
  if (score >= 30) return { label: '부딪히며 배우는 관계', emoji: '🔥', color: '#C47A48' };
  return { label: '차이를 크게 느끼는 흐름', emoji: '🌙', color: '#9B4EC4' };
}

function ShareModal({ mySunSign, myIlgan, compatScore, compatTier, onClose, onSubmit, loading }) {
  const [content, setContent] = useState('');

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--bg1)',
          borderRadius: '20px 20px 0 0',
          padding: '28px 20px 40px',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
          익명 궁합 광장에 공유하기
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 16 }}>
          내 궁합 결과를 익명으로 남기고, 비슷한 별숨 흐름의 사람들과 이어질 수 있어요.
        </div>

        <div
          style={{
            background: 'var(--bg2)',
            borderRadius: 'var(--r1)',
            padding: '12px 14px',
            marginBottom: 14,
            border: '1px solid rgba(180,140,50,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '20px' }}>{compatTier.emoji}</span>
            <div>
              <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: compatTier.color }}>
                {compatScore}점 · {compatTier.label}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--t4)' }}>
                {mySunSign || '별자리 미상'} · 일간 {myIlgan || '-'}
              </div>
            </div>
          </div>
        </div>

        <textarea
          placeholder="이 궁합에 대한 한마디를 남겨보세요. 선택 입력이에요."
          value={content}
          onChange={(event) => setContent(event.target.value.slice(0, 100))}
          style={{
            width: '100%',
            height: 80,
            padding: '10px 12px',
            borderRadius: 'var(--r1)',
            border: '1px solid var(--line)',
            background: 'var(--bg2)',
            color: 'var(--t1)',
            fontFamily: 'var(--ff)',
            fontSize: 'var(--sm)',
            resize: 'none',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--t4)', marginBottom: 14 }}>
          {content.length}/100
        </div>

        <button
          onClick={() => onSubmit(content)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px',
            background: 'var(--goldf)',
            border: '1.5px solid var(--acc)',
            borderRadius: 'var(--r1)',
            color: 'var(--gold)',
            fontWeight: 700,
            fontSize: 'var(--sm)',
            fontFamily: 'var(--ff)',
            cursor: 'pointer',
            marginBottom: 10,
          }}
        >
          {loading ? '공유 중...' : '광장에 공유하기'}
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            background: 'none',
            border: 'none',
            color: 'var(--t4)',
            fontSize: 'var(--xs)',
            fontFamily: 'var(--ff)',
            cursor: 'pointer',
          }}
        >
          취소
        </button>
      </div>
    </div>,
    document.body
  );
}

function CompatCard({ post, myKakaoId, onLike, liked }) {
  const tier = getCompatTier(post.compat_score || 75);
  const showActions = post.kakao_id && post.kakao_id !== myKakaoId;

  return (
    <div
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r2, 16px)',
        padding: '16px',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: '18px' }}>{tier.emoji}</span>
            <div>
              <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: tier.color }}>
                {post.compat_score}점
              </div>
              <div style={{ fontSize: '11px', color: 'var(--t4)' }}>{tier.label}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {post.my_sun_sign && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: 'var(--bg3)',
                  color: 'var(--t3)',
                  fontWeight: 600,
                }}
              >
                {post.my_sun_sign}
              </span>
            )}
            {post.my_ilgan && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: 'var(--goldf)',
                  color: 'var(--gold)',
                  fontWeight: 600,
                }}
              >
                {post.my_ilgan}일간
              </span>
            )}
            {post.partner_sun_sign && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: 'var(--bg3)',
                  color: 'var(--t3)',
                }}
              >
                × {post.partner_sun_sign}
              </span>
            )}
          </div>

          {post.content && (
            <div
              style={{
                fontSize: 'var(--sm)',
                color: 'var(--t2)',
                lineHeight: 1.65,
                marginBottom: 8,
              }}
            >
              {post.content}
            </div>
          )}

          <div style={{ fontSize: '11px', color: 'var(--t4)' }}>{timeSince(post.created_at)}</div>
        </div>

        <button
          onClick={() => onLike(post.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '8px 10px',
            borderRadius: 'var(--r1)',
            border: `1px solid ${liked ? 'var(--acc)' : 'var(--line)'}`,
            background: liked ? 'var(--goldf)' : 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '18px' }}>{liked ? '💛' : '🤍'}</span>
          <span style={{ fontSize: '11px', color: liked ? 'var(--gold)' : 'var(--t4)', fontWeight: 600 }}>
            {post.likes_count || 0}
          </span>
        </button>
      </div>

      {showActions && (
        <>
          <div style={{ marginTop: 8, fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.6 }}>
            공유 여부와 상관없이 광장 글만 보이면 팔로우와 편지 보내기를 사용할 수 있어요.
          </div>
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--line)',
              display: 'flex',
              gap: 8,
            }}
          >
            <button
              onClick={() => onLike(post, 'letter')}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 'var(--r1)',
                background: 'linear-gradient(135deg, rgba(200,165,80,0.1), rgba(200,165,80,0.02))',
                border: '1px solid var(--acc)',
                color: 'var(--gold)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--ff)',
              }}
            >
              💌 편지 보내기 (50 BP)
            </button>
            <button
              onClick={() => onLike(post, 'follow')}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 'var(--r1)',
                background: 'var(--bg3)',
                border: '1px solid var(--line)',
                color: 'var(--t3)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--ff)',
              }}
            >
              팔로우하기
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function LetterModal({ post, onClose, onSubmit, loading }) {
  const [content, setContent] = useState('');

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'var(--bg2)',
          borderRadius: 'var(--r2, 16px)',
          padding: '24px 20px',
          border: '1px solid var(--acc)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ fontSize: '24px', textAlign: 'center', marginBottom: 8 }}>💌</div>
        <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', textAlign: 'center', marginBottom: 6 }}>
          인연에게 편지 보내기
        </div>
        <div style={{ fontSize: '11px', color: 'var(--t4)', textAlign: 'center', marginBottom: 16 }}>
          전송 시 50 BP가 차감되고, 상대방에게 익명 편지가 전달돼요.
        </div>

        <textarea
          placeholder="전하고 싶은 마음을 적어보세요."
          value={content}
          onChange={(event) => setContent(event.target.value.slice(0, 200))}
          style={{
            width: '100%',
            height: 100,
            padding: '12px',
            borderRadius: 'var(--r1)',
            border: '1px solid var(--line)',
            background: 'var(--bg1)',
            color: 'var(--t1)',
            fontSize: 'var(--xs)',
            resize: 'none',
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: 4,
            fontFamily: 'var(--ff)',
          }}
        />
        <div style={{ textAlign: 'right', fontSize: '10px', color: 'var(--t4)', marginBottom: 16 }}>
          {content.length}/200
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px',
              background: 'var(--bg3)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r1)',
              color: 'var(--t3)',
              fontSize: 'var(--xs)',
              cursor: 'pointer',
              fontFamily: 'var(--ff)',
            }}
          >
            취소
          </button>
          <button
            onClick={() => onSubmit(content)}
            disabled={loading || !content.trim()}
            style={{
              flex: 1,
              padding: '10px',
              background: 'var(--gold)',
              border: 'none',
              borderRadius: 'var(--r1)',
              color: '#1a1208',
              fontSize: 'var(--xs)',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--ff)',
              opacity: !content.trim() || loading ? 0.6 : 1,
            }}
          >
            {loading ? '전송 중...' : '보내기'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AnonCompatPage({ showToast, shareData: incomingShareData }) {
  const user = useAppStore((s) => s.user);
  const [filter, setFilter] = useState('전체');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [cachedShareData, setCachedShareData] = useState(null);
  const [letterPost, setLetterPost] = useState(null);
  const [letterLoading, setLetterLoading] = useState(false);
  const offsetRef = useRef(0);

  const kakaoId = user?.kakaoId || user?.id;
  const mySunSign = user?.sunSign || '';
  const shareData = incomingShareData || cachedShareData;
  const myIlgan = shareData?.myIlgan || '';

  useEffect(() => {
    if (!kakaoId) return;
    loadAnalysisCache(kakaoId, 'anon_compat_last_share').then((saved) => {
      try {
        setCachedShareData(saved ? JSON.parse(saved) : null);
      } catch {
        setCachedShareData(null);
      }
    });
  }, [kakaoId]);

  useEffect(() => {
    if (!kakaoId || !incomingShareData) return;
    setCachedShareData(incomingShareData);
    saveAnalysisCache(kakaoId, 'anon_compat_last_share', JSON.stringify(incomingShareData)).catch(() => {});
  }, [incomingShareData, kakaoId]);

  const loadPosts = useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);
      try {
        const client = kakaoId ? getAuthenticatedClient(kakaoId) : supabase;
        const offset = reset ? 0 : offsetRef.current;

        let query = client
          .from('anon_compat_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (filter === '90점↑') query = query.gte('compat_score', 90);
        else if (filter === '75점↑') query = query.gte('compat_score', 75);
        else if (filter === '내 별자리' && mySunSign) query = query.eq('my_sun_sign', mySunSign);

        const { data, error } = await query;
        if (error) throw error;

        const nextPosts = data || [];
        if (reset) {
          setPosts(nextPosts);
          offsetRef.current = nextPosts.length;
        } else {
          setPosts((prev) => [...prev, ...nextPosts]);
          offsetRef.current += nextPosts.length;
        }
        setHasMore(nextPosts.length === PAGE_SIZE);
      } catch {
        showToast?.('광장 글을 불러오지 못했어요.', 'error');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, kakaoId, mySunSign, showToast]
  );

  const loadLikes = useCallback(async () => {
    if (!kakaoId) return;
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { data } = await client.from('anon_compat_reactions').select('post_id').eq('kakao_id', String(kakaoId));
      setLikedIds(new Set((data || []).map((row) => row.post_id)));
    } catch {}
  }, [kakaoId]);

  useEffect(() => {
    offsetRef.current = 0;
    loadPosts(true);
    loadLikes();
  }, [filter, loadLikes, loadPosts]);

  async function handleLike(postOrId, action = 'like') {
    if (!kakaoId) {
      showToast?.('로그인 후 이용할 수 있어요.', 'info');
      return;
    }

    const postId = typeof postOrId === 'object' ? postOrId.id : postOrId;
    const client = getAuthenticatedClient(kakaoId);

    if (action === 'letter') {
      setLetterPost(typeof postOrId === 'object' ? postOrId : posts.find((post) => post.id === postId));
      return;
    }

    if (action === 'follow') {
      const targetId = typeof postOrId === 'object' ? postOrId.kakao_id : posts.find((post) => post.id === postId)?.kakao_id;
      if (!targetId) return;
      try {
        const { error } = await client.from('anon_follows').insert({
          follower_id: String(kakaoId),
          following_id: targetId,
        });
        if (error && error.code !== '23505') throw error;
        showToast?.('이 인연을 팔로우했어요.', 'success');
      } catch {
        showToast?.('팔로우 처리 중 오류가 발생했어요.', 'error');
      }
      return;
    }

    const isLiked = likedIds.has(postId);
    if (isLiked) {
      setLikedIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likes_count: Math.max(0, (post.likes_count || 0) - 1) } : post
        )
      );
      await client.from('anon_compat_reactions').delete().eq('post_id', postId).eq('kakao_id', String(kakaoId));
    } else {
      setLikedIds((prev) => new Set([...prev, postId]));
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, likes_count: (post.likes_count || 0) + 1 } : post))
      );
      await client.from('anon_compat_reactions').insert({ post_id: postId, kakao_id: String(kakaoId) });
    }
  }

  async function handleSendLetter(content) {
    if (!letterPost || !kakaoId || !content.trim()) return;
    setLetterLoading(true);
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { ok } = await spendBP(client, String(kakaoId), 50, `LETTER_${Date.now()}`, '편지 전송');
      if (!ok) {
        showToast?.('BP가 부족해요. 50 BP가 필요해요.', 'error');
        return;
      }
      const { error } = await client.from('anon_messages').insert({
        sender_id: String(kakaoId),
        receiver_id: letterPost.kakao_id,
        post_id: letterPost.id,
        content: content.trim(),
      });
      if (error) throw error;
      showToast?.('편지를 전송했어요.', 'success');
      setLetterPost(null);
    } catch {
      showToast?.('편지 전송에 실패했어요.', 'error');
    } finally {
      setLetterLoading(false);
    }
  }

  async function handleShare(content) {
    if (!kakaoId) {
      showToast?.('로그인 후 공유할 수 있어요.', 'info');
      return;
    }
    if (!shareData) {
      showToast?.('먼저 궁합을 확인해봐요.', 'info');
      return;
    }

    setShareLoading(true);
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { error } = await client.from('anon_compat_posts').insert({
        kakao_id: String(kakaoId),
        content: content || null,
        my_sun_sign: shareData?.mySunSign || null,
        my_ilgan: shareData?.myIlgan || null,
        partner_sun_sign: shareData?.partnerSunSign || null,
        partner_ilgan: shareData?.partnerIlgan || null,
        compat_score: shareData?.compatScore || 75,
        compat_tier: shareData?.compatTier || null,
        likes_count: 0,
      });
      if (error) throw error;
      showToast?.('궁합을 광장에 공유했어요.', 'success');
      setShowShareModal(false);
      offsetRef.current = 0;
      loadPosts(true);
    } catch {
      showToast?.('공유에 실패했어요. 다시 시도해주세요.', 'error');
    } finally {
      setShareLoading(false);
    }
  }

  const compatTier = shareData ? getCompatTier(shareData.compatScore || 75) : getCompatTier(75);

  return (
    <div className="page step-fade" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 16px))' }}>
      <div style={{ padding: '28px 24px 16px' }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>
          익명 궁합 광장
        </div>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', lineHeight: 1.3 }}>
          별의 인연을
          <br />
          광장에서 만나기
        </div>
        <div style={{ marginTop: 6, fontSize: 'var(--xs)', color: 'var(--t3)' }}>
          익명으로 궁합 흐름을 나누고, 마음이 맞는 사람을 팔로우하거나 편지를 보낼 수 있어요.
        </div>
      </div>

      <div style={{ padding: '0 24px 16px' }}>
        <button
          onClick={() => {
            if (!kakaoId) {
              showToast?.('로그인 후 공유할 수 있어요.', 'info');
              return;
            }
            if (!shareData) {
              showToast?.('먼저 궁합을 확인한 뒤 공유할 수 있어요.', 'info');
              return;
            }
            setShowShareModal(true);
          }}
          style={{
            width: '100%',
            padding: '13px',
            background: shareData ? 'var(--goldf)' : 'var(--bg2)',
            border: `1.5px solid ${shareData ? 'var(--acc)' : 'var(--line)'}`,
            borderRadius: 'var(--r1)',
            color: shareData ? 'var(--gold)' : 'var(--t4)',
            fontWeight: 700,
            fontSize: 'var(--sm)',
            fontFamily: 'var(--ff)',
            cursor: 'pointer',
          }}
        >
          {shareData ? '✦ 내 궁합 결과 익명 공유하기' : '궁합 확인 후 이곳에서 공유할 수 있어요'}
        </button>
        <div style={{ marginTop: 8, fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.6 }}>
          광장 글만 보이면 팔로우와 편지 보내기는 바로 사용할 수 있어요. 공유 버튼만 최근 궁합 결과가 필요해요.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: '0 24px 14px',
          scrollbarWidth: 'none',
        }}
      >
        {FILTERS.map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            style={{
              flexShrink: 0,
              padding: '7px 14px',
              borderRadius: 20,
              border: `1px solid ${filter === value ? 'var(--acc)' : 'var(--line)'}`,
              background: filter === value ? 'var(--goldf)' : 'none',
              color: filter === value ? 'var(--gold)' : 'var(--t3)',
              fontSize: 'var(--xs)',
              fontWeight: filter === value ? 700 : 400,
              cursor: 'pointer',
              fontFamily: 'var(--ff)',
            }}
          >
            {value}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 24px' }}>
        {posts.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t4)' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 12, color: 'var(--t4)' }}>⋯</div>
            <div style={{ fontSize: 'var(--sm)' }}>아직 공유된 궁합이 없어요.</div>
            <div style={{ fontSize: 'var(--xs)', marginTop: 6 }}>첫 번째로 내 인연의 흐름을 남겨보세요.</div>
          </div>
        )}

        {posts.map((post) => (
          <CompatCard
            key={post.id}
            post={post}
            myKakaoId={kakaoId}
            liked={likedIds.has(post.id)}
            onLike={handleLike}
          />
        ))}

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--t4)' }}>
            <div
              style={{
                width: 24,
                height: 24,
                border: '2px solid var(--line)',
                borderTopColor: 'var(--gold)',
                borderRadius: '50%',
                animation: 'orbSpin 0.8s linear infinite',
                margin: '0 auto',
              }}
            />
          </div>
        )}

        {!loading && hasMore && posts.length > 0 && (
          <button
            onClick={() => loadPosts(false)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'none',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r1)',
              color: 'var(--t3)',
              fontSize: 'var(--xs)',
              cursor: 'pointer',
              fontFamily: 'var(--ff)',
              marginBottom: 8,
            }}
          >
            더 보기
          </button>
        )}
      </div>

      {showShareModal && (
        <ShareModal
          mySunSign={shareData?.mySunSign || mySunSign}
          myIlgan={shareData?.myIlgan || myIlgan}
          compatScore={shareData?.compatScore || 75}
          compatTier={compatTier}
          onClose={() => setShowShareModal(false)}
          onSubmit={handleShare}
          loading={shareLoading}
        />
      )}

      {letterPost && (
        <LetterModal
          post={letterPost}
          onClose={() => setLetterPost(null)}
          onSubmit={handleSendLetter}
          loading={letterLoading}
        />
      )}
    </div>
  );
}

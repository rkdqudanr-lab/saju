/**
 * AnonCompatPage — 익명 궁합 광장
 * 사용자들이 익명으로 궁합 결과를 공유하고 공감하는 피드
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';

const FILTERS = ['전체', '90점↑', '75점↑', '내 별자리'];
const PAGE_SIZE = 15;

function timeSince(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function getCompatTier(score) {
  if (score >= 90) return { label: '환상의 티키타카', emoji: '✦', color: '#E8B048' };
  if (score >= 75) return { label: '천생연분에 가까운 두 별', emoji: '☽', color: '#B4963C' };
  if (score >= 60) return { label: '서로를 성장시키는 인연', emoji: '↑', color: '#5FAD7A' };
  if (score >= 45) return { label: '창과 방패', emoji: '◈', color: '#7B9EC4' };
  if (score >= 30) return { label: '서로가 서로의 브레이크', emoji: '♎', color: '#C47A48' };
  return { label: '도전적 성장 관계', emoji: '△', color: '#9B4EC4' };
}

// ── 공유 모달 ──────────────────────────────────────────────────
function ShareModal({ mySunSign, myIlgan, compatScore, compatTier, onClose, onSubmit, loading }) {
  const [content, setContent] = useState('');

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--bg1)',
        borderRadius: '20px 20px 0 0',
        padding: '28px 20px 40px',
      }}>
        <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
          익명 궁합 광장에 공유하기
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 16 }}>
          나의 별자리·일간과 궁합 점수가 익명으로 공개돼요
        </div>

        {/* 미리보기 */}
        <div style={{
          background: 'var(--bg2)',
          borderRadius: 'var(--r1)',
          padding: '12px 14px',
          marginBottom: 14,
          border: '1px solid rgba(180,140,50,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: '20px' }}>{compatTier.emoji}</span>
            <div>
              <div style={{ fontSize: 'var(--xs)', fontWeight: 700, color: compatTier.color }}>
                {compatScore}점 · {compatTier.label}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--t4)' }}>
                {mySunSign} · 일간 {myIlgan}
              </div>
            </div>
          </div>
        </div>

        <textarea
          placeholder="한 줄 소감을 남겨봐요 (선택, 최대 100자)"
          value={content}
          onChange={e => setContent(e.target.value.slice(0, 100))}
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
            width: '100%', padding: '13px',
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
          {loading ? '공유 중...' : '✦ 광장에 공유하기'}
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '10px',
            background: 'none', border: 'none',
            color: 'var(--t4)', fontSize: 'var(--xs)',
            fontFamily: 'var(--ff)', cursor: 'pointer',
          }}
        >
          취소
        </button>
      </div>
    </div>,
    document.body,
  );
}

// ── 피드 카드 ──────────────────────────────────────────────────
function CompatCard({ post, myKakaoId, onLike, liked }) {
  const tier = getCompatTier(post.compat_score || 75);

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r2, 16px)',
      padding: '16px',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1 }}>
          {/* 점수 + 티어 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: '18px' }}>{tier.emoji}</span>
            <div>
              <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: tier.color }}>
                {post.compat_score}점
              </div>
              <div style={{ fontSize: '11px', color: 'var(--t4)' }}>{tier.label}</div>
            </div>
          </div>

          {/* 별자리/일간 뱃지 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {post.my_sun_sign && (
              <span style={{
                fontSize: '11px', padding: '2px 8px',
                borderRadius: 20, background: 'var(--bg3)',
                color: 'var(--t3)', fontWeight: 600,
              }}>
                {post.my_sun_sign}
              </span>
            )}
            {post.my_ilgan && (
              <span style={{
                fontSize: '11px', padding: '2px 8px',
                borderRadius: 20, background: 'var(--goldf)',
                color: 'var(--gold)', fontWeight: 600,
              }}>
                {post.my_ilgan}일간
              </span>
            )}
            {post.partner_sun_sign && (
              <span style={{
                fontSize: '11px', padding: '2px 8px',
                borderRadius: 20, background: 'var(--bg3)',
                color: 'var(--t3)',
              }}>
                × {post.partner_sun_sign}
              </span>
            )}
          </div>

          {/* 소감 */}
          {post.content && (
            <div style={{
              fontSize: 'var(--sm)', color: 'var(--t2)',
              lineHeight: 1.65, marginBottom: 8,
            }}>
              {post.content}
            </div>
          )}

          <div style={{ fontSize: '11px', color: 'var(--t4)' }}>
            {timeSince(post.created_at)}
          </div>
        </div>

        {/* 공감 버튼 */}
        <button
          onClick={() => onLike(post.id)}
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 2,
            padding: '8px 10px',
            borderRadius: 'var(--r1)',
            border: `1px solid ${liked ? 'var(--acc)' : 'var(--line)'}`,
            background: liked ? 'var(--goldf)' : 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '18px', color: liked ? 'var(--gold)' : 'var(--t4)' }}>{liked ? '♥' : '♡'}</span>
          <span style={{ fontSize: '11px', color: liked ? 'var(--gold)' : 'var(--t4)', fontWeight: 600 }}>
            {post.likes_count || 0}
          </span>
        </button>
      </div>
    </div>
  );
}

// ── 메인 페이지 ────────────────────────────────────────────────
export default function AnonCompatPage({ showToast, shareData }) {
  const { user } = useAppStore();
  const [filter, setFilter] = useState('전체');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const offsetRef = useRef(0);

  const kakaoId = user?.kakaoId || user?.id;
  const mySunSign = user?.sunSign || '';
  const myIlgan = shareData?.myIlgan || '';

  const loadPosts = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const client = getAuthenticatedClient(kakaoId);
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

      const newPosts = data || [];
      if (reset) {
        setPosts(newPosts);
        offsetRef.current = newPosts.length;
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        offsetRef.current += newPosts.length;
      }
      setHasMore(newPosts.length === PAGE_SIZE);
    } catch {
      showToast?.('피드를 불러오지 못했어요', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, kakaoId, mySunSign]);

  // 내가 공감한 목록 로드
  const loadLikes = useCallback(async () => {
    if (!kakaoId) return;
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { data } = await client
        .from('anon_compat_reactions')
        .select('post_id')
        .eq('kakao_id', String(kakaoId));
      setLikedIds(new Set((data || []).map(r => r.post_id)));
    } catch { /* 조용히 실패 */ }
  }, [kakaoId]);

  useEffect(() => {
    offsetRef.current = 0;
    loadPosts(true);
    loadLikes();
  }, [filter]);

  async function handleLike(postId) {
    if (!kakaoId) { showToast?.('로그인 후 공감할 수 있어요', 'info'); return; }
    const isLiked = likedIds.has(postId);
    const client = getAuthenticatedClient(kakaoId);

    if (isLiked) {
      setLikedIds(prev => { const s = new Set(prev); s.delete(postId); return s; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1) } : p));
      await client.from('anon_compat_reactions').delete().eq('post_id', postId).eq('kakao_id', String(kakaoId));
      await client.from('anon_compat_posts').update({ likes_count: posts.find(p => p.id === postId)?.likes_count - 1 }).eq('id', postId);
    } else {
      setLikedIds(prev => new Set([...prev, postId]));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
      await client.from('anon_compat_reactions').insert({ post_id: postId, kakao_id: String(kakaoId) });
      await client.from('anon_compat_posts').update({ likes_count: (posts.find(p => p.id === postId)?.likes_count || 0) + 1 }).eq('id', postId);
    }
  }

  async function handleShare(content) {
    if (!kakaoId) { showToast?.('로그인 후 공유할 수 있어요', 'info'); return; }
    if (!shareData) { showToast?.('먼저 궁합을 확인해봐요', 'info'); return; }

    setShareLoading(true);
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { error } = await client.from('anon_compat_posts').insert({
        kakao_id: String(kakaoId),
        content: content || null,
        my_sun_sign: shareData.mySunSign || null,
        my_ilgan: shareData.myIlgan || null,
        partner_sun_sign: shareData.partnerSunSign || null,
        partner_ilgan: shareData.partnerIlgan || null,
        compat_score: shareData.compatScore || 75,
        compat_tier: shareData.compatTier || null,
        likes_count: 0,
      });
      if (error) throw error;
      showToast?.('궁합이 광장에 공유됐어요 ✦', 'success');
      setShowShareModal(false);
      offsetRef.current = 0;
      loadPosts(true);
    } catch {
      showToast?.('공유에 실패했어요. 다시 시도해봐요.', 'error');
    } finally {
      setShareLoading(false);
    }
  }

  const compatTier = shareData ? getCompatTier(shareData.compatScore || 75) : getCompatTier(75);

  return (
    <div className="page step-fade" style={{ paddingBottom: 40 }}>
      {/* 헤더 */}
      <div style={{ padding: '28px 20px 16px' }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6 }}>
          ✦ 익명 궁합 광장
        </div>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', lineHeight: 1.3 }}>
          두 별의 인연을<br />함께 나눠요
        </div>
        <div style={{ marginTop: 6, fontSize: 'var(--xs)', color: 'var(--t3)' }}>
          익명으로 나의 궁합 결과를 공유하고 다른 별숨들의 인연 이야기를 만나요
        </div>
      </div>

      {/* 공유 버튼 (shareData 있을 때) */}
      {shareData && (
        <div style={{ padding: '0 20px 16px' }}>
          <button
            onClick={() => {
              if (!kakaoId) { showToast?.('로그인 후 공유할 수 있어요', 'info'); return; }
              setShowShareModal(true);
            }}
            style={{
              width: '100%', padding: '13px',
              background: 'var(--goldf)',
              border: '1.5px solid var(--acc)',
              borderRadius: 'var(--r1)',
              color: 'var(--gold)', fontWeight: 700,
              fontSize: 'var(--sm)', fontFamily: 'var(--ff)',
              cursor: 'pointer',
            }}
          >
            ✦ 내 궁합 결과 익명 공유하기
          </button>
        </div>
      )}

      {/* 필터 탭 */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto',
        padding: '0 20px 14px',
        scrollbarWidth: 'none',
      }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flexShrink: 0,
              padding: '7px 14px',
              borderRadius: 20,
              border: `1px solid ${filter === f ? 'var(--acc)' : 'var(--line)'}`,
              background: filter === f ? 'var(--goldf)' : 'none',
              color: filter === f ? 'var(--gold)' : 'var(--t3)',
              fontSize: 'var(--xs)', fontWeight: filter === f ? 700 : 400,
              cursor: 'pointer', fontFamily: 'var(--ff)',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 피드 */}
      <div style={{ padding: '0 20px' }}>
        {posts.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t4)' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 12, color: 'var(--t4)' }}>✦</div>
            <div style={{ fontSize: 'var(--sm)' }}>아직 공유된 궁합이 없어요</div>
            <div style={{ fontSize: 'var(--xs)', marginTop: 6 }}>첫 번째로 나의 인연을 공유해봐요</div>
          </div>
        )}

        {posts.map(post => (
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
            <div style={{
              width: 24, height: 24,
              border: '2px solid var(--line)',
              borderTopColor: 'var(--gold)',
              borderRadius: '50%',
              animation: 'orbSpin 0.8s linear infinite',
              margin: '0 auto',
            }} />
          </div>
        )}

        {!loading && hasMore && posts.length > 0 && (
          <button
            onClick={() => loadPosts(false)}
            style={{
              width: '100%', padding: '12px',
              background: 'none', border: '1px solid var(--line)',
              borderRadius: 'var(--r1)', color: 'var(--t3)',
              fontSize: 'var(--xs)', cursor: 'pointer',
              fontFamily: 'var(--ff)', marginBottom: 8,
            }}
          >
            더보기 ▾
          </button>
        )}
      </div>

      {/* 공유 모달 */}
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
    </div>
  );
}

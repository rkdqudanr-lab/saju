import { useState, useEffect, useRef, useCallback } from "react";
import DailyStarCardV2 from "../components/DailyStarCardV2.jsx";
import ShieldBlockModal from "../components/ShieldBlockModal.jsx";
import LuckyItemsCard from "../components/LuckyItemsCard.jsx";
import FeatureLoadingScreen from "../components/FeatureLoadingScreen.jsx";
import BoostItemSheet from "../components/BoostItemSheet.jsx";
import { detectBadtime } from "../utils/gamificationLogic.js";
import { useUserCtx, useSajuCtx, useGamCtx } from "../context/AppContext.jsx";
import { useAppStore } from "../store/useAppStore.js";
import { getAuthenticatedClient } from "../lib/supabase.js";
import { getDailyDateKey, writeDailyLocalCache } from "../lib/dailyDataAccess.js";
import { findItem } from "../utils/gachaItems.js";

// ── 별숨 변화 팝업 ───────────────────────────────────────────────
function BoostRegenModal({ isOpen, boostAmount, onConfirm, onClose, isLoading }) {
  if (!isOpen) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        animation: 'purifyFadeIn 0.25s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'var(--bg1)',
          borderRadius: 20,
          padding: '28px 24px 24px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          border: '1px solid var(--acc)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>✨</div>
        <div style={{ fontSize: 'var(--sm)', fontWeight: 800, color: 'var(--t1)', marginBottom: 8, lineHeight: 1.4 }}>
          오늘 별숨의 변화가 있어요
        </div>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.7, marginBottom: 24 }}>
          아이템으로 <span style={{ color: 'var(--gold)', fontWeight: 700 }}>+{boostAmount}점</span> 올랐어요.<br />
          새로운 흐름으로 별숨을 다시 풀이해드릴까요?
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '13px 0',
              borderRadius: 12,
              background: 'var(--bg2)',
              border: '1px solid var(--line)',
              color: 'var(--t3)',
              fontWeight: 700,
              fontSize: 'var(--xs)',
              cursor: 'pointer',
              fontFamily: 'var(--ff)',
            }}
          >
            아니오
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '13px 0',
              borderRadius: 12,
              background: 'var(--gold)',
              border: 'none',
              color: '#fff',
              fontWeight: 800,
              fontSize: 'var(--xs)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--ff)',
              opacity: isLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {isLoading ? (
              <>
                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'orbSpin 0.7s linear infinite' }} />
                불러오는 중
              </>
            ) : '네, 다시 볼래요'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── slideUp 애니메이션 키프레임 (한 번만 주입) ───────────────────
let _slideUpInjected = false;
function ensureSlideUpStyle() {
  if (_slideUpInjected || typeof document === 'undefined') return;
  _slideUpInjected = true;
  const style = document.createElement('style');
  style.textContent = `@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
  document.head.appendChild(style);
}

export default function DailyHoroscopePage({
  today,
  dailyResult, dailyLoading, dailyCount, DAILY_MAX,
  askDailyHoroscope,
  currentBp = 0,
  freeRechargeAvailable = false,
  freeRechargeTimeRemaining = null,
  onBlockBadtime = null,
  onRechargeFreeBP = null,
  onEarnBP = null,
  isBlockingBadtime = false,
  earnBP = null,
}) {
  ensureSlideUpStyle();

  const { user, showToast } = useUserCtx();
  const { saju = null } = useSajuCtx();
  const { gamificationState = {} } = useGamCtx();
  const equippedSajuItem = useAppStore((s) => s.equippedSajuItem);
  const setStep = useAppStore((s) => s.setStep);

  const [badtimeModal, setBadtimeModal] = useState({ isOpen: false, badtime: null });
  const [activeTab, setActiveTab] = useState('horoscope');
  const savedScoreDateRef = useRef(null);

  // 아이템 관련 state (순서 중요: handleApplyPending보다 먼저)
  const [ownedRows, setOwnedRows] = useState(null);
  const [pendingItems, setPendingItems] = useState([]);
  const [appliedBoost, setAppliedBoost] = useState(0);
  const [isPurifying, setIsPurifying] = useState(false);

  // 시트 / 팝업 state
  const [isBoostSheetOpen, setIsBoostSheetOpen] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [lastBatchBoost, setLastBatchBoost] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // 일별 점수 저장
  useEffect(() => {
    if (!dailyResult?.score || !user) return;
    const dateKey = getDailyDateKey(); // shadowing 방지를 위해 변수명 변경
    if (savedScoreDateRef.current === dateKey) return;
    savedScoreDateRef.current = dateKey;
    const kakaoId = user.kakaoId || user.id;
    if (!kakaoId) return; // kakaoId 없으면 중단

    writeDailyLocalCache(kakaoId, 'horoscope_score', String(dailyResult.score), dateKey);
    const client = getAuthenticatedClient(kakaoId);
    if (!client) return;

    client
      .from('daily_scores')
      .upsert(
        { kakao_id: String(kakaoId), score_date: dateKey, score: dailyResult.score },
        { onConflict: 'kakao_id,score_date' }
      )
      .then(({ error }) => { if (error) console.warn('[별숨] daily_scores upsert:', error); });
  }, [dailyResult?.score, user]);

  // 배드타임 감지
  useEffect(() => {
    if (dailyResult) {
      const score = dailyResult.score;
      const badtime = (score !== null && score !== undefined)
        ? detectBadtime(score, dailyResult.text || '')
        : null;
      if (badtime) {
        setBadtimeModal({ isOpen: true, badtime });
      }
    }
  }, [dailyResult]);

  // 보관함 로드
  useEffect(() => {
    const kakaoId = user?.kakaoId || user?.id;
    if (!kakaoId || !dailyResult) return;
    const client = getAuthenticatedClient(String(kakaoId));
    if (!client) return;
    client
      .from('user_shop_inventory')
      .select('id, item_id')
      .eq('kakao_id', String(kakaoId))
      .then(({ data, error }) => {
        if (error) { setOwnedRows([]); return; }
        const rows = (data || [])
          .map((row) => ({ rowId: String(row.id), item: findItem(String(row.item_id)) }))
          .filter((row) => row.item?.aspectKey);
        setOwnedRows(rows);
      })
      .catch(() => setOwnedRows([]));
  }, [user?.kakaoId, user?.id, dailyResult]);

  const handleBlockBadtime = async () => {
    if (onBlockBadtime) {
      await onBlockBadtime();
      setBadtimeModal({ isOpen: false, badtime: null });
    }
  };

  const handleRecharge = async () => {
    if (onRechargeFreeBP) await onRechargeFreeBP();
  };

  const canUseItems = !isPurifying && !dailyLoading;
  const currentScore = dailyResult?.score ?? null;
  const isScoreMaxed = (currentScore ?? 0) + (appliedBoost || 0) >= 100;

  const handleToggleItem = useCallback((row) => {
    setPendingItems((prev) => {
      const exists = prev.find((p) => p.rowId === row.rowId);
      return exists ? prev.filter((p) => p.rowId !== row.rowId) : [...prev, row];
    });
  }, []);

  // 아이템 소모 + 부분 AI 재생성
  const handleApplyPending = useCallback(async () => {
    if (pendingItems.length === 0 || isPurifying || dailyLoading) return;

    const kakaoId = user?.kakaoId || user?.id;
    if (!kakaoId) return;

    setIsPurifying(true);
    const client = getAuthenticatedClient(String(kakaoId));

    try {
      // 1. 아이템 소모 (user_shop_inventory에서 삭제)
      const rowIds = pendingItems.map((p) => p.rowId);
      const { error: delError } = await client
        .from('user_shop_inventory')
        .delete()
        .in('id', rowIds)
        .eq('kakao_id', String(kakaoId));
      if (delError) throw delError;

      // 2. AI 부분 재생성 (해당 카테고리 텍스트만 갱신, BP 미차감, 횟수 미증가)
      const transientItems = pendingItems.map((p) => p.item);
      await askDailyHoroscope?.({
        skipBpCharge: true,
        skipConfirm: true,
        saveHistory: true,
        incrementCount: false,
        transientItems,
        previousResult: dailyResult?.text,
      });

      // 3. 상태 갱신
      const totalBoost = pendingItems.reduce((s, p) => s + (p.item?.boost || 0), 0);
      setAppliedBoost((prev) => prev + totalBoost);
      setOwnedRows((prev) => prev?.filter((r) => !rowIds.includes(r.rowId)) ?? null);
      setPendingItems([]);
      setIsBoostSheetOpen(false);

      // 4. 20점 이상이면 전체 재생성 제안
      if (totalBoost >= 20) {
        setLastBatchBoost(totalBoost);
        setShowRegenModal(true);
      } else {
        showToast?.('아이템 기운이 오늘 운세에 스며들었어요 ✦', 'success');
      }
    } catch (err) {
      console.error('[별숨] 아이템 적용 실패:', err);
      showToast?.('기운 정화 중 오류가 발생했어요. 다시 시도해주세요.', 'error');
    } finally {
      setIsPurifying(false);
    }
  }, [pendingItems, isPurifying, dailyLoading, user, askDailyHoroscope, dailyResult, showToast]);

  // 전체 별숨 재생성 (20점 팝업 "네" 선택 시)
  const handleFullRegenerate = useCallback(async () => {
    setIsRegenerating(true);
    try {
      await askDailyHoroscope?.({
        skipBpCharge: true,
        skipConfirm: true,
        saveHistory: true,
        incrementCount: false,
      });
      setAppliedBoost(0);
      setShowRegenModal(false);
      showToast?.('새로운 별숨이 도착했어요 ✨', 'success');
    } catch {
      showToast?.('별숨을 다시 불러오지 못했어요. 잠시 후 시도해주세요.', 'error');
    } finally {
      setIsRegenerating(false);
    }
  }, [askDailyHoroscope, showToast]);

  // 정화 재점 (기존)
  const handlePurify = useCallback(async () => {
    if (isPurifying || dailyLoading || dailyCount >= DAILY_MAX) return;
    setAppliedBoost(0);
    setIsPurifying(true);
    const animPromise = new Promise((r) => setTimeout(r, 1200));
    try {
      await Promise.all([
        askDailyHoroscope?.({
          skipBpCharge: true,
          skipConfirm: true,
          saveHistory: false,
          incrementCount: false,
        }),
        animPromise,
      ]);
    } catch {
      await animPromise;
    } finally {
      setIsPurifying(false);
    }
  }, [isPurifying, dailyLoading, dailyCount, DAILY_MAX, askDailyHoroscope]);

  if (dailyLoading && !isPurifying) {
    return <FeatureLoadingScreen type="daily" />;
  }

  const showBoostButton = !!(dailyResult && !isScoreMaxed && ownedRows && ownedRows.length > 0);

  return (
    <div className="page step-fade" style={{ position: 'relative' }}>
      {/* 정화 오버레이 */}
      {isPurifying && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          animation: 'purifyFadeIn 0.3s ease', pointerEvents: 'none',
        }}>
          <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #fff9c4, var(--gold))', boxShadow: '0 0 20px var(--gold), 0 0 40px rgba(200,160,80,0.4)', animation: 'purifyOrbPulse 1s ease-in-out infinite' }} />
            {[44, 62, 80].map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: s, height: s, borderRadius: '50%', border: '1.5px solid var(--gold)', animation: `purifyRingExpand 1.6s ease-out ${i * 0.35}s infinite` }} />
            ))}
          </div>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.1em', animation: 'purifyTextBlink 1.2s ease-in-out infinite' }}>
            정화 중...
          </div>
        </div>
      )}

      <div className="inner" style={{ paddingTop: 16, paddingBottom: 40, filter: isPurifying ? 'blur(4px)' : 'none', transition: 'filter 0.4s', pointerEvents: isPurifying ? 'none' : 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '1.4rem', marginBottom: 8, color: 'var(--gold)' }}>✦</div>
          <div style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
            오늘 하루 나의 별숨
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>
            {today?.month || '--'}월 {today?.day || '--'}일 · 매일 새로워져요
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #eee' }}>
          <button
            onClick={() => setActiveTab('horoscope')}
            style={{
              flex: 1, padding: '12px 0', background: 'none', border: 'none',
              borderBottom: activeTab === 'horoscope' ? '2px solid var(--gold)' : 'none',
              color: activeTab === 'horoscope' ? 'var(--gold)' : 'var(--t4)',
              cursor: 'pointer', fontWeight: activeTab === 'horoscope' ? '600' : '400', fontSize: '13px',
            }}
          >
            오늘의 운세
          </button>
          <button
            onClick={() => setActiveTab('lucky')}
            style={{
              flex: 1, padding: '12px 0', background: 'none', border: 'none',
              borderBottom: activeTab === 'lucky' ? '2px solid var(--gold)' : 'none',
              color: activeTab === 'lucky' ? 'var(--gold)' : 'var(--t4)',
              cursor: 'pointer', fontWeight: activeTab === 'lucky' ? '600' : '400', fontSize: '13px',
            }}
          >
            🍀 행운 아이템
          </button>
        </div>

        {/* 운세 탭 */}
        {activeTab === 'horoscope' && (
          <>
            {dailyResult ? (
              <>
                {/* 점수 올리기 버튼 */}
                {showBoostButton && (
                  <button
                    type="button"
                    onClick={() => setIsBoostSheetOpen(true)}
                    disabled={isPurifying || dailyLoading}
                    title="보유 아이템으로 오늘 운세 점수를 올려요"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginLeft: 'auto',
                      marginBottom: 10,
                      padding: '7px 14px',
                      borderRadius: 999,
                      background: 'var(--goldf)',
                      border: '1px solid var(--acc)',
                      color: 'var(--gold)',
                      fontWeight: 700,
                      fontSize: 'var(--xs)',
                      cursor: 'pointer',
                      fontFamily: 'var(--ff)',
                    }}
                  >
                    {/* + SVG 아이콘 */}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <circle cx="7" cy="7" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M7 4v6M4 7h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    점수 올리기
                    {appliedBoost > 0 && (
                      <span style={{ fontSize: 10, opacity: 0.8 }}>+{appliedBoost}점 적용됨</span>
                    )}
                  </button>
                )}

                <DailyStarCardV2
                  result={dailyResult}
                  ownedRows={ownedRows}
                  pendingItems={pendingItems}
                  scoreBoost={appliedBoost}
                />

                {/* 장착된 메인 기운 공명 카드 */}
                {equippedSajuItem && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', marginTop: 10,
                    background: 'linear-gradient(135deg, rgba(232,176,72,0.08), rgba(232,176,72,0.02))',
                    border: '1px solid rgba(232,176,72,0.25)',
                    borderRadius: 'var(--r1)',
                    animation: 'dsc-breathe 4s ease-in-out infinite',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'var(--bg2)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0,
                      boxShadow: '0 0 10px rgba(232,176,72,0.4)',
                    }}>
                      {equippedSajuItem.emoji || '✦'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.04em', marginBottom: 2 }}>
                        ✦ 메인 기운 적용 중
                      </div>
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--t1)', fontWeight: 600 }}>
                        {equippedSajuItem.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--t4)', marginTop: 2, lineHeight: 1.4 }}>
                        {(equippedSajuItem.effect || equippedSajuItem.description || '').slice(0, 40)}
                      </div>
                    </div>
                    <button
                      onClick={() => setStep(38)}
                      style={{
                        flexShrink: 0, fontSize: '10px', color: 'var(--t4)',
                        background: 'none', border: '1px solid var(--line)',
                        borderRadius: 20, padding: '3px 8px',
                        fontFamily: 'var(--ff)', cursor: 'pointer',
                      }}
                    >
                      변경
                    </button>
                  </div>
                )}

                {/* 기운 미장착 시 유도 */}
                {!equippedSajuItem && (
                  <button
                    onClick={() => setStep(38)}
                    style={{
                      width: '100%', marginTop: 10, padding: '10px 14px',
                      background: 'none', border: '1px dashed var(--line)',
                      borderRadius: 'var(--r1)', display: 'flex', alignItems: 'center',
                      gap: 8, cursor: 'pointer', fontFamily: 'var(--ff)',
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>✦</span>
                    <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>메인 기운을 장착하면 오늘의 운세에 반영돼요</span>
                  </button>
                )}

                {dailyCount < DAILY_MAX ? (
                  <button
                    className="cta-main"
                    style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px', marginTop: 12, background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 }}
                    onClick={handlePurify}
                    disabled={isPurifying || dailyLoading}
                  >
                    <span style={{ animation: isPurifying ? 'purifyBtnGlow 1s infinite' : 'none' }}>✦</span>
                    정화 재점
                    <span style={{ fontSize: 10, opacity: 0.7 }}>({DAILY_MAX - dailyCount}/{DAILY_MAX})</span>
                  </button>
                ) : (
                  <div style={{ textAlign: 'center', fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 12 }}>
                    오늘 별숨을 모두 읽었어요 · 내일 다시 만나요
                  </div>
                )}
              </>
            ) : (
              <button
                className="cta-main"
                style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px' }}
                onClick={async () => {
                  try {
                    setAppliedBoost(0);
                    await askDailyHoroscope?.();
                  } catch (err) {
                    if (err?.message === 'LOGIN_REQUIRED') {
                      // useConsultation 내부에서 이미 처리했을 수 있지만 안전하게 한 번 더
                    } else {
                      showToast?.('운세를 불러오는 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.', 'error');
                    }
                  }
                }}
              >
                오늘 기운 확인하기 ✦
              </button>
            )}
          </>
        )}

        {/* 행운 아이템 탭 */}
        {activeTab === 'lucky' && (
          <LuckyItemsCard today={today} saju={saju} dailyResult={dailyResult} />
        )}
      </div>

      {/* 배드타임 액막이 모달 */}
      <ShieldBlockModal
        isOpen={badtimeModal.isOpen}
        symptom={badtimeModal.badtime?.symptom}
        currentBp={currentBp}
        cost={badtimeModal.badtime?.cost || 20}
        freeRechargeAvailable={freeRechargeAvailable}
        freeRechargeTimeRemaining={freeRechargeTimeRemaining}
        onBlock={handleBlockBadtime}
        onClose={() => setBadtimeModal({ isOpen: false, badtime: null })}
        onRecharge={handleRecharge}
        isBlocking={isBlockingBadtime}
      />

      {/* 점수 올리기 시트 */}
      <BoostItemSheet
        isOpen={isBoostSheetOpen}
        onClose={() => { setIsBoostSheetOpen(false); setPendingItems([]); }}
        ownedRows={ownedRows}
        pendingItems={pendingItems}
        onToggleItem={handleToggleItem}
        onApply={handleApplyPending}
        isApplying={isPurifying}
        currentScore={currentScore}
        appliedBoost={appliedBoost}
        setStep={setStep}
      />

      {/* 별숨 변화 팝업 */}
      <BoostRegenModal
        isOpen={showRegenModal}
        boostAmount={lastBatchBoost}
        onConfirm={handleFullRegenerate}
        onClose={() => setShowRegenModal(false)}
        isLoading={isRegenerating}
      />
    </div>
  );
}

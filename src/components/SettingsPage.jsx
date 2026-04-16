import { useState, useEffect, useCallback } from "react";
import { getAuthenticatedClient } from '../lib/supabase.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getDaysInMonth(year, month) {
  if (!month) return 31;
  if (!year || String(year).length < 4) return 31;
  return new Date(parseInt(year), parseInt(month), 0).getDate();
}

// ═══════════════════════════════════════════════════════════
//  ⚙️ 설정 페이지
// ═══════════════════════════════════════════════════════════

const LIFE_STAGE_OPTIONS = [
  { value: 'jobseek', label: '취업 준비 중', emoji: '◈' },
  { value: 'dating', label: '연애 중', emoji: '◇' },
  { value: 'healing', label: '이별 후 회복 중', emoji: '◇' },
  { value: 'employed', label: '직장인', emoji: '◈' },
  { value: 'business', label: '사업 운영 중', emoji: '↑' },
  { value: 'student', label: '학업·시험 준비 중', emoji: '◈' },
  { value: 'parenting', label: '육아 중', emoji: '◇' },
  { value: 'reentry', label: '경력 재진입 준비 중', emoji: '↗' },
  { value: 'free', label: '자유 선택 (기본)', emoji: '✦' },
];

const STYLE_OPTIONS = [
  {
    value: 'T',
    label: '분석형',
    sub: 'T형',
    desc: '논리적이고 구체적인 분석 중심',
    emoji: '◈',
  },
  {
    value: 'M',
    label: '균형형',
    sub: '중간형',
    desc: '분석과 공감을 균형 있게',
    emoji: '◇',
  },
  {
    value: 'F',
    label: '공감형',
    sub: 'F형',
    desc: '따뜻하고 감성적인 위로 중심',
    emoji: '✧',
  },
];

const PLANS = [
  {
    id: 'beta',
    label: '베타 무료',
    desc: '현재 베타 기간 중 — 모든 기능 무료',
    badge: '이용 중',
    hot: true,
  },
  {
    id: 'basic',
    label: '기본 플랜',
    desc: '출시 예정 — 기본 상담 기능',
    badge: '준비 중',
    hot: false,
  },
  {
    id: 'premium',
    label: '프리미엄 플랜',
    desc: '출시 예정 — 채팅·리포트·예언 무제한',
    badge: '준비 중',
    hot: false,
  },
];

export default function SettingsPage({
  form,
  setForm,
  user,
  saveProfileToSupabase,
  showToast,
  responseStyle: responseStyleProp = 'M',
  onStyleChange,
  sidebarPrefs,
  onSidebarPrefsChange,
  lifeStage: lifeStageProp = 'free',
  onLifeStageChange,
  fontSize: fontSizeProp = 'standard',
  onFontSizeChange,
}) {
  const [tab, setTab] = useState(0); // 0: 개인정보, 1: 요금제, 2: 환경설정, 3: 메뉴설정
  const [localForm, setLocalForm] = useState(form || {});
  const [saving, setSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handlePushToggle = async (e) => {
    e.stopPropagation();
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      showToast?.('이 브라우저/기기는 푸시 알림을 지원하지 않아요', 'error');
      return;
    }

    if (pushEnabled) {
      showToast?.('이미 푸시 알림이 켜져 있어요. 끄려면 브라우저/OS 설정에서 해제해주세요.', 'info');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast?.('설정에서 푸시 알림 권한을 허용해주세요.', 'error');
        return;
      }

      // 1) Service Worker Ready
      const swReg = await navigator.serviceWorker.ready;
      
      // 2) Get existing or create new subscription
      let sub = await swReg.pushManager.getSubscription();
      if (!sub) {
        const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) {
          showToast?.('서버 설정(VAPID Key)이 누락되어 알림을 켤 수 없어요', 'error');
          return;
        }
        sub = await swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
      }

      // 3) Send to Supabase
      const kakaoId = user?.kakaoId || user?.id;
      if (kakaoId) {
        const subJson = sub.toJSON();
        const client = getAuthenticatedClient(kakaoId);
        
        const { error } = await client.from('push_subscriptions').upsert({
          kakao_id: String(kakaoId),
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth
        }, { onConflict: 'endpoint' });

        if (error) {
          console.error("Push save error:", error);
          showToast?.('알림 정보를 서버에 저장하는데 실패했어요', 'error');
          return;
        }
      }

      setPushEnabled(true);
      showToast?.('배드타임 및 운세 알림을 켰어요 ✦', 'success');
      
    } catch (err) {
      console.error(err);
      showToast?.('알림 설정 중 오류가 발생했어요', 'error');
    }
  };

  const lifeStage = lifeStageProp || 'free';
  const fontSize = fontSizeProp || 'standard';

  // form prop이 지연 전달될 때 localForm 동기화
  useEffect(() => {
    if (form) setLocalForm(form);
  }, [form]);

  // T/F 스타일: props 기반 (Supabase에 저장됨), null 방어
  const responseStyle = responseStyleProp || 'M';

  const handleStyleChange = useCallback((val) => {
    onStyleChange?.(val);
    showToast?.('스타일이 저장됐어요 ✦', 'success');
  }, [onStyleChange, showToast]);

  const handleSaveProfile = useCallback(async () => {
    if (!localForm.by || !localForm.bm || !localForm.bd) {
      showToast?.('생년월일을 모두 입력해줘요', 'error');
      return;
    }
    setSaving(true);
    try {
      setForm(localForm);
      if (user) await saveProfileToSupabase(localForm, user);
      showToast?.('개인정보가 저장됐어요 ✦', 'success');
    } catch {
      showToast?.('저장에 실패했어요. 다시 시도해봐요', 'error');
    } finally {
      setSaving(false);
    }
  }, [localForm, setForm, user, saveProfileToSupabase, showToast]);

  return (
    <div className="page step-fade" style={{ paddingTop: 56 }}>
      <div className="inner" style={{ paddingTop: 16, paddingBottom: 60 }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.1em', marginBottom: 4 }}>✦ 설정</div>
        <div style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)', marginBottom: 20 }}>나의 별숨 설정</div>

        {/* ── 탭 ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: 4 }}>
          {['개인정보', '요금제', '환경설정', '메뉴 팝업'].map((label, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: 8,
                border: 'none',
                fontFamily: 'var(--ff)',
                fontSize: 'var(--xs)',
                fontWeight: tab === i ? 700 : 400,
                cursor: 'pointer',
                transition: 'all .2s',
                background: tab === i ? 'var(--bg1)' : 'transparent',
                color: tab === i ? 'var(--gold)' : 'var(--t3)',
                boxShadow: tab === i ? '0 1px 4px rgba(0,0,0,.15)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab 0: 개인정보 수정 ── */}
        {tab === 0 && (
          <div className="card" style={{ gap: 'var(--sp2)' }}>
            <div className="card-title">개인정보 수정</div>
            <div className="card-sub">저장된 생년월일, 이름, 성별을 수정할 수 있어요</div>

            <label className="lbl" htmlFor="set-name">이름 (선택)</label>
            <input
              id="set-name"
              className="inp"
              placeholder="뭐라고 불러드릴까요?"
              value={localForm.name || ''}
              onChange={e => setLocalForm(f => ({ ...f, name: e.target.value }))}
            />

            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend className="lbl">생년월일</legend>
              <div className="row" style={{ marginBottom: 'var(--sp2)' }}>
                <div className="col">
                  <input
                    className="inp"
                    placeholder="1998"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-label="출생 연도"
                    value={localForm.by || ''}
                    onChange={e => setLocalForm(f => ({ ...f, by: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    style={{ marginBottom: 0 }}
                  />
                </div>
                <div className="col">
                  <select
                    className="inp"
                    aria-label="출생 월"
                    value={localForm.bm || ''}
                    onChange={e => { const nm = e.target.value; const max = getDaysInMonth(localForm.by, nm); setLocalForm(f => ({ ...f, bm: nm, bd: f.bd && parseInt(f.bd) > max ? '' : f.bd })); }}
                    style={{ marginBottom: 0 }}
                  >
                    <option value="">월</option>
                    {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}월</option>)}
                  </select>
                </div>
                <div className="col">
                  <select
                    className="inp"
                    aria-label="출생 일"
                    value={localForm.bd || ''}
                    onChange={e => setLocalForm(f => ({ ...f, bd: e.target.value }))}
                    style={{ marginBottom: 0 }}
                  >
                    <option value="">일</option>
                    {[...Array(getDaysInMonth(localForm.by, localForm.bm))].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}일</option>)}
                  </select>
                </div>
              </div>
            </fieldset>

            <div
              className="toggle-row"
              onClick={() => setLocalForm(f => ({ ...f, noTime: !f.noTime, bh: '' }))}
            >
              <button
                className={`toggle ${localForm.noTime ? 'on' : 'off'}`}
                role="switch"
                aria-checked={localForm.noTime}
                aria-label="태어난 시간 모름"
                onClick={e => { e.stopPropagation(); setLocalForm(f => ({ ...f, noTime: !f.noTime, bh: '' })); }}
              />
              <span className="toggle-label">태어난 시간을 몰라요</span>
            </div>

            {!localForm.noTime && (
              <>
                <label className="lbl" htmlFor="set-bh">태어난 시각</label>
                <select
                  id="set-bh"
                  className="inp"
                  value={localForm.bh || ''}
                  onChange={e => setLocalForm(f => ({ ...f, bh: e.target.value }))}
                >
                  <option value="">시각 선택</option>
                  {Array.from({ length: 144 }, (_, i) => {
                    const h = Math.floor(i / 6);
                    const m = (i % 6) * 10;
                    const val = (h + m / 60).toFixed(4);
                    return (
                      <option key={i} value={val}>
                        {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}
                      </option>
                    );
                  })}
                </select>
              </>
            )}

            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend className="lbl">성별</legend>
              <div className="gender-group" role="group" aria-label="성별 선택">
                {['여성', '남성', '기타'].map(g => (
                  <button
                    key={g}
                    className={`gbtn ${localForm.gender === g ? 'on' : ''}`}
                    aria-pressed={localForm.gender === g}
                    onClick={() => setLocalForm(f => ({ ...f, gender: g }))}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </fieldset>

            <button
              className="btn-main"
              style={{ marginTop: 'var(--sp2)' }}
              disabled={saving || !localForm.by || !localForm.bm || !localForm.bd}
              onClick={handleSaveProfile}
            >
              {saving ? '저장 중...' : '저장하기 ✦'}
            </button>
          </div>
        )}

        {/* ── Tab 1: 나의 요금제 ── */}
        {tab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r2)', padding: 'var(--sp3)' }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 4 }}>현재 이용 중</div>
              <div style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>베타 무료 플랜</div>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.7 }}>
                베타 기간 중 모든 기능을 무료로 이용하실 수 있어요.<br />
                정식 출시 이후 요금제 정보가 업데이트될 예정이에요.
              </div>
              <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 'var(--r1)', fontSize: 'var(--xs)', color: 'var(--gold)', lineHeight: 1.7 }}>
                ✦ 현재 사용 가능한 기능<br />
                <span style={{ color: 'var(--t2)' }}>
                  별숨에게 질문하기 · 월간 리포트 · 별숨과 대화하기 · 예언 · 궁합 · 달력 · 모임 별숨 · 나의 별숨 · 종합사주 · 종합점성술 · 일기
                </span>
              </div>
            </div>

            {PLANS.filter(p => p.id !== 'beta').map(plan => (
              <div
                key={plan.id}
                style={{
                  background: 'var(--bg1)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--r2)',
                  padding: 'var(--sp3)',
                  opacity: 0.6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 'var(--md)', fontWeight: 600, color: 'var(--t2)' }}>{plan.label}</div>
                  <div style={{ fontSize: 'var(--xs)', padding: '3px 10px', borderRadius: 20, border: '1px solid var(--line)', color: 'var(--t4)' }}>{plan.badge}</div>
                </div>
                <div style={{ fontSize: 'var(--sm)', color: 'var(--t4)', lineHeight: 1.6 }}>{plan.desc}</div>
              </div>
            ))}

            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', textAlign: 'center', lineHeight: 1.7, marginTop: 4 }}>
              정식 출시 시 이메일 또는 카카오 채널로 안내드릴게요.
            </div>
          </div>
        )}

        {/* ── Tab 2: 별숨 스타일 (T형/F형) ── */}
        {tab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 'var(--sp3)' }}>
              <div className="card-title">별숨 스타일 설정</div>
              <div className="card-sub" style={{ marginBottom: 20 }}>
                별숨이 답변하는 방식을 조정할 수 있어요.<br />
                분석형은 논리적·구체적으로, 공감형은 감성적·위로 중심으로 이야기해줘요.
              </div>

              {/* ── 가로 슬라이더 바 ── */}
              <div style={{ position: 'relative', marginBottom: 24 }}>
                {/* 배경 바 */}
                <div style={{
                  display: 'flex',
                  borderRadius: 40,
                  overflow: 'hidden',
                  border: '1px solid var(--line)',
                  background: 'var(--bg2)',
                  position: 'relative',
                }}>
                  {STYLE_OPTIONS.map((opt, i) => (
                    <button
                      key={opt.value}
                      onClick={() => handleStyleChange(opt.value)}
                      aria-pressed={responseStyle === opt.value}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
                        border: 'none',
                        fontFamily: 'var(--ff)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all .25s ease',
                        background: responseStyle === opt.value
                          ? 'linear-gradient(135deg, var(--goldf), rgba(155,142,196,.12))'
                          : 'transparent',
                        borderLeft: i > 0 ? '1px solid var(--line)' : 'none',
                        position: 'relative',
                      }}
                    >
                      {responseStyle === opt.value && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: '20%',
                          right: '20%',
                          height: 2,
                          background: 'var(--gold)',
                          borderRadius: 1,
                        }} />
                      )}
                      <span style={{ fontSize: '11px', fontWeight: 800, color: responseStyle === opt.value ? 'var(--gold)' : 'var(--t4)', letterSpacing: '.04em' }}>{opt.sub}</span>
                      <span style={{
                        fontSize: 'var(--xs)',
                        fontWeight: responseStyle === opt.value ? 700 : 400,
                        color: responseStyle === opt.value ? 'var(--gold)' : 'var(--t3)',
                        letterSpacing: '.02em',
                      }}>
                        {opt.label}
                      </span>
                      <span style={{
                        fontSize: '0.6rem',
                        color: responseStyle === opt.value ? 'var(--gold)' : 'var(--t4)',
                        opacity: 0.8,
                      }}>
                        {opt.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 현재 선택된 스타일 설명 */}
              {(() => {
                const cur = STYLE_OPTIONS.find(s => s.value === responseStyle);
                const styleDescriptions = {
                  T: [
                    '사주와 별자리 데이터를 바탕으로 논리적이고 체계적인 분석을 해드려요.',
                    '감정보다는 구체적인 상황과 행동 방안에 집중해서 이야기해줘요.',
                    '사실 기반의 명확한 인사이트를 선호하는 분께 추천해요.',
                  ],
                  M: [
                    '논리적 분석과 따뜻한 공감을 균형 있게 담아 이야기해드려요.',
                    '상황 파악과 감정 위로, 두 가지를 함께 전해드려요.',
                    '대부분의 상황에서 편안하게 받아들일 수 있는 스타일이에요.',
                  ],
                  F: [
                    '감정에 깊이 공감하며 따뜻한 위로와 응원을 전해드려요.',
                    '논리보다는 지금 이 순간의 감정과 마음에 초점을 맞춰줘요.',
                    '힘든 날 위로가 필요할 때, 감성적인 답변을 선호하는 분께 추천해요.',
                  ],
                };
                return (
                  <div style={{
                    padding: '14px 16px',
                    background: 'var(--bg2)',
                    borderRadius: 'var(--r1)',
                    border: '1px solid var(--acc)',
                  }}>
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 8 }}>
                      ✦ 현재: {cur?.label} ({cur?.sub})
                    </div>
                    {(styleDescriptions[responseStyle] || []).map((line, i) => (
                      <div key={i} style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.7, marginBottom: i < 2 ? 4 : 0 }}>
                        {i === 0 ? line : <span style={{ color: 'var(--t3)', fontSize: 'var(--xs)' }}>{line}</span>}
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div style={{ marginTop: 16, fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.7, textAlign: 'center' }}>
                스타일은 언제든지 변경할 수 있어요<br />
                변경 즉시 다음 답변부터 적용돼요.
              </div>
            </div>

            {/* 스타일별 예시 */}
            <div style={{ padding: 'var(--sp3)', background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: 'var(--r2)' }}>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', fontWeight: 600, marginBottom: 12, letterSpacing: '.04em' }}>
                스타일별 답변 예시 (같은 질문: "요즘 연애가 잘 안 풀려요")
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { val: 'T', text: '지금 당신의 일간 기질이 논리를 앞세우는 경향이 있어, 감정 표현보다 판단이 먼저 나올 수 있어요. 상대방의 감정 언어를 확인하는 대화를 먼저 시도해봐요.' },
                  { val: 'M', text: '마음이 쓰이는 거 느껴져요. 지금 당신의 별은 연결을 원하는데, 방식이 맞지 않아 엇갈리고 있는 것 같아요. 오늘 먼저 솔직하게 이야기 꺼내봐요.' },
                  { val: 'F', text: '지금 많이 지치셨겠어요. 잘 풀리지 않는 연애 앞에서 스스로를 탓하지 말아요. 별은 지금 당신에게 잠깐 쉬어가도 된다고 속삭이고 있어요.' },
                ].map(ex => (
                  <div
                    key={ex.val}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--r1)',
                      border: `1px solid ${responseStyle === ex.val ? 'var(--acc)' : 'var(--line)'}`,
                      background: responseStyle === ex.val ? 'var(--goldf)' : 'var(--bg2)',
                      opacity: responseStyle === ex.val ? 1 : 0.55,
                      transition: 'all .2s',
                    }}
                  >
                    <div style={{ fontSize: 'var(--xs)', color: responseStyle === ex.val ? 'var(--gold)' : 'var(--t4)', fontWeight: 600, marginBottom: 5 }}>
                      {STYLE_OPTIONS.find(s => s.value === ex.val)?.label}
                      {responseStyle === ex.val && ' (현재 선택)'}
                    </div>
                    <div style={{ fontSize: 'var(--xs)', color: 'var(--t2)', lineHeight: 1.7 }}>{ex.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2 추가 섹션: 현재 나의 상황 (생애 단계) ── */}
        {tab === 2 && (
          <div className="card" style={{ gap: 'var(--sp2)', marginTop: 0 }}>
            <div className="card-title">현재 나의 상황</div>
            <div className="card-sub" style={{ marginBottom: 12 }}>
              지금 내 상황을 알려주면 별숨이 더 맞춤 언어로 이야기해줘요.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {LIFE_STAGE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onLifeStageChange?.(opt.value);
                    showToast?.('상황이 저장됐어요 ✦', 'success');
                  }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 20,
                    border: `1px solid ${lifeStage === opt.value ? 'var(--acc)' : 'var(--line)'}`,
                    background: lifeStage === opt.value ? 'var(--goldf)' : 'var(--bg2)',
                    color: lifeStage === opt.value ? 'var(--gold)' : 'var(--t3)',
                    fontSize: 'var(--xs)',
                    fontWeight: lifeStage === opt.value ? 700 : 400,
                    fontFamily: 'var(--ff)',
                    cursor: 'pointer',
                    transition: 'all .2s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab 2 추가 섹션: 큰 글씨 모드 ── */}
        {tab === 2 && (
          <div className="card" style={{ gap: 'var(--sp2)', marginTop: 0 }}>
            <div className="card-title">큰 글씨 모드</div>
            <div className="card-sub" style={{ marginBottom: 8 }}>
              글씨가 조금 더 크게 보이도록 설정할 수 있어요.
            </div>
            <div
              className="toggle-row"
              onClick={() => {
                const next = fontSize === 'large' ? 'standard' : 'large';
                onFontSizeChange?.(next);
                showToast?.(next === 'large' ? '큰 글씨 모드로 바꿨어요 ✦' : '기본 글씨 크기로 돌아왔어요', 'success');
              }}
            >
              <button
                className={`toggle ${fontSize === 'large' ? 'on' : 'off'}`}
                role="switch"
                aria-checked={fontSize === 'large'}
                aria-label="큰 글씨 모드"
                onClick={e => {
                  e.stopPropagation();
                  const next = fontSize === 'large' ? 'standard' : 'large';
                  onFontSizeChange?.(next);
                  showToast?.(next === 'large' ? '큰 글씨 모드로 바꿨어요 ✦' : '기본 글씨 크기로 돌아왔어요', 'success');
                }}
              />
              <span className="toggle-label">큰 글씨 모드 {fontSize === 'large' ? '(켜짐)' : '(꺼짐)'}</span>
            </div>
          </div>
        )}

        {/* ── Tab 2 추가 섹션: 푸시 알림 설정 ── */}
        {tab === 2 && (
          <div className="card" style={{ gap: 'var(--sp2)', marginTop: 0 }}>
            <div className="card-title">별숨 푸시 알림</div>
            <div className="card-sub" style={{ marginBottom: 8 }}>
              △ 배드타임 진입, 행운의 시간대 도달 시 알림을 받아보세요.
            </div>
            <div className="toggle-row" onClick={handlePushToggle}>
              <button
                className={`toggle ${pushEnabled ? 'on' : 'off'}`}
                role="switch"
                aria-checked={pushEnabled}
                aria-label="푸시 알림 켜기"
                onClick={handlePushToggle}
              />
              <span className="toggle-label">
                기기 알림 허용 {pushEnabled ? '(켜짐)' : '(꺼짐)'}
              </span>
            </div>
          </div>
        )}

        {/* ── Tab 3: 메뉴 설정 ── */}
        {tab === 3 && (
          <div className="card" style={{ gap: 'var(--sp2)' }}>
            <div className="card-title">메뉴 설정</div>
            <div className="card-sub" style={{ marginBottom: 16 }}>
              사이드바에서 보이지 않을 메뉴 그룹을 선택하세요.<br />
              설정은 자동으로 저장돼요.
            </div>
            {[
              { key: 'today', label: '오늘의 별숨', desc: '홈, 오늘 운세, 일기, 달력' },
              { key: 'consult', label: '별숨 상담', desc: '물어보기, 리포트, 예언, 종합사주 등' },
              { key: 'myinfo', label: '나의 별숨', desc: '대운 흐름, 별숨 통계, 별숨 광장' },
              { key: 'fortune', label: '운세 & 인연', desc: '궁합, 모임, 기념일, 사주원국' },
              { key: 'special', label: '✦ 특별 기능', desc: '꿈 해몽, 택일, 이름 풀이' },
            ].map(({ key, label, desc }) => {
              const hidden = (sidebarPrefs?.hiddenGroups || []).includes(key);
              const toggle = () => {
                const prev = sidebarPrefs?.hiddenGroups || [];
                const next = hidden ? prev.filter(k => k !== key) : [...prev, key];
                onSidebarPrefsChange?.({ ...(sidebarPrefs || {}), hiddenGroups: next });
                showToast?.(hidden ? `'${label}' 메뉴를 표시해요 ✦` : `'${label}' 메뉴를 숨겼어요`, 'success');
              };
              return (
                <div key={key} className="toggle-row" onClick={toggle} style={{ cursor: 'pointer', marginBottom: 8 }}>
                  <button
                    className={`toggle ${hidden ? 'off' : 'on'}`}
                    role="switch"
                    aria-checked={!hidden}
                    aria-label={`${label} 메뉴 표시`}
                    onClick={e => { e.stopPropagation(); toggle(); }}
                  />
                  <div style={{ flex: 1 }}>
                    <span className="toggle-label" style={{ display: 'block', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 'var(--xs)', color: 'var(--t4)' }}>{desc}</span>
                  </div>
                  <span style={{ fontSize: 'var(--xs)', color: hidden ? 'var(--t4)' : 'var(--gold)', marginLeft: 8 }}>{hidden ? '숨김' : '표시'}</span>
                </div>
              );
            })}
            <div style={{ marginTop: 8, fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.7 }}>
              메뉴를 숨겨도 직접 URL 이동은 가능해요
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

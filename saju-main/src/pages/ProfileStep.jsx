import { OC, OE, ON } from "../utils/saju.js";
import { getSun } from "../utils/astrology.js";

function getDaysInMonth(year, month) {
  if (!month) return 31;
  if (!year || String(year).length < 4) return 31;
  return new Date(parseInt(year), parseInt(month), 0).getDate();
}

export default function ProfileStep({
  form, setForm,
  user, saju, sun, moon, asc,
  formOk, editingMyProfile, setEditingMyProfile,
  fieldTouched, setFieldTouched,
  otherProfiles, setOtherProfiles,
  activeProfileIdx, setActiveProfileIdx,
  onboardingDone,
  startEditOtherProfile,
  setSelQs, setStep, setShowOtherProfileModal,
  saveProfileToSupabase,
  showToast,
}) {
  return (
    <div className="page step-fade">
      <div className="inner">
        <div className="step-dots">
          {[0, 1, 2].map(i => <div key={i} className={`dot ${i === 0 ? 'active' : 'todo'}`} />)}
        </div>

        {formOk && (
          <div className="card" style={{ marginBottom: 'var(--sp2)' }}>
            <div className="card-title" style={{ fontSize: 'var(--md)' }}>누구의 별숨을 볼까요?</div>

            <div
              className={`profile-pick-card ${activeProfileIdx === 0 ? 'active' : ''}`}
              onClick={() => setActiveProfileIdx(0)}
              style={{
                background: activeProfileIdx === 0 ? 'var(--bg-glass-heavy)' : 'var(--bg-glass)',
                border: activeProfileIdx === 0 ? '1px solid var(--gold)' : '0.5px solid var(--line)',
                backdropFilter: 'blur(10px)',
                borderRadius: 'var(--r2)',
                padding: 'var(--sp2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
                transition: 'var(--trans)',
                cursor: 'pointer',
                boxShadow: activeProfileIdx === 0 ? 'var(--shadow)' : 'none'
              }}
            >
              <div className="ppc-left" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp2)' }}>
                <div className="ppc-av" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid var(--line)' }}>
                  {user?.profileImage ? <img src={user.profileImage} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '🌙'}
                </div>
                <div>
                  <div className="ppc-name" style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)' }}>
                    {form.name || user?.nickname || '나'}
                    {saju?.ilganPoetic && <span style={{ marginLeft: 6, fontSize: 'var(--xxs)', color: 'var(--gold)', fontWeight: 400 }}>{saju.ilganPoetic}</span>}
                  </div>
                  <div className="ppc-sub" style={{ fontSize: 'var(--xxs)', color: 'var(--t4)', marginTop: 2, letterSpacing: '-0.01em' }}>
                    {form.by && sun
                      ? saju?.ilganEl && saju.ilganEl !== saju.dom
                        ? `${sun.s} ${sun.n} · 원래 ${ON[saju.ilganEl]}, ${ON[saju.dom]} 기운 강`
                        : `${sun.s} ${sun.n} · ${ON[saju?.dom || '금']} 기운`
                      : '정보를 입력해줘요'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {activeProfileIdx === 0 && <span style={{ color: 'var(--gold)', fontSize: 'var(--xs)' }}>✦</span>}
                <button
                  style={{
                    background: 'var(--bg2)',
                    border: '0.5px solid var(--line)',
                    borderRadius: 50,
                    padding: '4px 10px',
                    color: 'var(--t3)',
                    fontSize: '10px',
                    fontFamily: 'var(--ff)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  onClick={e => { e.stopPropagation(); setEditingMyProfile(p => !p); }}
                >
                  수정
                </button>
              </div>
            </div>

            {otherProfiles.map((p, i) => {
              const pSun = p.bm && p.bd ? getSun(+p.bm, +p.bd) : null;
              return (
                <div
                  key={i}
                  className={`profile-pick-card ${activeProfileIdx === i + 1 ? 'active' : ''}`}
                  onClick={() => setActiveProfileIdx(i + 1)}
                  style={{
                    background: activeProfileIdx === i + 1 ? 'var(--bg-glass-heavy)' : 'var(--bg-glass)',
                    border: activeProfileIdx === i + 1 ? '1px solid var(--gold)' : '0.5px solid var(--line)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 'var(--r2)',
                    padding: 'var(--sp2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    transition: 'var(--trans)',
                    cursor: 'pointer',
                    boxShadow: activeProfileIdx === i + 1 ? 'var(--shadow)' : 'none'
                  }}
                >
                  <div className="ppc-left" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp2)' }}>
                    <div className="ppc-av" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid var(--line)', color: 'var(--gold)', fontSize: 'var(--xs)' }}>✦</div>
                    <div>
                      <div className="ppc-name" style={{ fontSize: 'var(--sm)', fontWeight: 700, color: 'var(--t1)' }}>{p.name || '이름 없이 저장됨'}</div>
                      <div className="ppc-sub" style={{ fontSize: 'var(--xxs)', color: 'var(--t4)', marginTop: 2, letterSpacing: '-0.01em' }}>{pSun ? `${pSun.s} ${pSun.n}` : '별자리 계산 가능해요'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {activeProfileIdx === i + 1 && <span style={{ color: 'var(--gold)', fontSize: 'var(--xs)' }}>✦</span>}
                    <button
                      style={{
                        background: 'var(--bg2)',
                        border: '0.5px solid var(--line)',
                        borderRadius: 50,
                        padding: '4px 10px',
                        color: 'var(--t3)',
                        fontSize: '10px',
                        fontFamily: 'var(--ff)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                      onClick={e => { e.stopPropagation(); startEditOtherProfile(i); }}
                    >
                      수정
                    </button>
                    <button
                      style={{
                        background: 'var(--bg2)',
                        border: '0.5px solid var(--line)',
                        borderRadius: 50,
                        padding: '4px 10px',
                        color: 'var(--rose)',
                        fontSize: '10px',
                        fontFamily: 'var(--ff)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        opacity: 0.8
                      }}
                      onClick={e => { e.stopPropagation(); setOtherProfiles(prev => prev.filter((_, j) => j !== i)); if (activeProfileIdx === i + 1) setActiveProfileIdx(0); }}
                    >
                      X
                    </button>
                  </div>
                </div>
              );
            })}

            {otherProfiles.length < 3 && (
              <button className="res-btn" style={{ width: '100%', marginTop: 8, padding: 12 }} onClick={() => setShowOtherProfileModal(true)}>
                + 다른 사람의 별숨 추가 (최대 3명)
              </button>
            )}

            <button className="btn-main" style={{ marginTop: 'var(--sp3)' }} onClick={() => { setSelQs([]); setStep(2); }}>
              {activeProfileIdx === 0 ? `${form.name || '나'}의 별숨 보기 ✦` : `${otherProfiles[activeProfileIdx - 1]?.name || '이 사람'}의 별숨 보기 ✦`}
            </button>
          </div>
        )}

        {(!formOk || editingMyProfile) && (
          <div className="card">
            <div className="card-title">{editingMyProfile ? '내 프로필 수정 🌙' : '반가워요 🌙'}</div>
            <div className="card-sub">생년월일만 있으면 사주와 별자리를 함께 읽어드릴게요</div>

            <label className="lbl" htmlFor="inp-name">이름 (선택)</label>
            <input id="inp-name" className="inp" placeholder="뭐라고 불러드릴까요?" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />

            <fieldset style={{border:'none',padding:0,margin:0}}>
              <legend className="lbl">생년월일</legend>
              <div className="row" style={{ marginBottom: 'var(--sp3)' }}>
                <div className="col">
                  <input id="inp-by" className="inp" placeholder="1998" inputMode="numeric" pattern="[0-9]*" aria-label="출생 연도" value={form.by} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setForm(f => ({ ...f, by: v })); const yr = parseInt(v); if (v.length === 4 && yr >= 1800 && yr <= 2040) setFieldTouched(t => ({ ...t, by: true })); else if (v.length === 4) setFieldTouched(t => ({ ...t, by: false })); }} style={{ marginBottom: 0 }} />
                  {form.by?.length === 4 && (parseInt(form.by) < 1800 || parseInt(form.by) > 2040) && (
                    <div style={{ fontSize: 'var(--xs)', color: '#e06', marginTop: 4 }}>1800~2040년 사이의 연도를 입력해주세요</div>
                  )}
                </div>
                <div className="col"><select id="inp-bm" className="inp" aria-label="출생 월" value={form.bm} onChange={e => { const nm = e.target.value; const max = getDaysInMonth(form.by, nm); setForm(f => ({ ...f, bm: nm, bd: f.bd && parseInt(f.bd) > max ? '' : f.bd })); }} onBlur={e => { if (e.target.value) setFieldTouched(t => ({ ...t, bm: true })); }} style={{ marginBottom: 0 }}><option value="">월</option>{[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}월</option>)}</select></div>
                <div className="col"><select id="inp-bd" className="inp" aria-label="출생 일" value={form.bd} onChange={e => setForm(f => ({ ...f, bd: e.target.value }))} onBlur={e => { if (e.target.value) setFieldTouched(t => ({ ...t, bd: true })); }} style={{ marginBottom: 0 }}><option value="">일</option>{[...Array(getDaysInMonth(form.by, form.bm))].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}일</option>)}</select></div>
              </div>
            </fieldset>

            <div className="toggle-row" onClick={() => setForm(f => ({ ...f, noTime: !f.noTime, bh: '' }))}>
              <button className={`toggle ${form.noTime ? 'on' : 'off'}`} role="switch" aria-checked={form.noTime} aria-label="태어난 시간 모름" onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, noTime: !f.noTime, bh: '' })); }} />
              <span className="toggle-label">태어난 시간을 몰라요</span>
            </div>
            {!form.noTime && (
              <>
                <label className="lbl" htmlFor="inp-bh">태어난 시각</label>
                <select id="inp-bh" className="inp" value={form.bh} onChange={e => setForm(f => ({ ...f, bh: e.target.value }))}>
                  <option value="">시각 선택</option>
                  {Array.from({ length: 144 }, (_, i) => { const h = Math.floor(i / 6); const m = (i % 6) * 10; const val = (h + m / 60).toFixed(4); return <option key={i} value={val}>{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}</option>; })}
                </select>
              </>
            )}
            <fieldset style={{border:'none',padding:0,margin:0}}>
              <legend className="lbl">성별</legend>
              <div className="gender-group" role="group" aria-label="성별 선택" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {['여성', '남성', '기타'].map(g => (
                  <button
                    key={g}
                    className={`gbtn ${form.gender === g ? 'on' : ''}`}
                    aria-pressed={form.gender === g}
                    onClick={() => setForm(f => ({ ...f, gender: g }))}
                    style={{
                      padding: '10px',
                      fontSize: 'var(--xxs)',
                      fontWeight: form.gender === g ? 700 : 400,
                      backgroundColor: form.gender === g ? 'var(--goldf)' : 'var(--bg-glass)',
                      border: form.gender === g ? '1px solid var(--gold)' : '0.5px solid var(--line)',
                      borderRadius: 'var(--r1)',
                      color: form.gender === g ? 'var(--gold)' : 'var(--t3)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </fieldset>

            {saju && (
              <div className="pillars-wrap">
                <div className="pillars-hint"><span style={{ color: 'var(--gold)' }}>✦</span> 사주 원국</div>
                <div className="pillars">
                  {[['연', 'yeon'], ['월', 'wol'], ['일', 'il'], ['시', 'si']].map(([l, k]) => (
                    <div key={l} className="pillar">
                      <div className="p-lbl">{l}주</div>
                      <div className="p-hj">{saju[k].gh}</div>
                      <div className="p-hj">{saju[k].jh}</div>
                      <div className="p-kr">{saju[k].g}{saju[k].j}</div>
                    </div>
                  ))}
                </div>
                <div className="oh-bar">
                  {Object.entries(saju.or).map(([k, v]) => v > 0 && <div key={k} className="oh-seg" style={{ flex: v, background: OC[k] }} />)}
                </div>
                <div className="oh-tags">
                  {Object.entries(saju.or).map(([k, v]) => v > 0 && (
                    <span key={k} className="oh-tag" style={{ background: `${OC[k]}18`, color: OC[k], border: `1px solid ${OC[k]}28` }}>{OE[k]} {ON[k]} {v}</span>
                  ))}
                </div>
                <div className="il-preview">{saju.ilganDesc}</div>
              </div>
            )}
            {sun && (
              <div className="astro-preview">
                <div className="a-chip">{sun.s} {sun.n}</div>
                {moon && <div className="a-chip">🌙 달 {moon.n}</div>}
                {asc && <div className="a-chip">↑ 상승 {asc.n}</div>}
              </div>
            )}
            <button className="btn-main"
              disabled={editingMyProfile ? !formOk : !(formOk && fieldTouched.by && fieldTouched.bm && fieldTouched.bd)}
              onClick={async () => {
                if (user) {
                  const ok = await saveProfileToSupabase(form, user);
                  if (ok === false) { showToast?.('저장에 실패했어요. 다시 시도해봐요 🌙', 'error'); return; }
                }
                if (editingMyProfile) { setEditingMyProfile(false); }
                else if (!onboardingDone) { setSelQs([]); setStep(15); }
                else { setSelQs([]); setStep(2); }
              }}>
              {editingMyProfile ? '저장하기 ✦' : '다음 단계 →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

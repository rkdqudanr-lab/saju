export default function OtherProfileModal({
  editingOtherIdx, setEditingOtherIdx,
  otherForm, setOtherForm,
  saveOtherProfile,
  onClose,
}) {
  return (
    <div className="other-modal-bg" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="other-modal" onClick={e => e.stopPropagation()}>
        <div className="other-modal-title">{editingOtherIdx !== null ? '다른 사람 정보 수정' : '다른 사람의 별숨 추가'}</div>
        <div className="other-modal-sub">{editingOtherIdx !== null ? '저장된 정보를 수정해요' : '가족, 친구, 연인의 생년월일을 입력하면\n그 사람의 별숨을 대신 물어볼 수 있어요'}</div>

        <label className="lbl" htmlFor="other-name">이름</label>
        <input id="other-name" className="inp" placeholder="누구의 별숨인가요?" value={otherForm.name} onChange={e => setOtherForm(f => ({ ...f, name: e.target.value }))} />

        <fieldset style={{border:'none',padding:0,margin:0}}>
          <legend className="lbl">생년월일</legend>
          <div className="row" style={{ marginBottom: 'var(--sp2)' }}>
            <div className="col"><input className="inp" placeholder="1998" inputMode="numeric" aria-label="출생 연도" value={otherForm.by} onChange={e => setOtherForm(f => ({ ...f, by: e.target.value.replace(/\D/, '').slice(0, 4) }))} style={{ marginBottom: 0 }} /></div>
            <div className="col"><select className="inp" aria-label="출생 월" value={otherForm.bm} onChange={e => setOtherForm(f => ({ ...f, bm: e.target.value }))} style={{ marginBottom: 0 }}><option value="">월</option>{[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}월</option>)}</select></div>
            <div className="col"><select className="inp" aria-label="출생 일" value={otherForm.bd} onChange={e => setOtherForm(f => ({ ...f, bd: e.target.value }))} style={{ marginBottom: 0 }}><option value="">일</option>{[...Array(31)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}일</option>)}</select></div>
          </div>
        </fieldset>
        <div className="toggle-row" onClick={() => setOtherForm(f => ({ ...f, noTime: !f.noTime, bh: '' }))}>
          <button className={`toggle ${otherForm.noTime ? 'on' : 'off'}`} role="switch" aria-checked={otherForm.noTime} aria-label="태어난 시간 모름" onClick={e => { e.stopPropagation(); setOtherForm(f => ({ ...f, noTime: !f.noTime, bh: '' })); }} />
          <span className="toggle-label">태어난 시간을 몰라요</span>
        </div>
        {!otherForm.noTime && (
          <select className="inp" aria-label="태어난 시각" value={otherForm.bh} onChange={e => setOtherForm(f => ({ ...f, bh: e.target.value }))}>
            <option value="">태어난 시각 (선택)</option>
            {Array.from({ length: 144 }, (_, i) => { const h = Math.floor(i / 6); const m = (i % 6) * 10; const val = (h + m / 60).toFixed(4); return <option key={i} value={val}>{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}</option>; })}
          </select>
        )}
        <fieldset style={{border:'none',padding:0,margin:0}}>
          <legend className="lbl">성별</legend>
          <div className="gender-group" role="group" aria-label="성별 선택">
            {['여성', '남성', '기타'].map(g => (
              <button key={g} className={`gbtn ${otherForm.gender === g ? 'on' : ''}`} aria-pressed={otherForm.gender === g} onClick={() => setOtherForm(f => ({ ...f, gender: g }))}>{g}</button>
            ))}
          </div>
        </fieldset>
        <button className="btn-main"
          disabled={!otherForm.by || !otherForm.bm || !otherForm.bd || !otherForm.gender}
          onClick={saveOtherProfile}>
          {editingOtherIdx !== null ? '수정하기 ✦' : '추가하기 ✦'}
        </button>
        <button style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer', marginTop: 6 }}
          onClick={() => { onClose(); setEditingOtherIdx(null); }}>취소</button>
      </div>
    </div>
  );
}

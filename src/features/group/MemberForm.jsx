import { useState } from 'react';
import { getDaysInMonth, isValidBirthDate, BIRTH_HOURS } from './groupUtils.js';

const EMPTY_FORM = { name: '', by: '', bm: '', bd: '', bh: '', gender: '' };

export default function MemberForm({ onSubmit, title }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [dateError, setDateError] = useState('');
  const upd = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setDateError(''); };
  const trimmedName = form.name.trim();
  const ok = trimmedName && form.by && form.bm && form.bd && form.gender;

  const handleSubmit = () => {
    if (!isValidBirthDate(form.by, form.bm, form.bd)) {
      setDateError('유효하지 않은 날짜예요. 다시 확인해봐요.');
      return;
    }
    onSubmit({ ...form, name: trimmedName });
    setForm(EMPTY_FORM);
    setDateError('');
  };

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 16 }}>{title}</div>
      <input className="inp" placeholder="이름" value={form.name} onChange={(e) => upd('name', e.target.value)} />
      <div className="row" style={{ gap: 6, marginBottom: 'var(--sp2)' }}>
        <input
          className="inp"
          placeholder="출생년도"
          inputMode="numeric"
          value={form.by}
          onChange={(e) => upd('by', e.target.value.replace(/\D/g, '').slice(0, 4))}
          style={{ marginBottom: 0 }}
        />
        <select
          className="inp"
          value={form.bm}
          onChange={(e) => {
            const nm = e.target.value;
            const max = getDaysInMonth(form.by, nm);
            setForm((p) => ({ ...p, bm: nm, bd: p.bd && parseInt(p.bd, 10) > max ? '' : p.bd }));
            setDateError('');
          }}
          style={{ marginBottom: 0 }}
        >
          <option value="">월</option>
          {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}월</option>)}
        </select>
        <select className="inp" value={form.bd} onChange={(e) => upd('bd', e.target.value)} style={{ marginBottom: 0 }}>
          <option value="">일</option>
          {[...Array(getDaysInMonth(form.by, form.bm))].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}일</option>)}
        </select>
      </div>
      {dateError && (
        <div style={{ fontSize: 'var(--xs)', color: 'var(--rose)', marginBottom: 8, animation: 'fadeUp .2s ease' }}>
          {dateError}
        </div>
      )}
      <div style={{ marginBottom: 'var(--sp2)' }}>
        <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginBottom: 6 }}>태어난 시간 (모르면 건너뛰어요)</div>
        <select className="inp" value={form.bh} onChange={(e) => upd('bh', e.target.value)} style={{ marginBottom: 0 }}>
          <option value="">모름</option>
          {BIRTH_HOURS.map((h, i) => <option key={i} value={i * 2}>{h}</option>)}
        </select>
      </div>
      <div className="gender-group" style={{ marginBottom: 'var(--sp2)' }}>
        {['여성', '남성', '기타'].map((g) => (
          <button key={g} className={`gbtn ${form.gender === g ? 'on' : ''}`} onClick={() => upd('gender', g)}>{g}</button>
        ))}
      </div>
      <button className="btn-main" disabled={!ok} onClick={handleSubmit}>
        모임에 참여하기 ✦
      </button>
    </div>
  );
}

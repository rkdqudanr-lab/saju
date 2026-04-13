const fs = require('fs');
const path = 'src/pages/LandingPage.jsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
    {
        old: `                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setEditingMyProfile(true); setStep(1); }} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 50, padding: '4px 10px', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>수정</button>
                  <button onClick={kakaoLogout} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 50, padding: '4px 10px', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>로그아웃</button>
                </div>`,
        new: `                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setEditingMyProfile(true); setStep(1); }} className="res-btn" style={{ padding: '4px 10px', minWidth: 'auto', fontSize: 'var(--xs)' }}>수정</button>
                  <button onClick={kakaoLogout} className="res-btn" style={{ padding: '4px 10px', minWidth: 'auto', fontSize: 'var(--xs)' }}>로그아웃</button>
                </div>`
    },
    {
        old: `                          <button className=\"cta-main\" style={{ alignSelf: 'stretch', marginLeft: 'var(--sp2)', marginRight: 'var(--sp2)', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px', marginTop: 10, background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)' }} onClick={() => setStep(formOk ? 2 : 1)}>`,
        new: `                          <button className=\"cta-main\" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(formOk ? 2 : 1)}>`
    },
    {
        old: `                        <button className=\"cta-main\" style={{ alignSelf: 'stretch', marginLeft: 'var(--sp2)', marginRight: 'var(--sp2)', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px', marginTop: 10, background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)' }} onClick={() => setStep(formOk ? 2 : 1)}>`,
        new: `                        <button className=\"cta-main\" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(formOk ? 2 : 1)}>`
    },
    {
        old: `                      <div style={{ marginTop: 10, marginLeft: 'var(--sp2)', marginRight: 'var(--sp2)', background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '16px', border: '1px solid var(--line)' }}>`,
        new: `                      <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '16px', border: '1px solid var(--line)' }}>`
    }
];

replacements.forEach(r => {
    // Try both LF and CRLF
    content = content.split(r.old.replace(/\r\n/g, '\n')).join(r.new.replace(/\r\n/g, '\n'));
    content = content.split(r.old.replace(/\n/g, '\r\n')).join(r.new.replace(/\n/g, '\r\n'));
});

fs.writeFileSync(path, content, 'utf8');
console.log('Refactoring complete.');

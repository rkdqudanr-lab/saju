import os

path = 'src/pages/LandingPage.jsx'
with open(path, 'rb') as f:
    content = f.read()

content_str = content.decode('utf-8', errors='ignore')

# Refactoring: Standardizing buttons and alignment in LandingPage.jsx

replacements = [
    (
        \"\"\"                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setEditingMyProfile(true); setStep(1); }} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 50, padding: '4px 10px', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>수정</button>
                  <button onClick={kakaoLogout} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 50, padding: '4px 10px', color: 'var(--t4)', fontSize: 'var(--xs)', fontFamily: 'var(--ff)', cursor: 'pointer' }}>로그아웃</button>
                </div>\"\"\",
        \"\"\"                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setEditingMyProfile(true); setStep(1); }} className=\"res-btn\" style={{ padding: '4px 10px', minWidth: 'auto', fontSize: 'var(--xs)' }}>수정</button>
                  <button onClick={kakaoLogout} className=\"res-btn\" style={{ padding: '4px 10px', minWidth: 'auto', fontSize: 'var(--xs)' }}>로그아웃</button>
                </div>\"\"\"
    ),
    (
        \"\"\"                          <button className=\"cta-main\" style={{ alignSelf: 'stretch', marginLeft: 'var(--sp2)', marginRight: 'var(--sp2)', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px', marginTop: 10, background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)' }} onClick={() => setStep(formOk ? 2 : 1)}\"\"\",
        \"\"\"                          <button className=\"cta-main\" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(formOk ? 2 : 1)}\"\"\"
    ),
    (
        \"\"\"                        <button className=\"cta-main\" style={{ alignSelf: 'stretch', marginLeft: 'var(--sp2)', marginRight: 'var(--sp2)', justifyContent: 'center', borderRadius: 'var(--r1)', padding: '14px', marginTop: 10, background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)' }} onClick={() => setStep(formOk ? 2 : 1)}\"\"\",
        \"\"\"                        <button className=\"cta-main\" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(formOk ? 2 : 1)}\"\"\"
    ),
    (
        \"\"\"                      <div style={{ marginTop: 10, marginLeft: 'var(--sp2)', marginRight: 'var(--sp2)', background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '16px', border: '1px solid var(--line)' }}\"\"\",
        \"\"\"                      <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r1)', padding: '16px', border: '1px solid var(--line)' }}\"\"\"
    ),
]

for old, new in replacements:
    content_str = content_str.replace(old.replace('\r\n', '\n'), new.replace('\r\n', '\n'))
    # Also handle CRLF if present in file
    content_str = content_str.replace(old.replace('\n', '\r\n'), new.replace('\n', '\r\n'))

with open(path, 'wb') as f:
    f.write(content_str.encode('utf-8'))

print(\"Refactoring complete.\")

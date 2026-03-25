import { useState, useEffect, useCallback } from "react";
import { supabase } from '../lib/supabase.js'

const DEFAULT_PROFILE = { partner: '', partnerBy: '', partnerBm: '', partnerBd: '', workplace: '', worryText: '', mbti: '', selfDesc: '' };
const DEFAULT_FORM    = { name: '', by: '', bm: '', bd: '', bh: '', gender: '', noTime: false };
const DEFAULT_OTHER   = { name: '', by: '', bm: '', bd: '', bh: '', gender: '', noTime: false };

export function useUserProfile() {
  const [user, setUser] = useState(() => {
    try { const u = localStorage.getItem('byeolsoom_user'); return u ? JSON.parse(u) : null; } catch { return null; }
  });
  const [profile, setProfile] = useState(() => {
    try { const p = localStorage.getItem('byeolsoom_extra'); return p ? JSON.parse(p) : DEFAULT_PROFILE; } catch { return DEFAULT_PROFILE; }
  });
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem('byeolsoom_profile');
      if (saved) {
        const p = JSON.parse(saved);
        return { name: p.name || '', by: p.by || '', bm: p.bm || '', bd: p.bd || '', bh: p.bh || '', gender: p.gender || '', noTime: p.noTime || false };
      }
    } catch (e) {}
    return DEFAULT_FORM;
  });
  const [otherProfiles, setOtherProfiles] = useState(() => {
    try { const s = localStorage.getItem('byeolsoom_others'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [activeProfileIdx, setActiveProfileIdx]       = useState(0);
  const [otherForm, setOtherForm]                     = useState(DEFAULT_OTHER);
  const [editingOtherIdx, setEditingOtherIdx]         = useState(null); // null = 추가모드, number = 수정모드
  const [showProfileModal, setShowProfileModal]       = useState(false);
  const [showOtherProfileModal, setShowOtherProfileModal] = useState(false);
  const [loginError, setLoginError]                   = useState('');

  // ── 카카오 SDK 초기화 ──
  useEffect(() => {
    const JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY;
    if (!JS_KEY) { console.warn('[별숨] VITE_KAKAO_JS_KEY 없음'); return; }
    const initKakao = () => { if (window.Kakao && !window.Kakao.isInitialized()) window.Kakao.init(JS_KEY); };
    if (window.Kakao) { initKakao(); return; }
    if (document.getElementById('kakao-sdk')) {
      const el = document.getElementById('kakao-sdk');
      const prev = el.onload;
      el.onload = () => { if (prev) prev(); initKakao(); };
      return;
    }
    const script = document.createElement('script');
    script.id = 'kakao-sdk';
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = initKakao;
    script.onerror = () => console.error('[별숨] 카카오 SDK 로드 실패');
    document.head.appendChild(script);
  }, []);

  // ── 카카오 OAuth code 처리 ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;
    window.history.replaceState({}, '', window.location.pathname);
    (async () => {
      try {
        const res  = await fetch('/api/kakao-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, redirectUri: window.location.origin }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '인증 실패');
        const userData = { id: String(data.id), nickname: data.nickname || '별님', profileImage: data.profileImage || null };
        setUser(userData);
        localStorage.setItem('byeolsoom_user', JSON.stringify(userData));
        if (supabase) {
          const { error: sbError } = await supabase
            .from('users')
            .upsert({
              kakao_id: String(data.id),
              nickname: data.nickname || '별님',
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'kakao_id',
              ignoreDuplicates: false,
            })
          if (sbError) console.error('[별숨] Supabase upsert 오류:', sbError)
        }
      } catch (err) { console.error('[별숨] 카카오 code 오류:', err); setLoginError('카카오 로그인에 실패했어요. 다시 시도해봐요 🌙'); }
    })();
  }, []);

  // ── localStorage 동기화 ──
  useEffect(() => { if (form.by && form.bm && form.bd) { try { localStorage.setItem('byeolsoom_profile', JSON.stringify(form)); } catch (e) {} } }, [form]);
  useEffect(() => { try { localStorage.setItem('byeolsoom_extra', JSON.stringify(profile)); } catch (e) {} }, [profile]);
  useEffect(() => { try { localStorage.setItem('byeolsoom_others', JSON.stringify(otherProfiles)); } catch {} }, [otherProfiles]);

  const kakaoLogin = useCallback(() => {
    const JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY;
    if (!JS_KEY) { setLoginError('카카오 앱 키가 설정되지 않았어요. 관리자에게 문의해봐요.'); return; }
    if (!window.Kakao) { setLoginError('카카오 SDK를 불러오지 못했어요 🌙 잠시 후 다시 시도해봐요.'); return; }
    if (!window.Kakao.isInitialized()) {
      try { window.Kakao.init(JS_KEY); } catch (e) { setLoginError('카카오 초기화에 실패했어요 🌙 페이지를 새로고침 후 시도해봐요.'); return; }
    }
    setLoginError('');
    window.Kakao.Auth.authorize({ redirectUri: window.location.origin });
  }, []);

  const kakaoLogout = useCallback(() => {
    if (window.Kakao?.Auth) window.Kakao.Auth.logout(() => {});
    setUser(null);
    localStorage.removeItem('byeolsoom_user');
  }, []);

  const startEditOtherProfile = useCallback((idx) => {
    setEditingOtherIdx(idx);
    setOtherForm({ ...otherProfiles[idx] });
    setShowOtherProfileModal(true);
  }, [otherProfiles]);

  const saveOtherProfile = useCallback(() => {
    if (editingOtherIdx !== null) {
      // 수정 모드
      setOtherProfiles(p => p.map((item, i) => i === editingOtherIdx ? { ...otherForm } : item));
    } else {
      // 추가 모드
      if (otherProfiles.length >= 3) return;
      setOtherProfiles(p => [...p, { ...otherForm }]);
    }
    setOtherForm(DEFAULT_OTHER);
    setEditingOtherIdx(null);
    setShowOtherProfileModal(false);
  }, [otherProfiles, otherForm, editingOtherIdx]);

  return {
    user, setUser,
    profile, setProfile,
    form, setForm,
    otherProfiles, setOtherProfiles,
    activeProfileIdx, setActiveProfileIdx,
    otherForm, setOtherForm,
    editingOtherIdx, setEditingOtherIdx,
    showProfileModal, setShowProfileModal,
    showOtherProfileModal, setShowOtherProfileModal,
    loginError, setLoginError,
    kakaoLogin, kakaoLogout, saveOtherProfile, startEditOtherProfile,
  };
}

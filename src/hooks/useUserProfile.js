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
  const [showConsentModal, setShowConsentModal]       = useState(false);
  const [consentFlags, setConsentFlags] = useState(() => {
    try { const c = localStorage.getItem('byeolsoom_consent'); return c ? JSON.parse(c) : { history: true, partner: false, workplace: true, worry: false }; } catch { return { history: true, partner: false, workplace: true, worry: false }; }
  });
  const [loginError, setLoginError]                   = useState('');
  const [loginLoading, setLoginLoading] = useState(() => {
    // URL에 code 파라미터가 있으면 OAuth 처리 중이므로 로딩 상태로 시작
    return new URLSearchParams(window.location.search).has('code');
  });

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
          if (sbError) {
            console.error('[별숨] Supabase upsert 오류:', sbError)
          } else {
            // 기존 저장 데이터 복원 (다기기 대응)
            const { data: saved } = await supabase
              .from('users')
              .select('id, birth_year, birth_month, birth_day, consent_flags')
              .eq('kakao_id', String(data.id))
              .single();
            if (saved?.id) {
              // Supabase UUID를 user 객체에 저장 (consultation_history INSERT에 사용)
              const userDataWithUuid = { ...userData, supabaseId: saved.id };
              setUser(userDataWithUuid);
              localStorage.setItem('byeolsoom_user', JSON.stringify(userDataWithUuid));
            }
            if (saved?.birth_year) {
              setForm(f => ({ ...f, by: String(saved.birth_year), bm: String(saved.birth_month), bd: String(saved.birth_day) }));
              try {
                const cur = (() => { try { const p = localStorage.getItem('byeolsoom_profile'); return p ? JSON.parse(p) : {}; } catch { return {}; } })();
                localStorage.setItem('byeolsoom_profile', JSON.stringify({ ...cur, by: String(saved.birth_year), bm: String(saved.birth_month), bd: String(saved.birth_day) }));
              } catch (e) {}
            }
            if (saved?.consent_flags) {
              setConsentFlags(saved.consent_flags);
              try { localStorage.setItem('byeolsoom_consent', JSON.stringify(saved.consent_flags)); } catch (e) {}
            } else if (!localStorage.getItem('byeolsoom_consent')) {
              setShowConsentModal(true);
            }
          }
        } else if (!localStorage.getItem('byeolsoom_consent')) setShowConsentModal(true)
      } catch (err) { console.error('[별숨] 카카오 code 오류:', err); setLoginError('카카오 로그인에 실패했어요. 다시 시도해봐요 🌙'); }
      finally { setLoginLoading(false); }
    })();
  }, []);

  // ── 앱 로드 시 consent_flags Supabase에서 동기화 ──
  useEffect(() => {
    if (!supabase || !user?.id) return;
    // OAuth 흐름(URL code)에서는 이미 처리하므로 중복 방지
    const params = new URLSearchParams(window.location.search);
    if (params.get('code')) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('consent_flags')
          .eq('kakao_id', String(user.id))
          .single();
        if (data?.consent_flags) {
          setConsentFlags(data.consent_flags);
          try { localStorage.setItem('byeolsoom_consent', JSON.stringify(data.consent_flags)); } catch (e) {}
        } else if (!localStorage.getItem('byeolsoom_consent')) {
          setShowConsentModal(true);
        }
      } catch (e) {
        console.error('[별숨] consent_flags 동기화 오류:', e);
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 로그인 후 user_profiles Supabase에서 불러오기 ──
  useEffect(() => {
    if (!supabase || !user?.id) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('kakao_id', user.id)
          .single();
        if (data) {
          setProfile(p => ({
            ...p,
            ...(data.mbti              && { mbti:       data.mbti }),
            ...(data.self_desc         && { selfDesc:   data.self_desc }),
            ...(data.partner_name      && { partner:    data.partner_name }),
            ...(data.partner_birth_year  && { partnerBy: String(data.partner_birth_year) }),
            ...(data.partner_birth_month && { partnerBm: String(data.partner_birth_month) }),
            ...(data.partner_birth_day   && { partnerBd: String(data.partner_birth_day) }),
            ...(data.workplace         && { workplace:  data.workplace }),
            ...(data.worry_text        && { worryText:  data.worry_text }),
            ...(data.qa_answers        && { qa_answers: data.qa_answers }),
          }));
        }
      } catch (e) {
        console.error('[별숨] user_profiles 불러오기 오류:', e);
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const saveProfileToSupabase = useCallback(async (currentForm, currentUser) => {
    if (!supabase || !currentUser?.id) return;
    const { by, bm, bd, name } = currentForm;
    if (!by || !bm || !bd) return;
    try {
      const { error } = await supabase.from('users').upsert({
        kakao_id: currentUser.id,
        birth_year: parseInt(by, 10),
        birth_month: parseInt(bm, 10),
        birth_day: parseInt(bd, 10),
        nickname: name || currentUser.nickname || '별님',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'kakao_id', ignoreDuplicates: false });
      if (error) console.error('[별숨] 프로필 저장 오류:', error);
    } catch (e) {
      console.error('[별숨] 프로필 저장 오류:', e);
    }
  }, []);

  const saveUserProfileExtra = useCallback(async (profileData, currentUser) => {
    if (!supabase || !currentUser?.id) return;
    try {
      const { error } = await supabase.from('user_profiles').upsert({
        kakao_id:            currentUser.id,
        mbti:                profileData.mbti || null,
        self_desc:           profileData.selfDesc || null,
        // partner 동의 시에만 저장, 비동의 시 null로 초기화
        partner_name:        consentFlags.partner ? (profileData.partner || null) : null,
        partner_birth_year:  consentFlags.partner && profileData.partnerBy ? parseInt(profileData.partnerBy, 10) : null,
        partner_birth_month: consentFlags.partner && profileData.partnerBm ? parseInt(profileData.partnerBm, 10) : null,
        partner_birth_day:   consentFlags.partner && profileData.partnerBd ? parseInt(profileData.partnerBd, 10) : null,
        // workplace 동의 시에만 저장
        workplace:           consentFlags.workplace ? (profileData.workplace || null) : null,
        // worry 동의 시에만 저장
        worry_text:          consentFlags.worry ? (profileData.worryText || null) : null,
        // 20문 20답 답변 (항상 저장)
        qa_answers:          profileData.qa_answers || null,
        updated_at:          new Date().toISOString(),
      }, { onConflict: 'kakao_id', ignoreDuplicates: false });
      if (error) console.error('[별숨] user_profiles 저장 오류:', error);
    } catch (e) {
      console.error('[별숨] user_profiles 저장 오류:', e);
    }
  }, [consentFlags]);

  const saveDailyQuizAnswer = useCallback(async (currentUser, questionId, answer) => {
    if (!supabase || !currentUser?.id || !questionId) return;
    try {
      const { error } = await supabase.from('daily_quiz_answers').upsert({
        kakao_id:    currentUser.id,
        question_id: questionId,
        answer,
        answered_at: new Date().toISOString(),
      }, { onConflict: 'kakao_id,question_id', ignoreDuplicates: false });
      if (error) console.error('[별숨] daily_quiz_answers 저장 오류:', error);
    } catch (e) {
      console.error('[별숨] daily_quiz_answers 저장 오류:', e);
    }
  }, []);

  const handleConsentConfirm = useCallback(async (flags) => {
    const saved = flags ?? consentFlags;
    try { localStorage.setItem('byeolsoom_consent', JSON.stringify(saved)); } catch (e) {}
    if (supabase) {
      const kakaoId = (() => { try { const u = localStorage.getItem('byeolsoom_user'); return u ? JSON.parse(u).id : null; } catch { return null; } })();
      if (kakaoId) {
        const { error } = await supabase.from('users').upsert({ kakao_id: kakaoId, consent_flags: saved, updated_at: new Date().toISOString() }, { onConflict: 'kakao_id', ignoreDuplicates: false });
        if (error) console.error('[별숨] consent_flags 저장 오류:', error);
      }
    }
    setShowConsentModal(false);
  }, [consentFlags]);

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
    showConsentModal, setShowConsentModal,
    consentFlags, setConsentFlags,
    handleConsentConfirm,
    loginError, setLoginError,
    loginLoading,
    kakaoLogin, kakaoLogout, saveOtherProfile, startEditOtherProfile, saveProfileToSupabase,
    saveUserProfileExtra, saveDailyQuizAnswer,
  };
}

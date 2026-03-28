import { useState, useEffect, useCallback } from "react";
import { supabase, getAuthenticatedClient } from '../lib/supabase.js'

const DEFAULT_PROFILE = { partner: '', partnerBy: '', partnerBm: '', partnerBd: '', workplace: '', worryText: '', mbti: '', selfDesc: '' };
const DEFAULT_FORM    = { name: '', by: '', bm: '', bd: '', bh: '', gender: '', noTime: false };
const DEFAULT_OTHER   = { name: '', by: '', bm: '', bd: '', bh: '', gender: '', noTime: false };
const DEFAULT_QUIZ    = { answers: {}, nextQIdx: 0, lastAnsweredDate: '' };

// ── localStorage 헬퍼 ──
function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val)); } catch {}
}
function lsRaw(key, fallback = null) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

export function useUserProfile() {
  const [user, setUser] = useState(() => lsGet('byeolsoom_user', null));
  const [profile, setProfile] = useState(() => lsGet('byeolsoom_extra', DEFAULT_PROFILE));
  const [form, setForm] = useState(() => {
    const p = lsGet('byeolsoom_profile', null);
    if (p) return { name: p.name || '', by: p.by || '', bm: p.bm || '', bd: p.bd || '', bh: p.bh || '', gender: p.gender || '', noTime: p.noTime || false };
    return DEFAULT_FORM;
  });
  const [otherProfiles, setOtherProfiles] = useState(() => lsGet('byeolsoom_others', []));
  const [activeProfileIdx, setActiveProfileIdx]       = useState(0);
  const [otherForm, setOtherForm]                     = useState(DEFAULT_OTHER);
  const [editingOtherIdx, setEditingOtherIdx]         = useState(null);
  const [showProfileModal, setShowProfileModal]       = useState(false);
  const [showOtherProfileModal, setShowOtherProfileModal] = useState(false);
  const [showConsentModal, setShowConsentModal]       = useState(false);
  const [consentFlags, setConsentFlags] = useState(() =>
    lsGet('byeolsoom_consent', { history: true, partner: false, workplace: true, worry: false })
  );
  const [loginError, setLoginError]   = useState('');
  const [loginLoading, setLoginLoading] = useState(() =>
    new URLSearchParams(window.location.search).has('code')
  );

  // ── 개인 설정 (Supabase 연동) ──
  const [responseStyle, setResponseStyle] = useState(() => lsRaw('byeolsoom_style', 'M'));
  // 테마는 항상 기기 설정을 따름 (Supabase 저장 안함)
  const [theme, setTheme] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const [onboarded, setOnboarded] = useState(() => lsRaw('byeolsoom_onboarded') === '1');
  const [quizState, setQuizState] = useState(() => lsGet('byeolsoom_quiz', DEFAULT_QUIZ));

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

    const urlState   = params.get('state');
    const savedState = (() => { try { return sessionStorage.getItem('byeolsoom_oauth_state'); } catch { return null; } })();
    if (savedState && urlState !== savedState) {
      window.history.replaceState({}, '', window.location.pathname);
      try { sessionStorage.removeItem('byeolsoom_oauth_state'); } catch {}
      setLoginError('보안 오류가 발생했어요. 다시 로그인해주세요.');
      setLoginLoading(false);
      return;
    }
    try { sessionStorage.removeItem('byeolsoom_oauth_state'); } catch {}
    window.history.replaceState({}, '', window.location.pathname);

    (async () => {
      try {
        const res  = await fetch('/api/kakao-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, redirectUri: window.location.origin }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '인증 실패');
        const userData = { id: String(data.id), nickname: data.nickname || '별님', profileImage: data.profileImage || null };
        setUser(userData);
        lsSet('byeolsoom_user', userData);

        if (supabase) {
          const authClient = getAuthenticatedClient(String(data.id));
          await (authClient || supabase).from('users').upsert({
            kakao_id: String(data.id),
            nickname: data.nickname || '별님',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'kakao_id', ignoreDuplicates: false });

          // 저장된 데이터 복원 (다기기 대응)
          const { data: saved } = await (authClient || supabase)
            .from('users')
            .select('id, birth_year, birth_month, birth_day, consent_flags, response_style, onboarded, quiz_state')
            .eq('kakao_id', String(data.id))
            .single();

          if (saved?.id) {
            const userDataWithUuid = { ...userData, supabaseId: saved.id };
            setUser(userDataWithUuid);
            lsSet('byeolsoom_user', userDataWithUuid);
          }
          if (saved?.birth_year) {
            setForm(f => ({ ...f, by: String(saved.birth_year), bm: String(saved.birth_month), bd: String(saved.birth_day) }));
            const cur = lsGet('byeolsoom_profile', {});
            lsSet('byeolsoom_profile', { ...cur, by: String(saved.birth_year), bm: String(saved.birth_month), bd: String(saved.birth_day) });
          }
          if (saved?.consent_flags) {
            setConsentFlags(saved.consent_flags);
            lsSet('byeolsoom_consent', saved.consent_flags);
          } else if (!lsRaw('byeolsoom_consent')) {
            setShowConsentModal(true);
          }
          // 개인 설정 복원
          if (saved?.response_style) { setResponseStyle(saved.response_style); lsSet('byeolsoom_style', saved.response_style); }
          if (saved?.onboarded != null) { setOnboarded(saved.onboarded);        lsSet('byeolsoom_onboarded', saved.onboarded ? '1' : ''); }
          if (saved?.quiz_state)     { setQuizState(saved.quiz_state);          lsSet('byeolsoom_quiz', saved.quiz_state); }
        } else if (!lsRaw('byeolsoom_consent')) {
          setShowConsentModal(true);
        }
      } catch (err) {
        console.error('[별숨] 카카오 code 오류:', err);
        setLoginError('카카오 로그인에 실패했어요. 다시 시도해봐요 🌙');
      } finally {
        setLoginLoading(false);
      }
    })();
  }, []);

  // ── 앱 로드 시 Supabase에서 전체 사용자 데이터 동기화 ──
  useEffect(() => {
    if (!supabase || !user?.id) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('code')) return; // OAuth 흐름에서 이미 처리함

    (async () => {
      try {
        const authClient = getAuthenticatedClient(user.id);
        const { data } = await (authClient || supabase)
          .from('users')
          .select('consent_flags, response_style, onboarded, quiz_state')
          .eq('kakao_id', String(user.id))
          .single();
        if (data?.consent_flags) { setConsentFlags(data.consent_flags); lsSet('byeolsoom_consent', data.consent_flags); }
        else if (!lsRaw('byeolsoom_consent')) setShowConsentModal(true);
        if (data?.response_style) { setResponseStyle(data.response_style); lsSet('byeolsoom_style', data.response_style); }
        if (data?.onboarded != null) { setOnboarded(data.onboarded);        lsSet('byeolsoom_onboarded', data.onboarded ? '1' : ''); }
        if (data?.quiz_state)     { setQuizState(data.quiz_state);          lsSet('byeolsoom_quiz', data.quiz_state); }
      } catch (e) {
        console.error('[별숨] users 동기화 오류:', e);
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 로그인 후 user_profiles Supabase에서 불러오기 ──
  useEffect(() => {
    if (!supabase || !user?.id) return;
    (async () => {
      try {
        const authClient = getAuthenticatedClient(user.id);
        const { data } = await (authClient || supabase)
          .from('user_profiles').select('*').eq('kakao_id', user.id).single();
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

  // ── 로그인 후 other_profiles Supabase에서 불러오기 ──
  useEffect(() => {
    if (!supabase || !user?.id) return;
    (async () => {
      try {
        const authClient = getAuthenticatedClient(user.id);
        const { data } = await (authClient || supabase)
          .from('other_profiles').select('*').eq('kakao_id', user.id).order('sort_order');
        if (data && data.length > 0) {
          const profiles = data.map(row => ({
            name:   row.name || '',
            by:     row.birth_year  ? String(row.birth_year)  : '',
            bm:     row.birth_month ? String(row.birth_month) : '',
            bd:     row.birth_day   ? String(row.birth_day)   : '',
            bh:     row.birth_hour  ? String(row.birth_hour)  : '',
            gender: row.gender || '',
            noTime: row.no_time || false,
          }));
          setOtherProfiles(profiles);
          lsSet('byeolsoom_others', profiles);
        }
      } catch (e) {
        console.error('[별숨] other_profiles 불러오기 오류:', e);
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── localStorage 캐시 동기화 ──
  useEffect(() => { if (form.by && form.bm && form.bd) lsSet('byeolsoom_profile', form); }, [form]);
  useEffect(() => { lsSet('byeolsoom_extra', profile); }, [profile]);
  useEffect(() => { lsSet('byeolsoom_others', otherProfiles); }, [otherProfiles]);

  // ── other_profiles Supabase 전체 교체 저장 ──
  const syncOtherProfilesToSupabase = useCallback(async (profiles, currentUser) => {
    if (!supabase || !currentUser?.id) return;
    try {
      const authClient = getAuthenticatedClient(currentUser.id);
      await (authClient || supabase).from('other_profiles').delete().eq('kakao_id', currentUser.id);
      if (profiles.length > 0) {
        await (authClient || supabase).from('other_profiles').insert(
          profiles.map((p, i) => ({
            kakao_id:    currentUser.id,
            name:        p.name || '',
            birth_year:  p.by ? parseInt(p.by, 10) : null,
            birth_month: p.bm ? parseInt(p.bm, 10) : null,
            birth_day:   p.bd ? parseInt(p.bd, 10) : null,
            birth_hour:  p.bh ? parseFloat(p.bh)   : null,
            gender:      p.gender || null,
            no_time:     p.noTime || false,
            sort_order:  i,
          }))
        );
      }
    } catch (e) {
      console.error('[별숨] other_profiles 저장 오류:', e);
    }
  }, []);

  // ── 개인 설정 저장 (responseStyle / theme / onboarded / quizState) ──
  const saveSettings = useCallback(async (updates) => {
    const currentUser = (() => { try { return JSON.parse(localStorage.getItem('byeolsoom_user')); } catch { return null; } })();
    if (updates.responseStyle !== undefined) { setResponseStyle(updates.responseStyle); lsSet('byeolsoom_style', updates.responseStyle); }
    // 테마는 기기 설정을 따르므로 Supabase에 저장하지 않음 (세션 내 토글만 허용)
    if (updates.theme         !== undefined) { setTheme(updates.theme); }
    if (updates.onboarded     !== undefined) { setOnboarded(updates.onboarded);           lsSet('byeolsoom_onboarded', updates.onboarded ? '1' : ''); }
    if (updates.quizState     !== undefined) { setQuizState(updates.quizState);           lsSet('byeolsoom_quiz', updates.quizState); }
    if (!supabase || !currentUser?.id) return;
    const dbUpdates = {};
    if (updates.responseStyle !== undefined) dbUpdates.response_style = updates.responseStyle;
    if (updates.onboarded     !== undefined) dbUpdates.onboarded       = updates.onboarded;
    if (updates.quizState     !== undefined) dbUpdates.quiz_state      = updates.quizState;
    if (!Object.keys(dbUpdates).length) return;
    try {
      const authClient = getAuthenticatedClient(currentUser.id);
      await (authClient || supabase).from('users').update({ ...dbUpdates, updated_at: new Date().toISOString() }).eq('kakao_id', currentUser.id);
    } catch (e) {
      console.error('[별숨] 설정 저장 오류:', e);
    }
  }, []);

  const kakaoLogin = useCallback(() => {
    const JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY;
    if (!JS_KEY) { setLoginError('카카오 앱 키가 설정되지 않았어요.'); return; }
    if (!window.Kakao) { setLoginError('카카오 SDK를 불러오지 못했어요 🌙'); return; }
    if (!window.Kakao.isInitialized()) {
      try { window.Kakao.init(JS_KEY); } catch { setLoginError('카카오 초기화에 실패했어요 🌙'); return; }
    }
    setLoginError('');
    try {
      const state = crypto.randomUUID();
      sessionStorage.setItem('byeolsoom_oauth_state', state);
      window.Kakao.Auth.authorize({ redirectUri: window.location.origin, state });
    } catch {
      window.Kakao.Auth.authorize({ redirectUri: window.location.origin });
    }
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
    let newProfiles;
    if (editingOtherIdx !== null) {
      newProfiles = otherProfiles.map((item, i) => i === editingOtherIdx ? { ...otherForm } : item);
    } else {
      if (otherProfiles.length >= 3) return;
      newProfiles = [...otherProfiles, { ...otherForm }];
    }
    setOtherProfiles(newProfiles);
    const currentUser = (() => { try { return JSON.parse(localStorage.getItem('byeolsoom_user')); } catch { return null; } })();
    syncOtherProfilesToSupabase(newProfiles, currentUser);
    setOtherForm(DEFAULT_OTHER);
    setEditingOtherIdx(null);
    setShowOtherProfileModal(false);
  }, [otherProfiles, otherForm, editingOtherIdx, syncOtherProfilesToSupabase]);

  const saveProfileToSupabase = useCallback(async (currentForm, currentUser) => {
    if (!supabase || !currentUser?.id) return;
    const { by, bm, bd, name } = currentForm;
    if (!by || !bm || !bd) return;
    try {
      const authClient = getAuthenticatedClient(currentUser.id);
      const { error } = await (authClient || supabase).from('users').upsert({
        kakao_id:    currentUser.id,
        birth_year:  parseInt(by, 10),
        birth_month: parseInt(bm, 10),
        birth_day:   parseInt(bd, 10),
        nickname:    name || currentUser.nickname || '별님',
        updated_at:  new Date().toISOString(),
      }, { onConflict: 'kakao_id', ignoreDuplicates: false });
      if (error) console.error('[별숨] 프로필 저장 오류:', error);
    } catch (e) {
      console.error('[별숨] 프로필 저장 오류:', e);
    }
  }, []);

  const saveUserProfileExtra = useCallback(async (profileData, currentUser) => {
    if (!supabase || !currentUser?.id) return;
    try {
      const authClient = getAuthenticatedClient(currentUser.id);
      const { error } = await (authClient || supabase).from('user_profiles').upsert({
        kakao_id:            currentUser.id,
        mbti:                profileData.mbti || null,
        self_desc:           profileData.selfDesc || null,
        partner_name:        consentFlags.partner ? (profileData.partner || null) : null,
        partner_birth_year:  consentFlags.partner && profileData.partnerBy ? parseInt(profileData.partnerBy, 10) : null,
        partner_birth_month: consentFlags.partner && profileData.partnerBm ? parseInt(profileData.partnerBm, 10) : null,
        partner_birth_day:   consentFlags.partner && profileData.partnerBd ? parseInt(profileData.partnerBd, 10) : null,
        workplace:           consentFlags.workplace ? (profileData.workplace || null) : null,
        worry_text:          consentFlags.worry ? (profileData.worryText || null) : null,
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
      const authClient = getAuthenticatedClient(currentUser.id);
      const { error } = await (authClient || supabase).from('daily_quiz_answers').upsert({
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
    lsSet('byeolsoom_consent', saved);
    setConsentFlags(saved);
    if (supabase) {
      const kakaoId = (() => { try { return JSON.parse(localStorage.getItem('byeolsoom_user'))?.id; } catch { return null; } })();
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
    // 개인 설정
    responseStyle, theme, onboarded, quizState,
    saveSettings,
    // 기존 함수들
    kakaoLogin, kakaoLogout, saveOtherProfile, startEditOtherProfile,
    saveProfileToSupabase, saveUserProfileExtra, saveDailyQuizAnswer,
  };
}

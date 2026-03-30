import { useState, useEffect, useCallback } from "react";
import { supabase, getAuthenticatedClient } from '../lib/supabase.js'

const DEFAULT_PROFILE = { partner: '', partnerBy: '', partnerBm: '', partnerBd: '', workplace: '', worryText: '', mbti: '', selfDesc: '' };
const DEFAULT_FORM    = { name: '', by: '', bm: '', bd: '', bh: '', gender: '', noTime: false };
const DEFAULT_OTHER   = { name: '', by: '', bm: '', bd: '', bh: '', gender: '', noTime: false };
const DEFAULT_QUIZ    = { answers: {}, nextQIdx: 0, lastAnsweredDate: '' };

// ── 인증 세션만 localStorage 사용 (다른 모든 데이터는 Supabase) ──
function getAuthUser() {
  try { return JSON.parse(localStorage.getItem('byeolsoom_user')); } catch { return null; }
}
function setAuthUser(val) {
  try { localStorage.setItem('byeolsoom_user', val === null ? '' : JSON.stringify(val)); } catch {}
  if (val === null) { try { localStorage.removeItem('byeolsoom_user'); } catch {} }
}

export function useUserProfile() {
  const [user, setUser] = useState(() => getAuthUser());
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [otherProfiles, setOtherProfiles] = useState([]);
  const [activeProfileIdx, setActiveProfileIdx]       = useState(0);
  const [otherForm, setOtherForm]                     = useState(DEFAULT_OTHER);
  const [editingOtherIdx, setEditingOtherIdx]         = useState(null);
  const [showProfileModal, setShowProfileModal]       = useState(false);
  const [showOtherProfileModal, setShowOtherProfileModal] = useState(false);
  const [showConsentModal, setShowConsentModal]       = useState(false);
  const [consentFlags, setConsentFlags] = useState(null); // null = 아직 로드 안 됨
  const [loginError, setLoginError]   = useState('');
  const [loginLoading, setLoginLoading] = useState(() =>
    new URLSearchParams(window.location.search).has('code')
  );

  // ── 개인 설정 (Supabase 저장) ──
  const [responseStyle, setResponseStyle] = useState('M');
  // 테마: 기기 설정 따름 (localStorage 저장 안 함, 세션 내 토글만)
  const [theme, setTheme] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const [onboarded, setOnboarded] = useState(false);
  const [quizState, setQuizState] = useState(DEFAULT_QUIZ);

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
    // savedState 없으면(sessionStorage 불가 등) CSRF 검증 불가 → 로그인 거부
    if (!savedState || urlState !== savedState) {
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
        setAuthUser(userData);

        if (supabase) {
          const authClient = getAuthenticatedClient(String(data.id));
          const { error: upsertErr } = await (authClient || supabase).from('users').upsert({
            kakao_id: String(data.id),
            nickname: data.nickname || '별님',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'kakao_id', ignoreDuplicates: false });
          if (upsertErr) throw new Error('사용자 정보 저장에 실패했어요. 다시 로그인해주세요.');

          const { data: saved } = await (authClient || supabase)
            .from('users')
            .select('id, birth_year, birth_month, birth_day, consent_flags, response_style, onboarded, quiz_state')
            .eq('kakao_id', String(data.id))
            .single();

          if (saved?.id) {
            const userDataWithUuid = { ...userData, supabaseId: saved.id };
            setUser(userDataWithUuid);
            setAuthUser(userDataWithUuid);
          }
          if (saved?.birth_year) {
            setForm(f => ({ ...f, by: String(saved.birth_year), bm: String(saved.birth_month), bd: String(saved.birth_day) }));
          }
          if (saved?.consent_flags) {
            setConsentFlags(saved.consent_flags);
          } else {
            setShowConsentModal(true);
          }
          if (saved?.response_style) setResponseStyle(saved.response_style);
          if (saved?.onboarded != null) setOnboarded(saved.onboarded);
          if (saved?.quiz_state) setQuizState(saved.quiz_state);
        } else {
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

  // ── 앱 로드 시 Supabase에서 전체 사용자 데이터 병렬 동기화 ──
  useEffect(() => {
    if (!supabase || !user?.id) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('code')) return;

    const authClient = getAuthenticatedClient(user.id);
    const client = authClient || supabase;

    (async () => {
      const [usersRes, profilesRes, othersRes] = await Promise.allSettled([
        client.from('users')
          .select('birth_year, birth_month, birth_day, consent_flags, response_style, onboarded, quiz_state')
          .eq('kakao_id', String(user.id))
          .single(),
        client.from('user_profiles').select('*').eq('kakao_id', user.id).single(),
        client.from('other_profiles').select('*').eq('kakao_id', user.id).order('sort_order'),
      ]);

      // users 테이블
      if (usersRes.status === 'fulfilled') {
        const data = usersRes.value.data;
        if (data?.birth_year) {
          setForm(f => f.by ? f : { ...f, by: String(data.birth_year), bm: String(data.birth_month), bd: String(data.birth_day) });
        }
        if (data?.consent_flags) setConsentFlags(data.consent_flags);
        else setShowConsentModal(true); // DB에 동의 정보 없으면 항상 모달 표시
        if (data?.response_style) setResponseStyle(data.response_style);
        if (data?.onboarded != null) setOnboarded(data.onboarded);
        if (data?.quiz_state) setQuizState(data.quiz_state);
      } else {
        console.error('[별숨] users 동기화 오류:', usersRes.reason);
      }

      // user_profiles 테이블
      if (profilesRes.status === 'fulfilled') {
        const data = profilesRes.value.data;
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
      } else {
        console.error('[별숨] user_profiles 불러오기 오류:', profilesRes.reason);
      }

      // other_profiles 테이블
      if (othersRes.status === 'fulfilled') {
        const data = othersRes.value.data;
        if (data && data.length > 0) {
          setOtherProfiles(data.map(row => ({
            name:   row.name || '',
            by:     row.birth_year  ? String(row.birth_year)  : '',
            bm:     row.birth_month ? String(row.birth_month) : '',
            bd:     row.birth_day   ? String(row.birth_day)   : '',
            // birth_hour=0(자시/자정)은 유효한 시간값이므로 null/undefined 체크로 처리
            bh:     row.birth_hour != null ? String(row.birth_hour) : '',
            gender: row.gender || '',
            noTime: row.no_time || false,
          })));
        }
      } else {
        console.error('[별숨] other_profiles 불러오기 오류:', othersRes.reason);
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const currentUser = getAuthUser();
    if (updates.responseStyle !== undefined) setResponseStyle(updates.responseStyle);
    if (updates.theme         !== undefined) setTheme(updates.theme);
    if (updates.onboarded     !== undefined) setOnboarded(updates.onboarded);
    if (updates.quizState     !== undefined) setQuizState(updates.quizState);
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
    setForm(DEFAULT_FORM);
    setProfile(DEFAULT_PROFILE);
    setOtherProfiles([]);
    setConsentFlags(null);
    setAuthUser(null);
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
    const currentUser = getAuthUser();
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
        partner_name:        consentFlags?.partner ? (profileData.partner || null) : null,
        partner_birth_year:  consentFlags?.partner && profileData.partnerBy ? parseInt(profileData.partnerBy, 10) : null,
        partner_birth_month: consentFlags?.partner && profileData.partnerBm ? parseInt(profileData.partnerBm, 10) : null,
        partner_birth_day:   consentFlags?.partner && profileData.partnerBd ? parseInt(profileData.partnerBd, 10) : null,
        workplace:           consentFlags?.workplace ? (profileData.workplace || null) : null,
        worry_text:          consentFlags?.worry ? (profileData.worryText || null) : null,
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
    // 명시적 동의 없이는 모두 false (GDPR opt-in 원칙)
    const saved = flags ?? consentFlags ?? { history: false, partner: false, workplace: false, worry: false };
    setConsentFlags(saved);
    if (supabase) {
      const kakaoId = getAuthUser()?.id;
      if (kakaoId) {
        await supabase.from('users').upsert({ kakao_id: kakaoId, consent_flags: saved, updated_at: new Date().toISOString() }, { onConflict: 'kakao_id', ignoreDuplicates: false });
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
    responseStyle, theme, onboarded, quizState,
    saveSettings,
    kakaoLogin, kakaoLogout, saveOtherProfile, startEditOtherProfile,
    saveProfileToSupabase, saveUserProfileExtra, saveDailyQuizAnswer,
  };
}

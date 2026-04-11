/**
 * usePushNotification — Web Push 알림 구독 훅
 * VAPID 키 기반 push 구독을 관리하고
 * 사용자의 알림 설정(notification_prefs)을 Supabase에 저장합니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { useAppStore } from '../store/useAppStore.js';

// 서버에서 환경변수로 제공받는 VAPID 공개키
// 배포 시 VITE_VAPID_PUBLIC_KEY 환경변수에 설정
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

const DEFAULT_PREFS = {
  daily_horoscope: false,
  streak_reminder: false,
  jeolgi_notice: false,
  mission_reminder: false,
};

export function usePushNotification() {
  const { user } = useAppStore();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [supported, setSupported] = useState(false);
  const [permissionState, setPermissionState] = useState('default'); // 'default'|'granted'|'denied'
  const [loading, setLoading] = useState(false);

  const kakaoId = user?.kakaoId || user?.id;

  useEffect(() => {
    setSupported('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window);
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  // Supabase에서 현재 설정 불러오기
  useEffect(() => {
    if (!kakaoId) return;
    loadPrefs();
  }, [kakaoId]);

  async function loadPrefs() {
    try {
      const client = getAuthenticatedClient(kakaoId);
      const { data } = await client
        .from('users')
        .select('notification_prefs')
        .eq('kakao_id', String(kakaoId))
        .single();
      if (data?.notification_prefs) {
        setPrefs({ ...DEFAULT_PREFS, ...data.notification_prefs });
      }
    } catch {
      // 조용히 실패
    }
  }

  async function requestPermission() {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    setPermissionState(result);
    return result === 'granted';
  }

  async function subscribePush() {
    if (!VAPID_PUBLIC_KEY) {
      console.warn('[별숨] VAPID_PUBLIC_KEY 환경변수가 설정되지 않았어요');
      return null;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      return sub.toJSON();
    } catch (e) {
      console.error('[별숨] Push 구독 오류:', e);
      return null;
    }
  }

  async function unsubscribePush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    } catch {
      // 조용히 실패
    }
  }

  async function savePrefsToSupabase(newPrefs, subscription = undefined) {
    if (!kakaoId) return;
    const client = getAuthenticatedClient(kakaoId);
    const update = { notification_prefs: newPrefs };
    if (subscription !== undefined) update.push_subscription = subscription;
    await client.from('users').update(update).eq('kakao_id', String(kakaoId));
  }

  const togglePref = useCallback(async (key) => {
    if (!supported) return;
    setLoading(true);

    const currentValue = prefs[key];
    const newValue = !currentValue;
    const newPrefs = { ...prefs, [key]: newValue };

    try {
      if (newValue) {
        // 켜기: 권한 요청 → 구독
        const granted = permissionState === 'granted' || await requestPermission();
        if (!granted) {
          setLoading(false);
          return;
        }
        const subscription = await subscribePush();
        await savePrefsToSupabase(newPrefs, subscription);
      } else {
        // 끄기: 모든 알림이 꺼지면 구독 해제
        const anyOn = Object.entries(newPrefs).some(([k, v]) => k !== key && v);
        if (!anyOn) await unsubscribePush();
        await savePrefsToSupabase(newPrefs, anyOn ? undefined : null);
      }
      setPrefs(newPrefs);
    } catch (e) {
      console.error('[별숨] 알림 설정 오류:', e);
    } finally {
      setLoading(false);
    }
  }, [prefs, supported, permissionState, kakaoId]);

  return { prefs, togglePref, supported, permissionState, loading };
}

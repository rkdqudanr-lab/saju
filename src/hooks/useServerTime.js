import { useEffect } from 'react';
import { setTimeOffset } from '../utils/serverTime.js';

// 앱 마운트 시 1회 호출 — worldtimeapi.org에서 서버 시각 받아 오프셋 저장
export function useServerTime() {
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000); // 4초 타임아웃

    fetch('https://worldtimeapi.org/api/ip', { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data?.datetime) {
          const serverH = new Date(data.datetime).getHours();
          const localH  = new Date().getHours();
          setTimeOffset(serverH - localH);
        }
      })
      .catch(() => {}) // 실패 시 기존 오프셋(또는 0) 유지
      .finally(() => clearTimeout(timer));

    return () => { controller.abort(); clearTimeout(timer); };
  }, []);
}

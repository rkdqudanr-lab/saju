function isLocalHost() {
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
}

export function isLocalLayoutMode() {
  return (
    import.meta.env.VITE_DISABLE_LOCAL_LAYOUT !== 'true'
    && isLocalHost()
  );
}

export function isLocalLayoutUser(user) {
  return isLocalLayoutMode() && user?.id === 'test_user_id';
}

export function isLocalLayoutKakaoId(kakaoId) {
  return isLocalLayoutMode() && String(kakaoId) === 'test_user_id';
}

export function isLocalMockMode() {
  return (
    isLocalLayoutMode()
    && import.meta.env.VITE_ENABLE_LOCAL_MOCKS === 'true'
    && import.meta.env.VITE_REAL_API !== 'true'
  );
}

export function isLocalMockUser(user) {
  return isLocalMockMode() && user?.id === 'test_user_id';
}

/**
 * OrbitalFrequencyMiniGame 컴포넌트
 * 오늘의 행운 번호 6자리 맞히기 게임
 */

import React, { useState, useEffect } from 'react';
import {
  generateDailyLuckyNumber,
  initializeLockedState,
  validateOrbitalGuess,
  getRewardMessage,
} from '../utils/orbitalFrequencyGenerator.js';

export default function OrbitalFrequencyMiniGame({
  kakaoId,
  currentBp = 0,
  onEarnBP = null,
  onUnlock = null,
  className = '',
}) {
  const [gameState, setGameState] = useState({
    luckyNumber: '',
    visible: '------',
    locked: [0, 1, 2, 3, 4, 5],
    guess: '------',
    attempts: 3,
    completed: false,
    reward: 0,
    matchPercent: 0,
  });

  const [unlockedThisSession, setUnlockedThisSession] = useState([]);

  // 게임 초기화
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const lucky = generateDailyLuckyNumber(kakaoId, dateStr);
    const { visible, locked } = initializeLockedState(lucky);

    setGameState(prev => ({
      ...prev,
      luckyNumber: lucky,
      visible: visible,
      locked: locked,
      guess: visible, // 초기 추측은 visible과 같음
    }));
  }, [kakaoId]);

  const handleDigitChange = (index, value) => {
    // 잠금된 위치는 변경 불가
    if (gameState.locked.includes(index)) return;

    // 숫자만 입력 가능
    if (!/^\d$/.test(value) && value !== '') return;

    const newGuess = gameState.guess.split('');
    newGuess[index] = value;
    setGameState(prev => ({
      ...prev,
      guess: newGuess.join(''),
    }));
  };

  const handleUnlock = (index) => {
    if (gameState.locked.includes(index)) {
      // 이미 잠금 해제됨
      return;
    }

    if (currentBp < 5) {
      // BP 부족
      return;
    }

    // 잠금 해제
    const newLocked = gameState.locked.filter(i => i !== index);
    setGameState(prev => ({
      ...prev,
      locked: newLocked,
    }));

    setUnlockedThisSession(prev => [...prev, index]);

    if (onUnlock) {
      onUnlock(5, 'orbital_unlock');
    }
  };

  const handleSubmitGuess = () => {
    if (gameState.completed || gameState.attempts <= 0) return;

    // 모든 자리가 채워졌는지 확인
    if (gameState.guess.includes('-')) {
      return;
    }

    const result = validateOrbitalGuess(
      gameState.guess,
      gameState.luckyNumber,
      gameState.locked
    );

    if (result.error) {
      return;
    }

    const newAttempts = gameState.attempts - 1;
    const completed = result.isCorrect || newAttempts === 0;

    setGameState(prev => ({
      ...prev,
      completed: completed,
      reward: result.bpReward,
      matchPercent: result.matchPercent,
      attempts: newAttempts,
    }));

    if (result.bpReward > 0 && onEarnBP) {
      onEarnBP(result.bpReward, 'orbital_game');
    }
  };

  const handleReset = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const lucky = generateDailyLuckyNumber(kakaoId, dateStr);
    const { visible, locked } = initializeLockedState(lucky);

    setGameState(prev => ({
      ...prev,
      luckyNumber: lucky,
      visible: visible,
      locked: locked,
      guess: visible,
      completed: false,
      reward: 0,
      matchPercent: 0,
      attempts: 3,
    }));

    setUnlockedThisSession([]);
  };

  return (
    <div
      className={`orbital-frequency-game ${className}`}
      style={{
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '12px',
        maxWidth: '400px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎲</div>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#0D0B14',
            margin: '0 0 4px 0',
          }}
        >
          오늘의 행운 번호
        </h3>
        <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
          6자리 번호를 맞혀보세요
        </p>
      </div>

      {!gameState.completed ? (
        <>
          {/* 시도 횟수 */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#999',
            }}
          >
            남은 시도: {gameState.attempts}/3
          </div>

          {/* 숫자 입력 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                }}
              >
                {gameState.locked.includes(i) ? (
                  // 잠금 상태
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#E5E5FF',
                      borderRadius: '8px',
                      border: '2px solid #4A8EC4',
                      fontSize: '20px',
                      color: '#4A8EC4',
                      fontWeight: '700',
                    }}
                  >
                    🔒
                  </div>
                ) : (
                  // 해제된 상태
                  <>
                    <input
                      type="text"
                      maxLength={1}
                      value={gameState.guess[i] || ''}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      disabled={gameState.attempts <= 0}
                      style={{
                        width: '100%',
                        height: '100%',
                        textAlign: 'center',
                        fontSize: '20px',
                        fontWeight: '700',
                        border: '2px solid #E5E5FF',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        cursor: 'text',
                        caretColor: '#4A8EC4',
                      }}
                    />
                    {/* 잠금 해제 버튼 */}
                    <button
                      onClick={() => handleUnlock(i)}
                      disabled={currentBp < 5}
                      style={{
                        position: 'absolute',
                        bottom: '-20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '11px',
                        padding: '2px 4px',
                        backgroundColor: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: currentBp >= 5 ? 'pointer' : 'not-allowed',
                        opacity: currentBp >= 5 ? 1 : 0.5,
                      }}
                    >
                      🔓 5BM
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* 잠금 해제 비용 안내 */}
          <div
            style={{
              fontSize: '11px',
              color: '#999',
              textAlign: 'center',
              marginBottom: '16px',
              marginTop: '28px',
            }}
          >
            각 번호 잠금 해제: 5 BM
          </div>

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmitGuess}
            disabled={gameState.guess.includes('-') || gameState.attempts <= 0}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: gameState.guess.includes('-') ? '#ddd' : '#4A8EC4',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: gameState.guess.includes('-') ? 'not-allowed' : 'pointer',
              opacity: gameState.guess.includes('-') ? 0.6 : 1,
            }}
          >
            ✦ 답 제출
          </button>
        </>
      ) : (
        // 결과 화면
        <>
          <div
            style={{
              textAlign: 'center',
              padding: '20px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '12px', color: 'var(--gold)' }}>
              {gameState.reward === 200 ? '⊛' : gameState.reward >= 40 ? '◈' : gameState.reward > 0 ? '✦' : '◇'}
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#0D0B14',
                marginBottom: '8px',
              }}
            >
              {gameState.matchPercent}% 일치!
            </div>
            <div
              style={{
                fontSize: '13px',
                color: '#666',
                marginBottom: '12px',
              }}
            >
              {getRewardMessage(gameState.reward, gameState.reward === 200)}
            </div>

            {gameState.reward > 0 && (
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#5FAD7A',
                }}
              >
                + {gameState.reward} BM
              </div>
            )}
          </div>

          {/* 리셋 버튼 */}
          <button
            onClick={handleReset}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#f5f5f5',
              color: '#666',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            내일 다시 시도
          </button>
        </>
      )}
    </div>
  );
}

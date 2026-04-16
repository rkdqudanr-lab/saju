/**
 * synergyMissionLogic.js
 * 소셜 시너지 미션 매칭 및 보상 로직
 */

/**
 * 두 사람의 사주 정보를 기반으로 시너지 미션 타입 생성
 * @param {Object} user1Saju - 사용자1 사주 { dom, gan, ji, ... }
 * @param {Object} user2Saju - 사용자2 사주 { dom, gan, ji, ... }
 * @param {number} compatScore - 궁합 점수 (0-100)
 * @returns {Object} { type, title, description, reward }
 */
export function generateSynergyMission(user1Saju, user2Saju, compatScore) {
  const missions = [];

  // 오행 상생 기반 식사 미션
  if (user1Saju?.dom && user2Saju?.dom) {
    // 오행: 목(wood) > 화(fire) > 토(earth) > 금(metal) > 수(water) > 목
    const elementChain = {
      '목': '화',
      '화': '토',
      '토': '금',
      '금': '수',
      '수': '목',
    };

    const nextElement = elementChain[user1Saju.dom];
    if (nextElement === user2Saju.dom || nextElement === user1Saju.dom) {
      missions.push({
        type: 'meal',
        icon: '◇',
        title: '혼합 오행 식사하기',
        description: `${user1Saju.dom} 기운과 ${user2Saju.dom} 기운을 조화시키는 음식을 함께 먹어봐요`,
        reward: 30,
        emoji: '◇',
      });
    }
  }

  // 궁합 기반 대화 미션
  if (compatScore >= 70) {
    missions.push({
      type: 'chat',
      icon: '◇',
      title: '깊은 대화 나누기',
      description: '서로 최근에 한 일이나 느낌을 깊게 나눠봐요',
      reward: 30,
      emoji: '◇',
    });
  }

  // 시간 기반 미션 (특정 시간에 연락)
  missions.push({
    type: 'timing',
    icon: '◷',
    title: '럭키타임에 연락하기',
    description: '오후 2시에 서로에게 응원의 메시지를 보내봐요',
    reward: 30,
    emoji: '◇',
  });

  // 임의의 재미있는 미션
  const funMissions = [
    {
      type: 'fun',
      icon: '◈',
      title: '호칭 바꿔 부르기',
      description: '평소와 다른 호칭으로 불러보며 분위기를 바꿔봐요',
      reward: 30,
      emoji: '◈',
    },
    {
      type: 'fun',
      icon: '◇',
      title: '함께한 순간 기록하기',
      description: '함께 있는 모습을 사진으로 담아봐요',
      reward: 30,
      emoji: '◇',
    },
  ];

  missions.push(funMissions[Math.floor(Math.random() * funMissions.length)]);

  return missions[Math.floor(Math.random() * missions.length)];
}

/**
 * 미션 완료 보상 계산
 * @param {Object} mission - 미션 객체
 * @returns {number} BP 보상액
 */
export function getMissionReward(mission) {
  return mission?.reward || 30;
}

/**
 * 미션 진행도 포맷팅
 * @param {string} status - 미션 상태 ('pending' | 'active' | 'completed')
 * @returns {string} 상태 표시 텍스트
 */
export function getStatusLabel(status) {
  const labels = {
    pending: '대기 중',
    active: '진행 중',
    completed: '완료',
    expired: '기한 만료',
  };
  return labels[status] || status;
}

/**
 * 미션 만료 여부 확인
 * @param {Date} expiresAt - 만료 날짜
 * @returns {boolean} 만료 여부
 */
export function isMissionExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

/**
 * 미션 남은 시간 포맷팅
 * @param {Date} expiresAt - 만료 날짜
 * @returns {string} 남은 시간 텍스트
 */
export function getTimeRemaining(expiresAt) {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires - now;

  if (diffMs <= 0) return '기한 만료';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}일 ${hours}시간`;
  if (hours > 0) return `${hours}시간`;
  return '곧 만료';
}

/**
 * 서로 다른 두 사람의 미션 일치 확인
 * @param {string} userId1 - 사용자1 ID
 * @param {string} userId2 - 사용자2 ID
 * @returns {boolean} 쌍방 합의 여부
 */
export function validateMutualAcceptance(mission1Status, mission2Status) {
  return mission1Status === 'completed' && mission2Status === 'completed';
}

/**
 * 임의의 시너지 미션 ID 생성
 * @param {string} proposerId - 제안자 ID
 * @param {string} responderId - 응답자 ID
 * @returns {string} 미션 ID
 */
export function generateSynergyMissionId(proposerId, responderId) {
  const timestamp = Date.now();
  return `synergy_${proposerId}_${responderId}_${timestamp}`;
}

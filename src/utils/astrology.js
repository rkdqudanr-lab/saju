export const SIGNS = [
  { n: "양자리", s: "♈", sm: 3, sd: 21, em: 4, ed: 19, desc: "먼저 시작하고 몸으로 부딪히며 길을 여는 기질", elem: "불" },
  { n: "황소자리", s: "♉", sm: 4, sd: 20, em: 5, ed: 20, desc: "천천히 쌓아 올리며 감각과 안정감을 중시하는 기질", elem: "흙" },
  { n: "쌍둥이자리", s: "♊", sm: 5, sd: 21, em: 6, ed: 20, desc: "말과 정보, 연결을 통해 움직이는 호기심 많은 기질", elem: "바람" },
  { n: "게자리", s: "♋", sm: 6, sd: 21, em: 7, ed: 22, desc: "가까운 사람과 공간을 세심하게 돌보는 기질", elem: "물" },
  { n: "사자자리", s: "♌", sm: 7, sd: 23, em: 8, ed: 22, desc: "자신의 존재감을 또렷하게 드러내며 빛나는 기질", elem: "불" },
  { n: "처녀자리", s: "♍", sm: 8, sd: 23, em: 9, ed: 22, desc: "질서를 세우고 흐트러진 것을 정리하는 기질", elem: "흙" },
  { n: "천칭자리", s: "♎", sm: 9, sd: 23, em: 10, ed: 22, desc: "관계의 균형과 조화를 자연스럽게 살피는 기질", elem: "바람" },
  { n: "전갈자리", s: "♏", sm: 10, sd: 23, em: 11, ed: 21, desc: "겉보다 깊이를 중시하며 몰입이 강한 기질", elem: "물" },
  { n: "사수자리", s: "♐", sm: 11, sd: 22, em: 12, ed: 21, desc: "넓은 세계를 향해 의미와 가능성을 찾는 기질", elem: "불" },
  { n: "염소자리", s: "♑", sm: 12, sd: 22, em: 1, ed: 19, desc: "긴 호흡으로 목표를 세우고 책임 있게 가는 기질", elem: "흙" },
  { n: "물병자리", s: "♒", sm: 1, sd: 20, em: 2, ed: 18, desc: "익숙한 틀 밖에서 새로운 관점을 찾는 기질", elem: "바람" },
  { n: "물고기자리", s: "♓", sm: 2, sd: 19, em: 3, ed: 20, desc: "감정과 분위기를 넓게 받아들이는 공감형 기질", elem: "물" },
];

const DEG = Math.PI / 180;
const DEFAULT_TIMEZONE = 9;

function normalizeAngle(degValue) {
  return ((degValue % 360) + 360) % 360;
}

function sinDeg(degValue) {
  return Math.sin(degValue * DEG);
}

function cosDeg(degValue) {
  return Math.cos(degValue * DEG);
}

function atan2Deg(y, x) {
  return Math.atan2(y, x) / DEG;
}

function extractClock(hour = 12, minute = 0) {
  const hourValue = Number(hour);
  const minuteValue = Number(minute);
  if (!Number.isFinite(hourValue)) return { hour: 12, minute: 0 };

  const wholeHour = Math.trunc(hourValue);
  const hasExplicitMinute = Number.isFinite(minuteValue) && Math.abs(minuteValue) > 0;
  const minuteFromHour = hasExplicitMinute ? 0 : Math.round((hourValue - wholeHour) * 60);
  const totalMinutes = wholeHour * 60 + minuteFromHour + (Number.isFinite(minuteValue) ? minuteValue : 0);
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;

  return {
    hour: Math.floor(normalizedMinutes / 60),
    minute: normalizedMinutes % 60,
  };
}

function toJulianDay(year, month, day, hour = 12, minute = 0, timezone = DEFAULT_TIMEZONE) {
  const { hour: hh, minute: mm } = extractClock(hour, minute);
  const utcMillis = Date.UTC(year, month - 1, day, hh - timezone, mm, 0, 0);
  return utcMillis / 86400000 + 2440587.5;
}

function resolveDateArgs(a, b, c, d = 12, e = 0) {
  if (typeof c === "undefined") {
    return { year: null, month: a, day: b, hour: 12, minute: 0 };
  }
  return { year: a, month: b, day: c, hour: d, minute: e };
}

function signByDate(month, day) {
  for (const sign of SIGNS) {
    if (sign.sm <= sign.em) {
      if (
        (month === sign.sm && day >= sign.sd) ||
        (month === sign.em && day <= sign.ed) ||
        (month > sign.sm && month < sign.em)
      ) return sign;
    } else if (
      (month === sign.sm && day >= sign.sd) ||
      (month === sign.em && day <= sign.ed) ||
      month > sign.sm ||
      month < sign.em
    ) {
      return sign;
    }
  }
  return SIGNS[0];
}

function signByLongitude(longitude) {
  return SIGNS[Math.floor(normalizeAngle(longitude) / 30) % 12];
}

function getSunLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const L0 = normalizeAngle(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = normalizeAngle(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * sinDeg(M) +
    (0.019993 - 0.000101 * T) * sinDeg(2 * M) +
    0.000289 * sinDeg(3 * M);
  return normalizeAngle(L0 + C);
}

function getMoonLongitude(jd) {
  const d = jd - 2451543.5;

  const N = normalizeAngle(125.1228 - 0.0529538083 * d);
  const i = 5.1454;
  const w = normalizeAngle(318.0634 + 0.1643573223 * d);
  const e = 0.0549;
  const M = normalizeAngle(115.3654 + 13.0649929509 * d);

  const E = M + (180 / Math.PI) * e * sinDeg(M) * (1 + e * cosDeg(M));
  const x = cosDeg(E) - e;
  const y = Math.sqrt(1 - e * e) * sinDeg(E);
  const v = atan2Deg(y, x);
  const r = Math.sqrt(x * x + y * y);
  const lon = normalizeAngle(v + w);

  const xEcl = r * (cosDeg(N) * cosDeg(lon) - sinDeg(N) * sinDeg(lon) * cosDeg(i));
  const yEcl = r * (sinDeg(N) * cosDeg(lon) + cosDeg(N) * sinDeg(lon) * cosDeg(i));
  let moonLongitude = normalizeAngle(atan2Deg(yEcl, xEcl));

  const sunLongitude = getSunLongitude(jd);
  const sunMeanAnomaly = normalizeAngle(356.0470 + 0.9856002585 * d);
  const moonMeanLongitude = normalizeAngle(N + w + M);
  const D = normalizeAngle(moonMeanLongitude - sunLongitude);
  const F = normalizeAngle(moonMeanLongitude - N);

  moonLongitude +=
    -1.274 * sinDeg(M - 2 * D) +
    0.658 * sinDeg(2 * D) +
    -0.186 * sinDeg(sunMeanAnomaly) +
    -0.059 * sinDeg(2 * M - 2 * D) +
    -0.057 * sinDeg(M - 2 * D + sunMeanAnomaly) +
    0.053 * sinDeg(M + 2 * D) +
    0.046 * sinDeg(2 * D - sunMeanAnomaly) +
    0.041 * sinDeg(M - sunMeanAnomaly) +
    -0.035 * sinDeg(D) +
    -0.031 * sinDeg(M + sunMeanAnomaly) +
    -0.015 * sinDeg(2 * F - 2 * D) +
    0.011 * sinDeg(M - 4 * D);

  return normalizeAngle(moonLongitude);
}

function getAscLongitude({ year, month, day, hour = 12, minute = 0, latitude, longitude, timezone = DEFAULT_TIMEZONE }) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const jd = toJulianDay(year, month, day, hour, minute, timezone);
  const T = (jd - 2451545.0) / 36525;
  const epsilon = 23.439291 - 0.0130042 * T;
  const gmst = normalizeAngle(
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000
  );
  const lst = normalizeAngle(gmst + longitude);
  const lstRad = lst * DEG;
  const latRad = latitude * DEG;
  const epsRad = epsilon * DEG;

  const ascRad = Math.atan2(
    -Math.cos(lstRad),
    Math.sin(lstRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad)
  );

  return normalizeAngle(ascRad / DEG);
}

export function getSun(a, b, c, d = 12, e = 0) {
  const { year, month, day, hour, minute } = resolveDateArgs(a, b, c, d, e);
  if (!year) return signByDate(month, day);
  return signByLongitude(getSunLongitude(toJulianDay(year, month, day, hour, minute)));
}

export function getMoon(year, month, day, hour = 12, minute = 0) {
  return signByLongitude(getMoonLongitude(toJulianDay(year, month, day, hour, minute)));
}

export function getAsc(input) {
  if (!input || typeof input !== "object") return null;
  const longitude = getAscLongitude(input);
  return longitude == null ? null : signByLongitude(longitude);
}

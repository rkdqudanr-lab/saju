// 일진 테스트: node test-iljin.mjs
// 2026년 3월 19일 일진 확인

const CG = ["갑","을","병","정","무","기","경","신","임","계"];
const JJ = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
const CGH = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const JJH = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const CGO = ["목","목","화","화","토","토","금","금","수","수"];

const GAPJA_60 = [
  '甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉',
  '甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未',
  '甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳',
  '甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯',
  '甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑',
  '甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥',
];

const ILGAN_ENERGY = { 갑:5,을:4,병:4,정:3,무:3,기:2,경:2,신:1,임:2,계:1 };

function getDailyInfo(date) {
  const y = date.getFullYear(), m = date.getMonth()+1, d = date.getDate();
  // 만세력 기준 에포크 보정: 1900-01-01 실제 일진 = 甲戌(index 10), +10 오프셋 적용
  const df = Math.floor((new Date(y,m-1,d) - new Date(1900,0,1)) / 86400000) + 10;
  const ig = (df % 10 + 10) % 10;
  const ij = (df % 12 + 12) % 12;
  const idx60 = ((df % 60) + 60) % 60;
  return {
    iljin: GAPJA_60[idx60],
    cheongan: CG[ig],
    jiji: JJ[ij],
    ohaeng: CGO[ig],
    energy: ILGAN_ENERGY[CG[ig]] || 3,
  };
}

// 테스트 날짜들
const testDates = [
  new Date(1900, 0, 1),   // 1900-01-01 → 甲子(갑자) 기대
  new Date(2026, 2, 19),  // 2026-03-19 → ?
  new Date(2026, 0, 1),   // 2026-01-01
  new Date(2025, 11, 31), // 2025-12-31
];

for (const date of testDates) {
  const info = getDailyInfo(date);
  console.log(`${date.toISOString().slice(0,10)}: ${info.iljin} (${info.cheongan}${info.jiji}) | 오행:${info.ohaeng} | 에너지:${info.energy}`);
}

// 기대값 검증
const ref = getDailyInfo(new Date(1900, 0, 1));
console.log('\n=== 검증 ===');
// 만세력 기준: 1900-01-01 = 甲戌 (과거 코드의 甲子 가정은 오류였음)
console.log(`1900-01-01 일진: ${ref.iljin} (기대: 甲戌) → ${ref.iljin === '甲戌' ? '✅ 정확' : '❌ 오류'}`);

// 만세력 교차 검증: 1991-08-31 = 癸酉
const test1991 = getDailyInfo(new Date(1991, 7, 31));
console.log(`1991-08-31 일진: ${test1991.iljin} (기대: 癸酉) → ${test1991.iljin === '癸酉' ? '✅ 정확' : '❌ 오류'}`);

// 1991-09-08 (백로 당일) 일진 확인
const test1991Sep8 = getDailyInfo(new Date(1991, 8, 8));
console.log(`1991-09-08 일진: ${test1991Sep8.iljin} (${test1991Sep8.cheongan}${test1991Sep8.jiji})`);

const mar19 = getDailyInfo(new Date(2026, 2, 19));
console.log(`2026-03-19 일진: ${mar19.iljin} (${mar19.cheongan}${mar19.jiji}) | 오행: ${mar19.ohaeng} | 에너지: ${mar19.energy}`);

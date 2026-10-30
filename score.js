// 분위기 점수와 칭호 계산. 입력은 getMochiState()의 반환값.

const clamp01 = (v) => Math.max(0, Math.min(1, v));

const TITLES = [
  { min: 75, title: '고급 디저트' },
  { min: 45, title: '평범한 떡' },
  { min: 25, title: '수상한 떡' },
  { min: 0, title: '쓰레기통의 맛' },
];

export function calcScore(mochiState) {
  const { sweet = 0, sour = 0, weird = 0, fruitKinds = 0 } = mochiState || {};

  // 과일 종류가 다양하면 가산 (4종류에서 만점)
  const variety = clamp01(fruitKinds / 4);

  // 단맛과 새콤이 비슷할수록 가산
  const fruitTaste = sweet + sour;
  const balance = fruitTaste > 0 ? 1 - Math.abs(sweet - sour) / fruitTaste : 0;

  // 이상함 비율이 높을수록 감점
  const total = fruitTaste + weird;
  const weirdRatio = total > 0 ? weird / total : 0;

  const score = Math.round(35 * variety + 25 * balance + 40 * (1 - weirdRatio));
  const title = TITLES.find((t) => score >= t.min).title;
  return { score, title };
}

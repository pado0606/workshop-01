// 재료 데이터. 재료 목록과 수치는 여기 한 곳에만 둔다.
// 수치는 0~10 기준: 높음 8, 중간 5, 없음 0

export const ITEM_TYPES = [
  // 과일: 단맛 높음, 새콤 중간, 이상함 0
  { id: 'strawberry', name: '딸기', kind: 'fruit', color: '#e63950', sweet: 8, sour: 5, weird: 0 },
  { id: 'blueberry', name: '블루베리', kind: 'fruit', color: '#4a5fb5', sweet: 8, sour: 5, weird: 0 },
  { id: 'kiwi', name: '키위', kind: 'fruit', color: '#8ac34a', sweet: 8, sour: 5, weird: 0 },
  { id: 'mango', name: '망고', kind: 'fruit', color: '#ffb627', sweet: 8, sour: 5, weird: 0 },

  // 쓰레기: 칙칙한 색, 단맛 0, 새콤 0, 이상함 높음
  { id: 'can', name: '캔', kind: 'trash', color: '#8a8d91', sweet: 0, sour: 0, weird: 8 },
  { id: 'sock', name: '양말', kind: 'trash', color: '#9c8f7a', sweet: 0, sour: 0, weird: 8 },
  { id: 'fishbone', name: '생선뼈', kind: 'trash', color: '#b8b2a0', sweet: 0, sour: 0, weird: 8 },
  { id: 'newspaper', name: '신문지', kind: 'trash', color: '#a39e93', sweet: 0, sour: 0, weird: 8 },
];

// 떨어지는 재료. 좌표는 캔버스 픽셀(1280x720).
const W = 1280;
const H = 720;
const ITEM_RADIUS = 36;
const SPAWN_INTERVAL = 0.8;   // 초
const FALL_SPEED_MIN = 140;   // 픽셀/초
const FALL_SPEED_MAX = 260;
const FRUIT_CHANCE = 0.6;     // 새로 나올 재료가 과일일 확률
const MOUTH_RADIUS = 40;      // 입이 재료와 닿았다고 보는 범위

let items = [];
let spawnTimer = 0;

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function spawnItem() {
  const wantFruit = Math.random() < FRUIT_CHANCE;
  const type = pick(ITEM_TYPES.filter((t) => (t.kind === 'fruit') === wantFruit));
  items.push({
    type,
    x: ITEM_RADIUS + Math.random() * (W - ITEM_RADIUS * 2),
    y: -ITEM_RADIUS,
    vy: FALL_SPEED_MIN + Math.random() * (FALL_SPEED_MAX - FALL_SPEED_MIN),
  });
}

export function resetItems() {
  items = [];
  spawnTimer = 0;
}

export function updateItems(dt) {
  spawnTimer -= dt;
  while (spawnTimer <= 0) {
    spawnItem();
    spawnTimer += SPAWN_INTERVAL;
  }

  for (const item of items) item.y += item.vy * dt;
  // 바닥 아래로 완전히 나가면 사라진다.
  items = items.filter((item) => item.y - ITEM_RADIUS <= H);
}

// 입이 열려 있을 때 입과 겹친 재료를 지우고, 먹힌 재료(ITEM_TYPES 항목)를 배열로 돌려준다.
export function eatItems(mouth) {
  if (!mouth || !mouth.open) return [];
  const reach = ITEM_RADIUS + MOUTH_RADIUS;
  const eaten = [];
  items = items.filter((item) => {
    const touching = Math.hypot(item.x - mouth.x, item.y - mouth.y) <= reach;
    if (touching) eaten.push(item.type);
    return !touching;
  });
  return eaten;
}

export function drawItems(ctx) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 16px sans-serif';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#5a3d5c';
  for (const item of items) {
    ctx.beginPath();
    ctx.arc(item.x, item.y, ITEM_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = item.type.color;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(item.type.name, item.x, item.y);
  }
  ctx.restore();
}

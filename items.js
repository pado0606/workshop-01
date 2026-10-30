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
    tilt: (Math.random() - 0.5) * 0.8, // 그림을 살짝 기울여서 똑같아 보이지 않게
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

const OUTLINE = '#5a3d5c';

// 재료 그림. 모두 (0, 0)이 중심이고 반지름 ITEM_RADIUS 안에 들어오게 그린다.
// 바탕색은 ITEM_TYPES의 color를 그대로 쓴다.
function fillStroke(ctx, fill) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.stroke();
}

function dots(ctx, fill, list, r) {
  ctx.fillStyle = fill;
  for (const [x, y] of list) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function polygon(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
}

const ART = {
  strawberry(ctx, color) {
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.bezierCurveTo(32, -30, 36, 2, 0, 32);
    ctx.bezierCurveTo(-36, 2, -32, -30, 0, -24);
    fillStroke(ctx, color);
    dots(ctx, '#ffe08a', [[-10, -6], [9, -8], [0, 3], [-12, 11], [11, 7], [0, 18]], 2.2);
    polygon(ctx, [[-16, -22], [-8, -32], [-3, -24], [0, -34], [3, -24], [8, -32], [16, -22], [0, -17]]);
    fillStroke(ctx, '#3f9b4a');
  },

  blueberry(ctx, color) {
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    fillStroke(ctx, color);
    const star = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? 10 : 4.5;
      star.push([Math.cos(a) * r, -4 + Math.sin(a) * r]);
    }
    polygon(ctx, star);
    fillStroke(ctx, '#2c356f');
    ctx.beginPath();
    ctx.ellipse(-12, -14, 7, 4, -0.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fill();
  },

  kiwi(ctx, color) {
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    fillStroke(ctx, '#8a6a3b');
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    fillStroke(ctx, color);
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f0f7cf';
    ctx.fill();
    const seeds = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      seeds.push([Math.cos(a) * 15, Math.sin(a) * 13]);
    }
    dots(ctx, '#2b2b2b', seeds, 1.8);
  },

  mango(ctx, color) {
    ctx.save();
    ctx.rotate(-0.5);
    ctx.beginPath();
    ctx.ellipse(0, 2, 22, 29, 0, 0, Math.PI * 2);
    fillStroke(ctx, color);
    ctx.beginPath();
    ctx.ellipse(7, 8, 13, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 106, 61, 0.55)';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(5, -30, 9, 4, -0.5, 0, Math.PI * 2);
    fillStroke(ctx, '#3f9b4a');
    ctx.restore();
  },

  can(ctx, color) {
    ctx.beginPath();
    ctx.ellipse(0, 22, 18, 6, 0, 0, Math.PI * 2);
    fillStroke(ctx, color);
    ctx.fillStyle = color;
    ctx.fillRect(-18, -22, 36, 44);
    ctx.beginPath();
    ctx.moveTo(-18, -22);
    ctx.lineTo(-18, 22);
    ctx.moveTo(18, -22);
    ctx.lineTo(18, 22);
    ctx.stroke();
    ctx.fillStyle = '#a8625a';
    ctx.fillRect(-18, -6, 36, 16);
    ctx.strokeRect(-18, -6, 36, 16);
    ctx.beginPath();
    ctx.ellipse(0, -22, 18, 6, 0, 0, Math.PI * 2);
    fillStroke(ctx, '#c4c7cb');
    ctx.beginPath();
    ctx.ellipse(3, -22, 6, 2.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-11, -14);
    ctx.lineTo(-11, 16);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.stroke();
  },

  sock(ctx, color) {
    ctx.translate(-8, 0);
    ctx.beginPath();
    ctx.moveTo(-12, -30);
    ctx.lineTo(12, -30);
    ctx.lineTo(12, 4);
    ctx.quadraticCurveTo(34, 6, 34, 20);
    ctx.quadraticCurveTo(34, 30, 22, 30);
    ctx.lineTo(-6, 30);
    ctx.quadraticCurveTo(-16, 30, -13, 16);
    ctx.closePath();
    fillStroke(ctx, color);
    ctx.fillStyle = '#d8d2c2';
    ctx.fillRect(-12, -30, 24, 9);
    ctx.strokeRect(-12, -30, 24, 9);
    ctx.save();
    ctx.strokeStyle = '#7c705c';
    ctx.lineWidth = 2;
    for (const y of [-12, -4]) {
      ctx.beginPath();
      ctx.moveTo(-12, y);
      ctx.lineTo(12, y);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#7c705c';
    ctx.fillRect(18, 18, 10, 8);
  },

  fishbone(ctx, color) {
    // 윤곽색으로 굵게 한 번, 뼈 색으로 가늘게 한 번 그려서 테두리를 만든다.
    const lines = (width, stroke) => {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(20, 0);
      for (let i = 0; i < 5; i++) {
        const x = -12 + i * 7;
        ctx.moveTo(x, 0);
        ctx.lineTo(x - 5, -15);
        ctx.moveTo(x, 0);
        ctx.lineTo(x - 5, 15);
      }
      ctx.stroke();
    };
    lines(9, OUTLINE);
    ctx.lineWidth = 3;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = OUTLINE;
    polygon(ctx, [[20, 0], [32, -12], [32, 12]]);
    fillStroke(ctx, color);
    ctx.beginPath();
    ctx.ellipse(-26, 0, 9, 8, 0, 0, Math.PI * 2);
    fillStroke(ctx, color);
    lines(5, color);
    dots(ctx, OUTLINE, [[-29, -2]], 2);
  },

  newspaper(ctx, color) {
    ctx.rotate(-0.15);
    ctx.beginPath();
    ctx.rect(-21, -25, 42, 50);
    fillStroke(ctx, color);
    ctx.fillStyle = '#4a4640';
    ctx.fillRect(-16, -20, 32, 8);
    ctx.fillStyle = '#7d7970';
    ctx.fillRect(-16, -6, 13, 12);
    ctx.save();
    ctx.strokeStyle = '#6e6a62';
    ctx.lineWidth = 2;
    for (const [x1, x2, y] of [[0, 16, -4], [0, 16, 2], [-16, 16, 10], [-16, 16, 15], [-16, 7, 20]]) {
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }
    ctx.restore();
  },
};

export function drawItems(ctx) {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE;
  for (const item of items) {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.tilt);
    ctx.lineWidth = 3;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = OUTLINE;
    ART[item.type.id](ctx, item.type.color);
    ctx.restore();
  }
  ctx.restore();
}

// 찹쌀떡: 스프링 점 윤곽선. 점마다 제자리로 돌아오려는 힘과 이웃 점과 당기는 힘이 있어서 말랑하게 출렁인다.

const POINT_COUNT = 32;
const RADIUS = 130;

const HOME_STIFFNESS = 90;     // 제자리로 돌아오는 힘
const NEIGHBOR_STIFFNESS = 60; // 이웃 점과 평균을 맞추려는 힘
const DAMPING = 10;            // 클수록 빨리 가라앉는다
const IDLE_WOBBLE = 1100;      // 가만히 있어도 살짝 출렁이게 하는 힘
const START_KICK = 420;        // 처음 나타날 때 한 번 출렁이는 세기
const GRAB_RANGE = 110;        // 핀치한 손과 윤곽선 점이 이만큼 가까우면 잡힌다
const MAX_STRETCH = 260;       // 잡은 점이 제자리에서 이보다 더 멀리 끌려가지 않는다

const points = [];
let cx = 0;
let cy = 0;
let clock = 0;
let grabbed = null; // 잡힌 점 (없으면 null)
let grabTarget = { x: 0, y: 0 }; // 잡은 점이 따라갈 위치 (떡 중심 기준)

// 색은 하얀 요거트(무게 1)에 먹은 재료 색을 하나씩 더해서 평균을 낸다.
const BASE_RGB = [255, 255, 255];
let rgbSum = [...BASE_RGB];
let colorWeight = 1;
let sweet = 0;
let sour = 0;
let weird = 0;
let fruitIds = new Set();

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function currentColor() {
  return rgbToHex(rgbSum.map((v) => v / colorWeight));
}

export function resetMochi(x, y) {
  cx = x;
  cy = y;
  clock = 0;
  grabbed = null;
  rgbSum = [...BASE_RGB];
  colorWeight = 1;
  sweet = 0;
  sour = 0;
  weird = 0;
  fruitIds = new Set();
  points.length = 0;
  for (let i = 0; i < POINT_COUNT; i++) {
    const angle = (i / POINT_COUNT) * Math.PI * 2;
    const homeX = Math.cos(angle) * RADIUS;
    const homeY = Math.sin(angle) * RADIUS;
    // 위에서 눌린 모양으로 시작해서 퐁 하고 되살아나게 한다.
    points.push({
      angle,
      homeX,
      homeY,
      x: homeX * 1.15,
      y: homeY * 0.7,
      vx: 0,
      vy: -START_KICK * Math.sin(angle) * 0.2,
    });
  }
}

export function addIngredient(item) {
  const rgb = hexToRgb(item.color);
  for (let i = 0; i < 3; i++) rgbSum[i] += rgb[i];
  colorWeight += 1;
  sweet += item.sweet;
  sour += item.sour;
  weird += item.weird;
  if (item.kind === 'fruit') fruitIds.add(item.id);
}

export function getMochiState() {
  return { color: currentColor(), sweet, sour, weird, fruitKinds: fruitIds.size };
}

// hand: { x, y, pinch } | null. 핀치하면 가까운 점을 잡고, 놓거나 손이 사라지면 놓는다.
export function updateMochi(dt, hand) {
  if (points.length === 0) return;
  clock += dt;
  updateGrab(hand);

  // 한 번에 큰 시간이 들어와도 터지지 않게 잘게 나눠서 계산한다.
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / steps;
  for (let s = 0; s < steps; s++) step(h);
}

function updateGrab(hand) {
  if (!hand || !hand.pinch) {
    grabbed = null;
    return;
  }
  const hx = hand.x - cx;
  const hy = hand.y - cy;

  if (!grabbed) {
    let best = null;
    let bestDist = GRAB_RANGE;
    for (const p of points) {
      const d = Math.hypot(p.x - hx, p.y - hy);
      if (d <= bestDist) {
        best = p;
        bestDist = d;
      }
    }
    grabbed = best;
  }
  if (!grabbed) return;

  // 너무 멀리 늘어나지 않게, 제자리에서 MAX_STRETCH까지만 따라간다.
  let dx = hx - grabbed.homeX;
  let dy = hy - grabbed.homeY;
  const len = Math.hypot(dx, dy);
  if (len > MAX_STRETCH) {
    dx = (dx / len) * MAX_STRETCH;
    dy = (dy / len) * MAX_STRETCH;
  }
  grabTarget = { x: grabbed.homeX + dx, y: grabbed.homeY + dy };
}

function step(h) {
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const prev = points[(i + n - 1) % n];
    const next = points[(i + 1) % n];

    let fx = (p.homeX - p.x) * HOME_STIFFNESS;
    let fy = (p.homeY - p.y) * HOME_STIFFNESS;

    fx += ((prev.x + next.x) / 2 - p.x) * NEIGHBOR_STIFFNESS;
    fy += ((prev.y + next.y) / 2 - p.y) * NEIGHBOR_STIFFNESS;

    // 윤곽선을 따라 도는 물결 모양 힘
    const wave = Math.sin(clock * 2.4 + p.angle * 2);
    fx += Math.cos(p.angle) * wave * IDLE_WOBBLE;
    fy += Math.sin(p.angle) * wave * IDLE_WOBBLE;

    p.vx += fx * h;
    p.vy += fy * h;
    p.vx *= Math.max(0, 1 - DAMPING * h);
    p.vy *= Math.max(0, 1 - DAMPING * h);
  }
  for (const p of points) {
    if (p === grabbed) {
      p.x = grabTarget.x;
      p.y = grabTarget.y;
      p.vx = 0;
      p.vy = 0;
    } else {
      p.x += p.vx * h;
      p.y += p.vy * h;
    }
  }
}

export function drawMochi(ctx) {
  const n = points.length;
  if (n === 0) return;

  ctx.save();
  ctx.translate(cx, cy);

  // 점들의 중간 지점을 이어서 부드러운 닫힌 곡선을 만든다.
  ctx.beginPath();
  const first = mid(points[n - 1], points[0]);
  ctx.moveTo(first.x, first.y);
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const m = mid(p, points[(i + 1) % n]);
    ctx.quadraticCurveTo(p.x, p.y, m.x, m.y);
  }
  ctx.closePath();

  ctx.fillStyle = currentColor();
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#5a3d5c';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // 말랑해 보이게 위쪽에 작은 하이라이트
  ctx.beginPath();
  ctx.ellipse(-RADIUS * 0.35, -RADIUS * 0.45, RADIUS * 0.22, RADIUS * 0.1, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fill();

  ctx.restore();
}

function mid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

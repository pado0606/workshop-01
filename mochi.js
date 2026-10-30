// 찹쌀떡: 스프링 점 윤곽선. 점마다 제자리로 돌아오려는 힘과 이웃 점과 당기는 힘이 있어서 말랑하게 출렁인다.

const POINT_COUNT = 32;
const RADIUS = 130;

const HOME_STIFFNESS = 90;     // 제자리로 돌아오는 힘
const NEIGHBOR_STIFFNESS = 60; // 이웃 점과 평균을 맞추려는 힘
const DAMPING = 3.2;           // 클수록 빨리 가라앉는다
const IDLE_WOBBLE = 800;       // 가만히 있어도 살짝 출렁이게 하는 힘
const START_KICK = 420;        // 처음 나타날 때 한 번 출렁이는 세기

const points = [];
let cx = 0;
let cy = 0;
let clock = 0;

export function resetMochi(x, y) {
  cx = x;
  cy = y;
  clock = 0;
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

// hand는 이후 이슈(잡아서 늘리기)에서 쓴다. 지금은 받기만 한다.
export function updateMochi(dt, hand) {
  if (points.length === 0) return;
  clock += dt;

  // 한 번에 큰 시간이 들어와도 터지지 않게 잘게 나눠서 계산한다.
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / steps;
  for (let s = 0; s < steps; s++) step(h);
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
    p.x += p.vx * h;
    p.y += p.vy * h;
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

  ctx.fillStyle = '#ffffff';
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

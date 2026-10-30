// 임시 입력: 마우스로 얼굴(입)과 손(핀치)을 흉내 낸다. 개발용.
// 마우스 위치 = mouth, hand 좌표 / 좌클릭 누름 = hand.pinch / 스페이스 = mouth.open
// 좌표는 캔버스 픽셀(1280x720) 기준이다.

const W = 1280;
const H = 720;

let pos = { x: W / 2, y: H / 2 };
let pinch = false;
let open = false;
let started = false;

function toCanvas(e) {
  const canvas = document.getElementById('game');
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) * W) / rect.width,
    y: ((e.clientY - rect.top) * H) / rect.height,
  };
}

export async function initInput(videoEl) {
  if (started) return;
  started = true;

  window.addEventListener('mousemove', (e) => {
    pos = toCanvas(e);
  });
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) pinch = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) pinch = false;
  });
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    e.preventDefault();
    open = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.code !== 'Space') return;
    e.preventDefault();
    open = false;
  });
  // 창을 벗어나면 눌린 상태가 남지 않게 푼다.
  window.addEventListener('blur', () => {
    pinch = false;
    open = false;
  });
}

export function getInput() {
  return {
    mouth: { x: pos.x, y: pos.y, open },
    hand: { x: pos.x, y: pos.y, pinch },
  };
}

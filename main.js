import { initInput, getInput } from './input.js';
import { resetItems, updateItems, drawItems, eatItems } from './items.js';
import {
  resetMochi, addIngredient, updateMochi, drawMochi, isMochiEaten, getMochiState,
} from './mochi.js';
import { calcScore } from './score.js';

const W = 1280;
const H = 720;
const COLLECT_SECONDS = 60;
const MAKE_SECONDS = 30;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const video = document.getElementById('cam');
const hud = document.getElementById('hud');
const hudPhase = document.getElementById('hud-phase');
const hudTimer = document.getElementById('hud-timer');
const screenStart = document.getElementById('screen-start');
const screenResult = document.getElementById('screen-result');
const btnStart = document.getElementById('btn-start');
const btnRetry = document.getElementById('btn-retry');
const startStatus = document.getElementById('start-status');
const resultTitle = document.getElementById('result-title');
const resultScore = document.getElementById('result-score');

// 화면 상태: 'start' | 'collect' | 'make' | 'result'
let state = 'start';
let timeLeft = 0;
let cameraReady = false;
let lastTime = performance.now();

function show(el, visible) {
  el.classList.toggle('hidden', !visible);
}

function setState(next) {
  state = next;
  show(screenStart, next === 'start');
  show(screenResult, next === 'result');
  show(hud, next === 'collect' || next === 'make');

  if (next === 'collect') {
    resetItems();
    resetMochi(W / 2, H / 2);
    timeLeft = COLLECT_SECONDS;
    hudPhase.textContent = '재료를 먹어요!';
  } else if (next === 'make') {
    // 찹쌀떡은 리셋하지 않는다. 모으기에서 쌓인 재료를 그대로 쓴다.
    resetItems();
    timeLeft = MAKE_SECONDS;
    hudPhase.textContent = '떡을 만져서 먹어요!';
  } else if (next === 'result') {
    const { score, title } = calcScore(getMochiState());
    resultTitle.textContent = title;
    resultScore.textContent = `분위기 점수 ${score}점`;
  }
}

// 시작: 카메라 권한 요청 후 얼굴과 손이 모두 잡히면 다음으로
async function startGame() {
  btnStart.disabled = true;
  startStatus.textContent = '카메라를 켜는 중...';
  try {
    if (!cameraReady) {
      await initInput(video);
      cameraReady = true;
    }
  } catch (err) {
    startStatus.textContent = '카메라를 켤 수 없어요. 권한을 확인해 주세요.';
    btnStart.disabled = false;
    return;
  }
  startStatus.textContent = '얼굴과 손을 화면에 보여 주세요.';
  waitForDetection();
}

function waitForDetection() {
  if (state !== 'start') return;
  const { mouth, hand } = getInput();
  if (mouth && hand) {
    btnStart.disabled = false;
    startStatus.textContent = '';
    setState('collect');
    return;
  }
  requestAnimationFrame(waitForDetection);
}

// 카메라 화면을 거울처럼 흐릿하게 깔아서 위치를 가늠하게 한다.
function drawBackground() {
  ctx.fillStyle = '#fdf3ea';
  ctx.fillRect(0, 0, W, H);
  if (cameraReady && video.readyState >= 2) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, W, H);
    ctx.restore();
  }
}

function drawColorPreview() {
  const { color } = getMochiState();
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#5a3d5c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(W - 90, 100, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5a3d5c';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('지금 떡 색', W - 90, 175);
  ctx.restore();
}

function update(dt) {
  if (state !== 'collect' && state !== 'make') return;

  const { mouth, hand } = getInput();
  timeLeft -= dt;
  hudTimer.textContent = `${Math.max(0, Math.ceil(timeLeft))}초`;

  if (state === 'collect') {
    updateItems(dt);
    for (const item of eatItems(mouth)) addIngredient(item);
    updateMochi(dt, null);
    if (timeLeft <= 0) setState('make');
  } else {
    updateMochi(dt, hand);
    if (isMochiEaten(mouth) || timeLeft <= 0) setState('result');
  }
}

function draw() {
  drawBackground();
  if (state === 'collect') {
    drawItems(ctx);
    drawColorPreview();
  }
  if (state === 'make' || state === 'result') {
    drawMochi(ctx);
  }
}

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

btnStart.addEventListener('click', startGame);
btnRetry.addEventListener('click', () => setState('start'));

setState('start');
requestAnimationFrame(loop);

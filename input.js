// 카메라를 켜고, 얼굴(입)과 손(핀치) 입력을 돌려준다.
// 입은 MediaPipe Face Landmarker로 인식한다.
// 손은 아직 마우스로 흉내 내는 임시 입력이다. (개발용)
// 마우스 위치 = hand 좌표 / 좌클릭 누름 = hand.pinch
// 좌표는 캔버스 픽셀(1280x720) 기준이고, 카메라 화면은 거울처럼 좌우를 뒤집는다.

const W = 1280;
const H = 720;

const MP_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35';
const FACE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// 입 벌림 임계값: (안쪽 윗입술~아랫입술 거리) / (이마~턱 거리). 넘으면 open.
const MOUTH_OPEN_RATIO = 0.06;

// Face Landmarker 랜드마크 번호
const LIP_UPPER = 13;
const LIP_LOWER = 14;
const FACE_TOP = 10;
const FACE_CHIN = 152;

let pos = { x: W / 2, y: H / 2 };
let pinch = false;
let mouth = null;
let listening = false;
let cameraOn = false;
let faceLandmarker = null;
let detecting = false;

// 카메라를 켜서 videoEl에 연결한다. 권한을 거부하면 throw한다.
async function startCamera(videoEl) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('이 브라우저는 카메라를 지원하지 않아요.');
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: W, height: H, facingMode: 'user' },
    audio: false,
  });
  videoEl.srcObject = stream;
  try {
    await videoEl.play();
  } catch (err) {
    stream.getTracks().forEach((t) => t.stop());
    videoEl.srcObject = null;
    throw err;
  }
  cameraOn = true;
}

// MediaPipe Face Landmarker를 불러온다. GPU가 안 되면 CPU로 다시 시도한다.
async function loadFaceLandmarker() {
  const { FilesetResolver, FaceLandmarker } = await import(`${MP_URL}/vision_bundle.mjs`);
  const fileset = await FilesetResolver.forVisionTasks(`${MP_URL}/wasm`);
  const make = (delegate) =>
    FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate },
      runningMode: 'VIDEO',
      numFaces: 1,
    });
  try {
    return await make('GPU');
  } catch {
    return make('CPU');
  }
}

// 랜드마크(0~1)에서 입 위치와 벌림을 구한다. 거리는 영상 픽셀 비율로 잰다.
function mouthFrom(landmarks, vw, vh) {
  const dist = (a, b) => Math.hypot((a.x - b.x) * vw, (a.y - b.y) * vh);
  const upper = landmarks[LIP_UPPER];
  const lower = landmarks[LIP_LOWER];
  const faceHeight = dist(landmarks[FACE_TOP], landmarks[FACE_CHIN]);
  return {
    x: (1 - (upper.x + lower.x) / 2) * W,
    y: ((upper.y + lower.y) / 2) * H,
    open: faceHeight > 0 && dist(upper, lower) / faceHeight > MOUTH_OPEN_RATIO,
  };
}

// 영상 프레임이 바뀔 때마다 얼굴을 인식해서 mouth를 갱신한다.
function startDetecting(videoEl) {
  if (detecting) return;
  detecting = true;
  let lastTime = -1;
  const tick = () => {
    requestAnimationFrame(tick);
    if (videoEl.readyState < 2 || videoEl.currentTime === lastTime) return;
    lastTime = videoEl.currentTime;
    try {
      const result = faceLandmarker.detectForVideo(videoEl, performance.now());
      const landmarks = result.faceLandmarks?.[0];
      mouth = landmarks ? mouthFrom(landmarks, videoEl.videoWidth, videoEl.videoHeight) : null;
    } catch (err) {
      console.error('얼굴 인식 오류', err);
      mouth = null;
    }
  };
  tick();
}

function toCanvas(e) {
  const canvas = document.getElementById('game');
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) * W) / rect.width,
    y: ((e.clientY - rect.top) * H) / rect.height,
  };
}

export async function initInput(videoEl) {
  if (!listening) {
    listening = true;
    listenMouse();
  }
  if (!cameraOn) await startCamera(videoEl);
  if (!faceLandmarker) {
    try {
      faceLandmarker = await loadFaceLandmarker();
    } catch (err) {
      throw new Error('얼굴 인식을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.', { cause: err });
    }
  }
  startDetecting(videoEl);
}

// 개발용 임시 입력 (A4에서 진짜 손 인식으로 교체)
function listenMouse() {
  window.addEventListener('mousemove', (e) => {
    pos = toCanvas(e);
  });
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) pinch = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) pinch = false;
  });
  // 창을 벗어나면 눌린 상태가 남지 않게 푼다.
  window.addEventListener('blur', () => {
    pinch = false;
  });
}

export function getInput() {
  return {
    mouth,
    hand: { x: pos.x, y: pos.y, pinch },
  };
}

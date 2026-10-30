// 카메라를 켜고, 얼굴(입)과 손(핀치) 입력을 돌려준다.
// 입은 MediaPipe Face Landmarker, 손 위치는 Hand Landmarker로 인식한다.
// 핀치는 엄지와 검지 사이 거리로 판정한다. 마우스 좌클릭도 핀치로 친다. (개발용)
// 좌표는 캔버스 픽셀(1280x720) 기준이고, 카메라 화면은 거울처럼 좌우를 뒤집는다.

const W = 1280;
const H = 720;

const MP_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35';
const FACE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const HAND_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// 입 벌림 임계값: (안쪽 윗입술~아랫입술 거리) / (이마~턱 거리). 넘으면 open.
const MOUTH_OPEN_RATIO = 0.06;

// Face Landmarker 랜드마크 번호
const LIP_UPPER = 13;
const LIP_LOWER = 14;
const FACE_TOP = 10;
const FACE_CHIN = 152;

// Hand Landmarker 랜드마크 번호
const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;

// 핀치 임계값: (엄지~검지 끝 거리) / (손목~중지 뿌리 거리, 손바닥 길이).
// 시작과 끝을 다르게 둬서, 경계에서 값이 깜빡이지 않게 한다.
const PINCH_ON_RATIO = 0.3;
const PINCH_OFF_RATIO = 0.5;

let handPinch = false;
let mousePinch = false;
let mouth = null;
let hand = null;
let listening = false;
let cameraOn = false;
let faceLandmarker = null;
let handLandmarker = null;
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

// MediaPipe Face, Hand Landmarker를 불러온다. GPU가 안 되면 CPU로 다시 시도한다.
async function loadLandmarkers() {
  const { FilesetResolver, FaceLandmarker, HandLandmarker } = await import(
    `${MP_URL}/vision_bundle.mjs`
  );
  const fileset = await FilesetResolver.forVisionTasks(`${MP_URL}/wasm`);
  const make = async (Landmarker, modelAssetPath, extra) => {
    const create = (delegate) =>
      Landmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath, delegate },
        runningMode: 'VIDEO',
        ...extra,
      });
    try {
      return await create('GPU');
    } catch {
      return create('CPU');
    }
  };
  return Promise.all([
    make(FaceLandmarker, FACE_MODEL_URL, { numFaces: 1 }),
    make(HandLandmarker, HAND_MODEL_URL, { numHands: 1 }),
  ]);
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

// 엄지와 검지 끝의 중간 위치를 구한다.
function handFrom(landmarks) {
  const thumb = landmarks[THUMB_TIP];
  const index = landmarks[INDEX_TIP];
  return {
    x: (1 - (thumb.x + index.x) / 2) * W,
    y: ((thumb.y + index.y) / 2) * H,
  };
}

// 엄지와 검지를 집었는지 판정한다. 실제 크기(미터) 좌표를 손바닥 길이로 나눠서
// 손이 카메라에서 멀어져도 같은 기준으로 판정한다.
function pinchFrom(world, wasPinching) {
  if (!world) return false;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const palm = dist(world[WRIST], world[MIDDLE_MCP]);
  if (palm === 0) return false;
  const ratio = dist(world[THUMB_TIP], world[INDEX_TIP]) / palm;
  return ratio < (wasPinching ? PINCH_OFF_RATIO : PINCH_ON_RATIO);
}

// 영상 프레임이 바뀔 때마다 얼굴과 손을 인식해서 mouth, hand를 갱신한다.
// 한쪽이 오류가 나도 다른 쪽은 계속 인식한다.
function startDetecting(videoEl) {
  if (detecting) return;
  detecting = true;
  let lastTime = -1;
  const tick = () => {
    requestAnimationFrame(tick);
    if (videoEl.readyState < 2 || videoEl.currentTime === lastTime) return;
    lastTime = videoEl.currentTime;
    const now = performance.now();
    try {
      const face = faceLandmarker.detectForVideo(videoEl, now).faceLandmarks?.[0];
      mouth = face ? mouthFrom(face, videoEl.videoWidth, videoEl.videoHeight) : null;
    } catch (err) {
      console.error('얼굴 인식 오류', err);
      mouth = null;
    }
    try {
      const result = handLandmarker.detectForVideo(videoEl, now);
      const found = result.landmarks?.[0];
      hand = found ? handFrom(found) : null;
      handPinch = found ? pinchFrom(result.worldLandmarks?.[0], handPinch) : false;
    } catch (err) {
      console.error('손 인식 오류', err);
      hand = null;
      handPinch = false;
    }
  };
  tick();
}

export async function initInput(videoEl) {
  if (!listening) {
    listening = true;
    listenMouse();
  }
  if (!cameraOn) await startCamera(videoEl);
  if (!faceLandmarker || !handLandmarker) {
    try {
      [faceLandmarker, handLandmarker] = await loadLandmarkers();
    } catch (err) {
      throw new Error('얼굴과 손 인식을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.', {
        cause: err,
      });
    }
  }
  startDetecting(videoEl);
}

// 개발용 임시 핀치: 좌클릭을 누르고 있으면 핀치로 친다. (A6에서 정리)
function listenMouse() {
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) mousePinch = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mousePinch = false;
  });
  // 창을 벗어나면 눌린 상태가 남지 않게 푼다.
  window.addEventListener('blur', () => {
    mousePinch = false;
  });
}

export function getInput() {
  return {
    mouth,
    hand: hand ? { x: hand.x, y: hand.y, pinch: handPinch || mousePinch } : null,
  };
}

# SPEC: 말랑이 한정선

하늘에서 떨어지는 과일과 쓰레기를 **입을 벌려 먹고**, 먹은 재료로 만들어진 **과일 요거트 찹쌀떡**을 **손으로 쫀득하게 만지다가 집어서 먹는** 브라우저 게임.

## 팀

| 역할 | GitHub | 담당 |
| --- | --- | --- |
| Leader | pado0606 | 화면 흐름, HTML/CSS, 점수 계산, 통합, 이슈 관리 |
| Builder | sohyeon111 | 카메라 입력 (얼굴 + 손 인식) |
| Builder | youngseo1ee | 낙하물, 찰쌀떡(스프링 물리와 렌더) |

## 규모 점검 (140분)

그대로 다 만들면 140분에는 빠듯해서 아래처럼 줄였어요.

- 입력은 **얼굴(입 열기)과 손(핀치)** 두 가지예요. 이게 가장 큰 위험 요소예요.
- 손 인식이 불안정할 때를 대비해 **마우스 대체 입력은 넣지 않기로** 했어요. 대신 `input.js`는 먼저 **마우스로 흉내 내는 임시 버전**으로 시작해요. 그래야 나머지 팀원이 카메라 없이도 개발할 수 있어요. 진짜 인식은 그 위에 교체해서 올려요.
- 레벨, 난이도, 멀티플레이, 저장은 뺐어요.
- 사운드는 시간이 남을 때만 해요.
- **90분 시점 체크:** 이때 손 핀치가 안 되면 "손 핀치 대신 얼굴로 먹기만" 으로 줄이기로 Leader가 결정해요.

## 기술 구성

- 순정 HTML/JS + Canvas, 빌드 없음 (`index.html`을 열면 동작)
- MediaPipe Tasks Vision (CDN): Face Landmarker, Hand Landmarker
- ES 모듈로 파일을 나눠요. 카메라 권한 때문에 `python3 -m http.server`로 열어요.
- 캔버스 크기는 1280x720으로 고정해요. 모든 좌표는 이 캔버스의 **픽셀**이에요.

## 게임 규칙

### 재료

| 종류 | 예시 | 색 | 단맛 | 새콤 | 이상함 |
| --- | --- | --- | --- | --- | --- |
| 과일 | 딸기, 블루베리, 키위, 망고 | 각자 다름 | 높음 | 중간 | 0 |
| 쓰레기 | 캔, 양말, 생선뼈, 신문지 | 칙칙한 색 | 0 | 0 | 높음 |

재료 목록과 수치는 `items.js`의 `ITEM_TYPES`에 한 곳에만 둬요.

### 찰쌀떡

- 기본은 하얀 요거트 찰쌀떡이에요.
- 먹은 재료의 색이 섞여서 찰쌀떡 색이 정해져요.
- 먹은 재료의 맛 수치(단맛, 새콤, 이상함)가 누적돼요.
- 손 핀치로 잡아서 늘리고 찌그러뜨릴 수 있고, 놓으면 쫀득하게 되돌아와요.
- 잡은 채로 입 위치까지 가져가서 입을 벌리면 먹어요.

### 점수 (분위기 점수)

- 점수는 `calcScore(mochiState)`(score.js)가 계산해요.
- 과일 종류가 다양하면 가산해요.
- 단맛과 새콤이 균형이 맞으면 가산해요.
- 이상함이 높으면 감점해요.
- 점수 구간에 따라 칭호를 붙여요: 고급 디저트 / 평범한 떡 / 수상한 떡 / 쓰레기통의 맛.

## 화면 흐름

1. **시작:** 제목과 "시작" 버튼이 나와요. 누르면 카메라 권한을 요청하고, 얼굴과 손이 잡히면 다음으로 가요.
2. **재료 모으기 (60초):** 재료가 떨어지고, 입을 벌려 입 위치에 닿은 재료를 먹어요. 화면 한쪽에 지금 찰쌀떡 색이 미리 보여요.
3. **만들고 먹기 (최대 30초):** 완성된 찰쌀떡이 화면 가운데에 나와요. 핀치로 만지고, 집어서 입에 가져가 먹으면 끝나요. 시간이 끝나도 끝나요.
4. **결과:** 찰쌀떡 모습, 점수, 칭호가 나와요. "다시 하기" 버튼이 있어요.

## 이번에 만들지 않을 것

- 레벨, 난이도 단계
- 멀티플레이, 점수 저장, 랭킹
- 마우스 등 손 인식 대체 입력 (개발용 임시 입력은 예외)
- 사운드는 후순위 (시간이 남을 때만)

## 파일과 주인 (한 파일에 주인은 한 명)

| 파일 | 주인 | 내용 |
| --- | --- | --- |
| `index.html`, `style.css` | pado0606 | 페이지, 캔버스, 화면 UI |
| `main.js` | pado0606 | 게임 루프, 화면 상태 전환, 모듈 연결 |
| `score.js` | pado0606 | 점수와 칭호 계산 |
| `input.js` | sohyeon111 | 카메라, 얼굴(입), 손(핀치) 인식 |
| `items.js` | youngseo1ee | 떨어지는 재료, 재료 데이터, 먹기 판정 |
| `mochi.js` | youngseo1ee | 찰쌀떡 스프링 점 윤곽선, 만지기, 색과 맛 누적, 렌더 |

## 서로 부르는 이름 (인터페이스)

모든 좌표는 캔버스 픽셀(1280x720)이고, 카메라 화면은 거울처럼 좌우를 뒤집어서 줘요.

### `input.js` (sohyeon111)

```js
export async function initInput(videoEl)   // 카메라 시작. 권한 거부 시 throw
export function getInput()
// 반환: {
//   mouth: { x, y, open } | null,        // 입 중심 위치, 입 벌림 여부
//   hand:  { x, y, pinch } | null        // 엄지와 검지 중간 위치, 핀치 여부
// }
```

### `items.js` (youngseo1ee)

```js
export const ITEM_TYPES                    // { id, name, kind:'fruit'|'trash', color, sweet, sour, weird }
export function resetItems()
export function updateItems(dt)            // dt: 초
export function drawItems(ctx)
export function eatItems(mouth)            // mouth: getInput().mouth. 먹힌 재료 배열 반환 (ITEM_TYPES 항목)
```

### `mochi.js` (youngseo1ee)

```js
export function resetMochi(x, y)
export function addIngredient(item)        // ITEM_TYPES 항목 하나를 반영
export function updateMochi(dt, hand)      // hand: getInput().hand
export function drawMochi(ctx)
export function isMochiEaten(mouth)        // 잡은 상태로 입에 닿고 입이 열렸는지
export function getMochiState()
// 반환: { color:'#rrggbb', sweet, sour, weird, fruitKinds }
```

### `score.js` (pado0606)

```js
export function calcScore(mochiState)      // 반환: { score, title }
```

## 이슈 작업 목록 (먼저 할 것부터)

### 시작 (병렬, 0~25분)

1. **[Leader] 뼈대 만들기:** `index.html`, `main.js`, 캔버스 1280x720, 화면 상태(시작/모으기/만들고먹기/결과) 전환. 빈 함수로 각 모듈을 연결해요.
2. **[sohyeon111] 임시 입력 `input.js`:** 마우스로 `getInput()`을 흉내 내요. (좌클릭 누름 = 핀치, 스페이스 = 입 열기) 다른 사람이 바로 쓸 수 있게 가장 먼저 푸시해요.
3. **[youngseo1ee] 재료 낙하 `items.js`:** `ITEM_TYPES` 데이터, 랜덤하게 떨어지고 그려지기. 재료 모양은 일단 색 원과 이름 글자로 해요.

### 핵심 (25~75분)

4. **[youngseo1ee] 먹기 판정:** `eatItems(mouth)`로 입이 열렸을 때 입 위치와 겹친 재료를 먹고 사라지게 해요.
5. **[youngseo1ee] 찰쌀떡 기본형 `mochi.js`:** 스프링 점 윤곽선을 그려서 말랑하게 출렁이게 해요.
6. **[sohyeon111] 진짜 얼굴 인식:** MediaPipe Face Landmarker로 입 위치와 입 벌림을 `getInput().mouth`에 연결해요.
7. **[Leader] 모으기 단계 연결:** 60초 타이머, 먹은 재료를 `addIngredient`로 넘기고, 찰쌀떡 색 미리보기를 보여줘요.

### 연결 (75~110분)

8. **[youngseo1ee] 색과 맛 누적:** `addIngredient`와 `getMochiState`를 구현해요.
9. **[sohyeon111] 진짜 손 인식:** MediaPipe Hand Landmarker로 손 위치와 핀치를 `getInput().hand`에 연결해요. **90분 체크 대상.**
10. **[youngseo1ee] 잡아서 늘리기:** 핀치로 윤곽선 점을 잡아당기고 놓으면 쫀득하게 복원돼요. 입에 닿으면 먹기(`isMochiEaten`)까지 해요.
11. **[Leader] 만들고 먹기 단계와 결과 화면:** `calcScore`, 칭호, 다시 하기를 만들어요.

### 마무리 (110~140분)

12. **[전원] 통합 테스트:** 처음부터 끝까지 한 판을 돌려보고 버그를 고쳐요.
13. **[전원] 다듬기:** 재료 그림, 효과, 문구를 다듬어요. (남는 시간에 사운드)
14. **[Leader] 배포 또는 시연 준비:** 실행 방법을 README에 적고 시연을 한 번 연습해요.

## 위험과 대비

| 위험 | 대비 |
| --- | --- |
| 손 핀치 인식이 불안정 | 90분 시점에 판단. 안 되면 얼굴로 먹기만 남기고, 찰쌀떡은 입 근처로 자동 이동해서 먹게 바꿔요. |
| 카메라 권한/환경 문제 | 임시 마우스 입력은 개발용으로만 남기고, 발표 환경에서 먼저 한 번 돌려봐요. |
| 한 사람의 일이 몰림 | youngseo1ee가 밀리면 `items.js`를 Leader가 가져가요. |

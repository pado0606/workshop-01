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

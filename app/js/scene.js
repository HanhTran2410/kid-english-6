// Tả tranh (SPEC-ta-tranh mục 4): hình học mũi tên + chọn câu khi chạm tranh. Hàm thuần, tính theo pixel của khung ảnh 4:3.

/** Hướng thân mũi tên nằm (mũi tên đi TỪ phía đó VÀO điểm). Thứ tự = thứ tự thử của `auto` (mục 4.2). */
export const DIRECTIONS = {
  right: [1, 0],
  left: [-1, 0],
  'top-right': [Math.SQRT1_2, -Math.SQRT1_2],
  'top-left': [-Math.SQRT1_2, -Math.SQRT1_2],
  'bottom-right': [Math.SQRT1_2, Math.SQRT1_2],
  'bottom-left': [-Math.SQRT1_2, Math.SQRT1_2],
  top: [0, -1],
  bottom: [0, 1],
};
export const FROM_VALUES = ['auto', ...Object.keys(DIRECTIONS)];

const MARGIN = 4;
export const HIT_DEFAULT = 0.08;
export const HIT_MIN = 0.04;
export const HIT_MAX = 0.2;
export const HIT_MIN_PX = 24;

/** Chiều dài mũi tên mong muốn: 18% cạnh ngắn, tối thiểu 48px. */
export const arrowLength = (box) => Math.max(48, 0.18 * Math.min(box.w, box.h));

/** Thân dài tối đa bao nhiêu theo hướng `d` mà vẫn nằm trong ảnh. */
function room(tip, [dx, dy], box) {
  const lim = [];
  if (dx > 0) lim.push((box.w - MARGIN - tip.x) / dx);
  if (dx < 0) lim.push((MARGIN - tip.x) / dx);
  if (dy > 0) lim.push((box.h - MARGIN - tip.y) / dy);
  if (dy < 0) lim.push((MARGIN - tip.y) / dy);
  return Math.max(0, Math.min(...lim));
}

/**
 * Mũi tên chỉ vào `point` (tỉ lệ 0–1 của ảnh) trong khung `box` (px). Hướng `from` không đủ chỗ (thân < 0,5 L) → `auto`:
 * hướng đầu tiên đủ chỗ cho L theo thứ tự DIRECTIONS, không có thì hướng nhiều chỗ nhất (SPEC-ta-tranh 4.2).
 * @returns {{ tip: {x,y}, tail: {x,y}, length: number, angle: number, from: string }} angle (độ) = hướng từ đuôi tới đầu
 */
export function arrowGeometry(point, from, box) {
  const tip = { x: point.x * box.w, y: point.y * box.h };
  const L = arrowLength(box);
  let dir = null;
  let len = 0;
  if (from && from !== 'auto' && DIRECTIONS[from]) {
    const r = room(tip, DIRECTIONS[from], box);
    if (r >= 0.5 * L) {
      dir = from;
      len = Math.min(L, r);
    }
  }
  if (!dir) {
    let best = null;
    for (const [name, d] of Object.entries(DIRECTIONS)) {
      const r = room(tip, d, box);
      if (r >= L) {
        best = { name, r };
        break;
      }
      if (!best || r > best.r) best = { name, r };
    }
    dir = best.name;
    len = Math.min(L, best.r);
  }
  const [dx, dy] = DIRECTIONS[dir];
  const tail = { x: tip.x + dx * len, y: tip.y + dy * len };
  const angle = (Math.atan2(tip.y - tail.y, tip.x - tail.x) * 180) / Math.PI;
  return { tip, tail, length: len, angle, from: dir };
}

/** Bán kính vùng chạm (px) của câu: `hit` (kẹp 0,04–0,2) × cạnh ngắn, tối thiểu 24px. */
export function hitRadius(sentence, box) {
  const hit = Math.min(HIT_MAX, Math.max(HIT_MIN, Number.isFinite(sentence.hit) ? sentence.hit : HIT_DEFAULT));
  return Math.max(HIT_MIN_PX, hit * Math.min(box.w, box.h));
}

/**
 * Chạm vào tranh tại `tap` (px trong khung) → chỉ số câu, −1 nếu ngoài mọi vùng (SPEC-ta-tranh 4.4):
 * nhiều vùng → câu có khoảng cách / bán kính nhỏ nhất; chênh < 0,05 coi như bằng → ưu tiên câu đang hiện, rồi câu đứng trước.
 */
export function pickSentence(sentences, tap, box, current = -1) {
  const hits = [];
  sentences.forEach((s, i) => {
    if (!s.point) return;
    const r = hitRadius(s, box);
    const d = Math.hypot(tap.x - s.point.x * box.w, tap.y - s.point.y * box.h);
    if (d <= r) hits.push({ i, score: d / r });
  });
  if (!hits.length) return -1;
  const best = Math.min(...hits.map((x) => x.score));
  const near = hits.filter((x) => x.score - best < 0.05);
  return near.find((x) => x.i === current)?.i ?? Math.min(...near.map((x) => x.i));
}

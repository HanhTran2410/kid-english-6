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

// ---------- Khung đối tượng (SPEC-ta-tranh mục 4.5): vùng chạm phủ trọn người / vật ----------
/** Nới khung mỗi phía (tỉ lệ cạnh ngắn) cho ngón tay bé; vùng chạm tối thiểu 48px mỗi chiều. */
export const BOX_PAD = 0.02;
export const BOX_MIN_PX = 48;
export const BOX_MIN = 0.03; // khung nhỏ nhất (tỉ lệ) khi bố mẹ / AI khoanh
/** Một câu có tối đa bao nhiêu khung (khung chính `box` + khung thêm `more`, ví dụ hai chùm bóng hai bên cửa sổ). */
export const MAX_BOXES = 4;
/** Mọi khung của câu: khung chính trước, rồi các khung thêm. */
export const boxesOf = (s) => (s?.box ? [s.box, ...(Array.isArray(s.more) ? s.more : [])] : []);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const r3 = (v) => Math.round(v * 1000) / 1000;

/** Chuẩn hóa khung {x, y, w, h} (tỉ lệ 0–1): kẹp trong ảnh, cạnh ≥ BOX_MIN. Sai dạng → null. */
export function normalizeBox(b) {
  if (!b || ![b.x, b.y, b.w, b.h].every((v) => typeof v === 'number' && Number.isFinite(v))) return null;
  const x = clamp01(b.x);
  const y = clamp01(b.y);
  const w = Math.max(BOX_MIN, Math.min(1 - x, b.w));
  const h = Math.max(BOX_MIN, Math.min(1 - y, b.h));
  return { x: r3(Math.min(x, 1 - w)), y: r3(Math.min(y, 1 - h)), w: r3(w), h: r3(h) };
}

/**
 * Mũi tên cho khung: thân nằm ở phía `side` (bố mẹ chọn), đầu mũi tên ở giữa cạnh khung phía đó (hướng chéo → góc khung).
 * Không chọn / "auto" → phía còn NHIỀU CHỖ TRỐNG nhất (tính theo khung ảnh 4:3). Mũi tên không đè lên đối tượng.
 * @returns {{ point: {x, y}, from: string }}
 */
export function arrowForBox(b, side = null) {
  if (!side || side === 'auto' || !DIRECTIONS[side]) {
    const room = { left: b.x * 4, right: (1 - b.x - b.w) * 4, top: b.y * 3, bottom: (1 - b.y - b.h) * 3 };
    side = Object.entries(room).sort((a, c) => c[1] - a[1])[0][0];
  }
  const [dx, dy] = DIRECTIONS[side];
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  const in1 = 0.01; // đầu mũi tên lấn vào trong khung một chút
  const x = sx > 0 ? b.x + b.w - in1 : sx < 0 ? b.x + in1 : b.x + b.w / 2;
  const y = sy > 0 ? b.y + b.h - in1 : sy < 0 ? b.y + in1 : b.y + b.h / 2;
  return { point: { x: r3(clamp01(x)), y: r3(clamp01(y)) }, from: side };
}

/** Vùng chạm hình chữ nhật (px) của một khung `b`: khung nới BOX_PAD, tối thiểu BOX_MIN_PX mỗi chiều. */
export function rectOf(b, box) {
  const pad = BOX_PAD * Math.min(box.w, box.h);
  const cx = (b.x + b.w / 2) * box.w;
  const cy = (b.y + b.h / 2) * box.h;
  const hw = Math.max(BOX_MIN_PX / 2, (b.w * box.w) / 2 + pad);
  const hh = Math.max(BOX_MIN_PX / 2, (b.h * box.h) / 2 + pad);
  return { left: cx - hw, top: cy - hh, width: 2 * hw, height: 2 * hh, cx, cy, hw, hh };
}
/** Vùng chạm của khung chính (px). */
export const hitRect = (sentence, box) => rectOf(sentence.box, box);
/** Vùng chạm của mọi khung của câu (px). */
export const hitRects = (sentence, box) => boxesOf(sentence).map((b) => rectOf(b, box));

/**
 * Chạm `tap` (px) có trúng vùng của câu không: câu có khung → hình chữ nhật; không có → vòng tròn quanh `hitCenter`.
 * @returns {null | { score: number, area: number }} score 0 (giữa) … 1 (mép); area để ưu tiên vùng nhỏ khi chồng nhau
 */
export function hitTest(sentence, tap, box) {
  if (!sentence.point) return null;
  if (sentence.box) {
    // Nhiều khung: trúng khung nào cũng được; lấy khung chạm gần giữa nhất.
    let best = null;
    for (const r of hitRects(sentence, box)) {
      const score = Math.max(Math.abs(tap.x - r.cx) / r.hw, Math.abs(tap.y - r.cy) / r.hh);
      if (score <= 1 && (!best || score < best.score)) best = { score, area: r.width * r.height };
    }
    return best;
  }
  const r = hitRadius(sentence, box);
  const c = hitCenter(sentence);
  const d = Math.hypot(tap.x - c.x * box.w, tap.y - c.y * box.h);
  return d <= r ? { score: d / r, area: Math.PI * r * r } : null;
}

/**
 * Tâm vùng chạm của câu (tỉ lệ 0–1): có khung → tâm khung; `at` = tâm đối tượng nếu có (tranh có sẵn: mũi tên đặt CẠNH đối tượng nên đầu mũi tên
 * lệch khỏi hình); không có thì chính đầu mũi tên `point` (tranh bố mẹ soạn: bố mẹ chạm thẳng vào đối tượng).
 */
export const hitCenter = (sentence) => (sentence.box
  ? { x: sentence.box.x + sentence.box.w / 2, y: sentence.box.y + sentence.box.h / 2 } : sentence.at ?? sentence.point);

/** Bán kính vùng chạm (px) của câu: `hit` (kẹp 0,04–0,2) × cạnh ngắn, tối thiểu 24px. */
export function hitRadius(sentence, box) {
  const hit = Math.min(HIT_MAX, Math.max(HIT_MIN, Number.isFinite(sentence.hit) ? sentence.hit : HIT_DEFAULT));
  return Math.max(HIT_MIN_PX, hit * Math.min(box.w, box.h));
}

/**
 * Chạm vào tranh tại `tap` (px trong khung) → chỉ số câu, −1 nếu ngoài mọi vùng (SPEC-ta-tranh 4.4, 4.5):
 * nhiều vùng → vùng NHỎ nhất trước (quả bóng nằm trong khung cái cây → quả bóng; vùng to hơn ≥ 1,5 lần bị loại), rồi câu có
 * khoảng cách / cỡ vùng nhỏ nhất; chênh < 0,05 coi như bằng → ưu tiên câu đang hiện, rồi câu đứng trước.
 */
export function pickSentence(sentences, tap, box, current = -1) {
  let hits = [];
  sentences.forEach((s, i) => {
    const t = hitTest(s, tap, box);
    if (t) hits.push({ i, ...t });
  });
  if (!hits.length) return -1;
  const small = Math.min(...hits.map((x) => x.area));
  hits = hits.filter((x) => x.area < small * 1.5);
  const best = Math.min(...hits.map((x) => x.score));
  const near = hits.filter((x) => x.score - best < 0.05);
  return near.find((x) => x.i === current)?.i ?? Math.min(...near.map((x) => x.i));
}

// Karaoke — từ sáng theo nhịp đọc (SPEC-ta-tranh mục 5.4, dùng chung cho Đọc câu và Tả tranh). Hàm thuần, không DOM.
// Máy không báo trước thời lượng câu và sự kiện `boundary` trên iOS không ổn định → ước lượng theo âm tiết + dấu câu,
// rồi tự hiệu chỉnh theo thời lượng đọc thật của máy sau mỗi câu đọc trọn.

export const MIN_WORD_MS = 250;
export const BASE_MS_PER_UNIT = 280; // ở tốc độ 1×

/** Số âm tiết ước lượng: đếm cụm nguyên âm (y tính là nguyên âm khi không đứng đầu), bỏ "e" câm cuối; tối thiểu 1. */
export function syllables(word) {
  const w = String(word).toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 1;
  let n = (w.replace(/^y/, '').match(/[aeiouy]+/g) ?? []).length;
  if (n > 1 && /[^aeiou]e$/.test(w) && !/[^aeiou]le$/.test(w)) n--;
  return Math.max(1, n);
}

/** Tách câu thành các từ hiển thị (giữ dấu câu dính theo từ): "Hi, Tom!" → ["Hi,", "Tom!"]. */
export const displayWords = (text) => String(text).trim().split(/\s+/).filter(Boolean);

/** Trọng số mỗi từ = âm tiết + khoảng nghỉ sau dấu câu (phẩy +1; chấm / hỏi / than ở GIỮA câu +2). */
export function wordWeights(words) {
  return words.map((w, i) => {
    let n = syllables(w);
    if (/,$/.test(w)) n += 1;
    else if (/[.!?]$/.test(w) && i < words.length - 1) n += 2;
    return n;
  });
}

/**
 * Lịch sáng từng từ (ms tính từ lúc bắt đầu đọc): [{ start, end }]. Mỗi từ sáng tối thiểu MIN_WORD_MS.
 * @param {string[]} words
 * @param {number} msPerUnit
 */
export function schedule(words, msPerUnit) {
  const weights = wordWeights(words);
  let t = 0;
  return weights.map((wt) => {
    const len = Math.max(MIN_WORD_MS, wt * msPerUnit);
    const slot = { start: t, end: t + len };
    t += len;
    return slot;
  });
}

/** ms mỗi đơn vị ban đầu theo tốc độ đọc trong Cài đặt. */
export const initialMsPerUnit = (rate = 1) => BASE_MS_PER_UNIT / Math.max(0.3, rate);

/**
 * Hiệu chỉnh sau một câu đọc trọn: trung bình động 70% cũ / 30% đo được; kẹp 120–700 ms.
 * @param {number} prev
 * @param {number} measuredMs thời lượng đọc thật (onstart → onend)
 * @param {string[]} words
 */
export function calibrate(prev, measuredMs, words) {
  const units = wordWeights(words).reduce((a, b) => a + b, 0);
  if (!units || !(measuredMs > 0)) return prev;
  const next = prev * 0.7 + (measuredMs / units) * 0.3;
  return Math.min(700, Math.max(120, next));
}

/** Chỉ số từ đang sáng tại thời điểm `elapsed` (−1 nếu chưa / đã hết). */
export function activeIndex(slots, elapsed) {
  return slots.findIndex((s) => elapsed >= s.start && elapsed < s.end);
}

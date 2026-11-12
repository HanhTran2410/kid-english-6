// 🧩 Quest — nội dung bé đã học (SPEC-quest.md mục 2): nhóm âm đã đọc xong → grapheme + tricky words của ĐÚNG các nhóm
// đó (không suy "xong nhóm sau là đã học nhóm trước"), bộ kiểm tra đọc được dùng chung Quest 1–3, kho từ / câu, lặp cho
// đủ mục khi kho ít (2.5). Hàm thuần.

import { GROUPS, TRICKY_BY_GROUP, toGraphemes, learnedGraphemes } from '../phonics.js';

/** Mọi grapheme của nhóm 1–7: tách từ theo bảng đầy đủ (ưu tiên grapheme dài) rồi mới xét đã học chưa. */
const ALL_GRAPHEMES = learnedGraphemes(7);

/** Từ chức năng Quest giới thiệu riêng trước khi chơi (2.4): không phải từ bé đã học ở Read. */
export const QUEST_WORDS = ['put', 'under'];

/**
 * Từ tách được thành grapheme nhưng KHÔNG đọc theo âm (2.3): phải là tricky word đã học (hoặc từ Quest đã giới thiệu)
 * mới được dùng. Gồm mọi tricky word kiểu Jolly + vài từ hay gặp.
 */
export const NOT_PHONETIC = new Set([
  ...Object.values(TRICKY_BY_GROUP).flat().map((w) => w.toLowerCase()),
  'put', 'of', 'what', 'who', 'two', 'any', 'many', 'want', 'were', 'once', 'love', 'move', 'push', 'pull', 'full',
]);

/** Kiến thức bé đã học từ các nhóm đã đọc xong (2.2). */
export function learnedPhonics(completedGroups) {
  const groups = [...new Set(completedGroups)].sort((a, b) => a - b);
  const graphemes = new Set(GROUPS.filter((g) => groups.includes(g.group)).flatMap((g) => g.graphemes));
  const tricky = new Set(groups.flatMap((g) => TRICKY_BY_GROUP[g] ?? []).map((w) => w.toLowerCase()));
  return { completedGroups: groups, graphemes, tricky };
}

/** Tách câu thành từ (chữ thường, bỏ dấu câu). */
export const wordsOf = (text) => String(text).toLowerCase().match(/[a-z']+/g) ?? [];

/**
 * Bé đọc được `text` không (2.3). `extra`: từ Quest đã / sẽ giới thiệu trước khi chơi (QUEST_WORDS).
 * @returns {{ ok: boolean, bad: string[] }}
 */
export function canRead(text, lp, extra = []) {
  const ok = new Set([...lp.tricky, ...extra]);
  const bad = wordsOf(text).filter((w) => {
    if (ok.has(w)) return false;
    if (NOT_PHONETIC.has(w)) return true;
    // "see" tách được s-e-e bằng chữ đã học, nhưng thật ra là s-ee (ee chưa học) → tách theo bảng đầy đủ trước.
    const parts = toGraphemes(w, ALL_GRAPHEMES);
    return !parts || !parts.every((g) => lp.graphemes.has(g));
  });
  return { ok: bad.length === 0, bad: [...new Set(bad)] };
}

/**
 * Kho nội dung (2.2): từ có hình + câu của các bài Phonics có sẵn thuộc nhóm đã đọc xong, đã lọc qua `canRead`.
 * @param {Array} lessons bài Phonics có sẵn (BUILTIN_LESSONS)
 */
export function questPool(lessons, lp) {
  const inGroups = lessons.filter((l) => l.track === 'phonics' && lp.completedGroups.includes(l.group));
  const seen = new Set();
  const words = [];
  for (const l of inGroups) {
    for (const w of l.words) {
      if (!w.emoji || seen.has(w.en) || !/^[a-z]+$/.test(w.en) || !canRead(w.en, lp).ok) continue;
      seen.add(w.en);
      words.push({ en: w.en, vi: w.vi, emoji: w.emoji, group: l.group });
    }
  }
  const sentences = inGroups.flatMap((l) => (l.sentences ?? [])
    .filter((s) => canRead(s.en, lp).ok)
    .map((s) => ({ id: `${l.id}-${s.id}`, en: s.en, vi: s.vi, emoji: s.emoji ?? null, lessonId: l.id })));
  return { words, sentences, byWord: new Map(words.map((w) => [w.en, w])) };
}

/**
 * Lấy `n` mục từ danh sách theo bảng 2.5: đủ thì không lặp; thiếu thì lặp lại, không hai mục liền giống nhau
 * (so theo `key`). Danh sách rỗng → [].
 */
export function fillTo(list, n, rand, key = (x) => x) {
  if (!list.length) return [];
  const out = [];
  let bag = [];
  for (let guard = 0; out.length < n && guard < 1000; guard++) {
    if (!bag.length) bag = shuffle(rand, list);
    const i = bag.findIndex((x) => !out.length || key(x) !== key(out.at(-1)) || list.length === 1);
    if (i < 0) {
      bag = [];
      continue;
    }
    out.push(bag.splice(i, 1)[0]);
  }
  return out;
}

export function shuffle(rand, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Hai từ giống chữ: cùng độ dài, khác đúng một chữ (cat / hat, pen / hen) — đồ nhiễu mức 2–3 (4.1). */
export function lookAlike(a, b) {
  if (a === b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
  return diff === 1;
}

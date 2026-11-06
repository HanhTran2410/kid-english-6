// Chữ và âm (SPEC mục 3.1.1, 5.2): mã âm (`soundId`), 7 nhóm âm kiểu Jolly, ghép grapheme thành từ, từ "đọc được".
// Không phụ thuộc DOM (chạy được trong test).

/**
 * Các nhóm âm theo thứ tự học. `graphemes`: nhóm chữ bé học ở nhóm đó (một grapheme = một âm);
 * `sounds`: mã âm mới (mỗi mã một file `sounds/phonics/<mã>.mp3`).
 * c, k, ck cùng âm `k`; th có hai âm (`th` thin, `th-v` this); oo có hai âm (`oo` book, `oo-l` moon).
 */
export const GROUPS = [
  { group: 1, graphemes: ['s', 'a', 't', 'i', 'p', 'n'], sounds: ['s', 'a', 't', 'i', 'p', 'n'] },
  { group: 2, graphemes: ['c', 'k', 'ck', 'e', 'h', 'r', 'm', 'd'], sounds: ['k', 'e', 'h', 'r', 'm', 'd'] },
  { group: 3, graphemes: ['g', 'o', 'u', 'l', 'f', 'b'], sounds: ['g', 'o', 'u', 'l', 'f', 'b'] },
  { group: 4, graphemes: ['ai', 'j', 'oa', 'ie', 'ee', 'or'], sounds: ['ai', 'j', 'oa', 'ie', 'ee', 'or'] },
  { group: 5, graphemes: ['z', 'w', 'ng', 'v', 'oo'], sounds: ['z', 'w', 'ng', 'v', 'oo', 'oo-l'] },
  { group: 6, graphemes: ['y', 'x', 'ch', 'sh', 'th'], sounds: ['y', 'x', 'ch', 'sh', 'th', 'th-v'] },
  { group: 7, graphemes: ['qu', 'ou', 'oi', 'ue', 'er', 'ar'], sounds: ['qu', 'ou', 'oi', 'ue', 'er', 'ar'] },
];

/** Split digraph (a_e, i_e, o_e, u_e, e_e): học sau nhóm 7, âm dùng chung mã với nguyên âm dài cùng tiếng. */
export const SPLIT_DIGRAPHS = { a_e: 'ai', e_e: 'ee', i_e: 'ie', o_e: 'oa', u_e: 'ue' };
export const AFTER_GROUPS = 8; // "nhóm" của split digraph

/** Mọi mã âm hợp lệ. */
export const SOUND_IDS = new Set(GROUPS.flatMap((g) => g.sounds));

/** Mã âm đã có file ghi âm trong app (bố mẹ đã nghe duyệt — xem app/sounds/CREDITS.md). Thêm dần theo nhóm. */
export const RECORDED_SOUNDS = new Set([
  's', 'a', 't', 'i', 'p', 'n', // nhóm 1
  'k', 'e', 'h', 'r', 'm', 'd', // nhóm 2
  'g', 'o', 'u', 'l', 'f', 'b', // nhóm 3
]);

export const soundUrl = (soundId) => `sounds/phonics/${soundId}.mp3`;

/** Các grapheme bé đã học tính tới hết nhóm `group` (≥ 8: thêm split digraph). */
export function learnedGraphemes(group) {
  const set = new Set(GROUPS.filter((g) => g.group <= group).flatMap((g) => g.graphemes));
  if (group >= AFTER_GROUPS) for (const s of Object.keys(SPLIT_DIGRAPHS)) set.add(s);
  return set;
}

const isSplit = (g) => /^[aeiou]_e$/.test(g);

/**
 * Ghép các grapheme lại thành từ viết. Split digraph `a_e` đặt chữ `a` tại chỗ và chữ `e` sau grapheme kế tiếp:
 * ['c', 'a_e', 'k'] → "cake".
 */
export function spellGraphemes(graphemes) {
  let out = '';
  let pendingE = false;
  for (const raw of graphemes) {
    const g = String(raw).toLowerCase();
    if (isSplit(g)) {
      out += g[0];
      pendingE = true;
      continue;
    }
    out += g;
    if (pendingE) {
      out += 'e';
      pendingE = false;
    }
  }
  return pendingE ? null : out; // split digraph đứng cuối là sai
}

/**
 * Từ có đọc được bằng các grapheme đã học không (SPEC 5.3).
 * @param {{ en: string, graphemes?: string[], tags?: string[] }} word
 * @param {Set<string>} learned grapheme đã học
 * @param {Set<string>} [tricky] tricky words đã học (chữ thường)
 */
export function isDecodable(word, learned, tricky = new Set()) {
  if (tricky.has(String(word.en).toLowerCase())) return true;
  if (!word.graphemes?.length) return false;
  return word.graphemes.every((g) => learned.has(String(g).toLowerCase()));
}

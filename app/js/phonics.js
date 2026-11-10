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
export const RECORDED_SOUNDS = new Set(GROUPS.flatMap((g) => g.sounds)); // đủ 42 âm của 7 nhóm (nhóm 4–7 duyệt 2026-11-10)

export const soundUrl = (soundId) => `sounds/phonics/${soundId}.mp3`;

/**
 * Thông tin hiển thị của các âm đã có file: chữ viết ra âm đó, từ ví dụ (bắt đầu bằng âm đó), lời giải thích tiếng Việt
 * khi bé nhầm 2 lần (SPEC 4.1). `{name}` = tên nhân vật (Olly) — không viết cứng tên.
 */
export const SOUND_INFO = {
  s: { letters: 's', word: 'sun', emoji: '☀️', vi: 'Âm /s/ giống tiếng rắn kêu: sss. Chữ s, như trong "sun" (mặt trời).' },
  a: { letters: 'a', word: 'ant', emoji: '🐜', vi: 'Âm /a/ ngắn, há miệng: a, a. Chữ a, như trong "ant" (con kiến).' },
  t: { letters: 't', word: 'tent', emoji: '⛺', vi: 'Âm /t/ bật nhẹ đầu lưỡi: t, t, t. Chữ t, như trong "tent" (cái lều).' },
  i: { letters: 'i', word: 'ink', emoji: '🖋️', vi: 'Âm /i/ ngắn: i, i. Chữ i, như trong "ink" (mực).' },
  p: { letters: 'p', word: 'pig', emoji: '🐷', vi: 'Âm /p/ bật hơi ở môi như thổi nến: p, p, p. Chữ p, như trong "pig" (con lợn).' },
  n: { letters: 'n', word: 'nest', emoji: '🪺', vi: 'Âm /n/ ngân trong mũi: nnn. Chữ n, như trong "nest" (cái tổ).' },
  k: { letters: 'c k ck', word: 'cat', emoji: '🐱', vi: 'Âm /k/ bật ở cổ họng: k, k, k. Chữ c, chữ k và hai chữ ck đều đọc như vậy, như trong "cat" (con mèo).' },
  e: { letters: 'e', word: 'egg', emoji: '🥚', vi: 'Âm /e/ ngắn: e, e. Chữ e, như trong "egg" (quả trứng).' },
  h: { letters: 'h', word: 'hat', emoji: '🎩', vi: 'Âm /h/ chỉ là hơi thở ra: h, h. Chữ h, như trong "hat" (cái mũ).' },
  r: { letters: 'r', word: 'rat', emoji: '🐀', vi: 'Âm /r/ uốn lưỡi, không rung: rrr. Chữ r, như trong "rat" (con chuột).' },
  m: { letters: 'm', word: 'map', emoji: '🗺️', vi: 'Âm /m/ ngậm môi ngân: mmm. Chữ m, như trong "map" (bản đồ).' },
  d: { letters: 'd', word: 'dad', emoji: '👨', vi: 'Âm /d/ bật nhẹ đầu lưỡi, có rung: d, d. Chữ d, như trong "dad" (bố).' },
  g: { letters: 'g', word: 'gas', emoji: '⛽', vi: 'Âm /g/ bật ở cổ họng, có rung: g, g. Chữ g, như trong "gas" (xăng).' },
  o: { letters: 'o', word: 'on', emoji: '💡', vi: 'Âm /o/ ngắn, tròn miệng: o, o. Chữ o, như trong "on" (bật).' },
  u: { letters: 'u', word: 'up', emoji: '⬆️', vi: 'Âm /u/ ngắn giống "ơ": u, u. Chữ u, như trong "up" (lên trên).' },
  l: { letters: 'l', word: 'leg', emoji: '🦵', vi: 'Âm /l/ đặt lưỡi lên răng ngân: lll. Chữ l, như trong "leg" (cái chân).' },
  f: { letters: 'f', word: 'fish', emoji: '🐟', vi: 'Âm /f/ cắn nhẹ môi dưới thổi hơi: fff. Chữ f, như trong "fish" (con cá).' },
  b: { letters: 'b', word: 'bed', emoji: '🛏️', vi: 'Âm /b/ bật ở môi, có rung: b, b. Chữ b, như trong "bed" (cái giường).' },
  ai: { letters: 'ai', word: 'rain', emoji: '🌧️', vi: 'Hai chữ a và i đi cùng nhau đọc là /ai/, gần giống "ây": ai, ai. Như trong "rain" (mưa).' },
  j: { letters: 'j', word: 'jam', emoji: '🍯', vi: 'Âm /j/ bật ở đầu lưỡi, gần giống "chờ" nhưng có rung: j, j. Chữ j, như trong "jam" (mứt).' },
  oa: { letters: 'oa', word: 'boat', emoji: '⛵', vi: 'Hai chữ o và a đi cùng nhau đọc là /oa/, gần giống "âu": oa. Như trong "boat" (con thuyền).' },
  ie: { letters: 'ie', word: 'tie', emoji: '👔', vi: 'Hai chữ i và e đi cùng nhau đọc là /ie/, gần giống "ai": ie. Như trong "tie" (cà vạt).' },
  ee: { letters: 'ee', word: 'bee', emoji: '🐝', vi: 'Hai chữ e đi cùng nhau đọc là /ee/, như "i" kéo dài: eee. Như trong "bee" (con ong).' },
  or: { letters: 'or', word: 'fork', emoji: '🍴', vi: 'Hai chữ o và r đi cùng nhau đọc là /or/, như "o" kéo dài: or. Như trong "fork" (cái nĩa).' },
  z: { letters: 'z', word: 'zip', emoji: '🤐', vi: 'Âm /z/ giống tiếng ong bay: zzz. Chữ z, như trong "zip" (khóa kéo).' },
  w: { letters: 'w', word: 'web', emoji: '🕸️', vi: 'Âm /w/ chu tròn môi rồi mở ra: w, w. Chữ w, như trong "web" (mạng nhện).' },
  ng: { letters: 'ng', word: 'ring', emoji: '💍', vi: 'Hai chữ n và g đi cùng nhau đọc là /ng/, ngân trong mũi như cuối chữ "trăng": ng. Như trong "ring" (cái nhẫn).' },
  v: { letters: 'v', word: 'van', emoji: '🚐', vi: 'Âm /v/ cắn nhẹ môi dưới, có rung: vvv. Chữ v, như trong "van" (xe tải nhỏ).' },
  oo: { letters: 'oo', word: 'book', emoji: '📖', vi: 'Hai chữ o đi cùng nhau, đọc /oo/ ngắn như "u" ngắn: oo. Như trong "book" (quyển sách).' },
  'oo-l': { letters: 'oo', word: 'moon', emoji: '🌙', vi: 'Hai chữ o đi cùng nhau, đọc /oo/ dài như "u" kéo dài: ooo. Như trong "moon" (mặt trăng).' },
  y: { letters: 'y', word: 'yes', emoji: '👍', vi: 'Âm /y/ như "i" lướt thật nhanh: y, y. Chữ y, như trong "yes" (vâng).' },
  x: { letters: 'x', word: 'box', emoji: '📦', vi: 'Chữ x đọc là /ks/ — âm k rồi âm s liền nhau: ks. Như trong "box" (cái hộp).' },
  ch: { letters: 'ch', word: 'chick', emoji: '🐥', vi: 'Hai chữ c và h đi cùng nhau đọc là /ch/, giống "ch" tiếng Việt: ch, ch. Như trong "chick" (gà con).' },
  sh: { letters: 'sh', word: 'ship', emoji: '🚢', vi: 'Hai chữ s và h đi cùng nhau đọc là /sh/, như khi bảo im lặng: shhh. Như trong "ship" (con tàu).' },
  th: { letters: 'th', word: 'three', emoji: '3️⃣', vi: 'Hai chữ t và h đi cùng nhau: đặt đầu lưỡi giữa hai răng rồi thổi hơi, không rung: th. Như trong "three" (số ba).' },
  'th-v': { letters: 'th', word: 'this', emoji: '👉', vi: 'Hai chữ t và h đi cùng nhau: đặt đầu lưỡi giữa hai răng, có rung: th. Như trong "this" (cái này).' },
  qu: { letters: 'qu', word: 'queen', emoji: '👸', vi: 'Hai chữ q và u đi cùng nhau đọc là /kw/: kw, kw. Như trong "queen" (nữ hoàng).' },
  ou: { letters: 'ou', word: 'cloud', emoji: '☁️', vi: 'Hai chữ o và u đi cùng nhau đọc là /ou/, gần giống "ao": ou. Như trong "cloud" (đám mây).' },
  oi: { letters: 'oi', word: 'coin', emoji: '🪙', vi: 'Hai chữ o và i đi cùng nhau đọc là /oi/, giống "oi" tiếng Việt: oi. Như trong "coin" (đồng xu).' },
  ue: { letters: 'ue', word: 'statue', emoji: '🗽', vi: 'Hai chữ u và e đi cùng nhau đọc là /ue/, gần giống "iu": ue. Như trong "statue" (bức tượng).' },
  er: { letters: 'er', word: 'hammer', emoji: '🔨', vi: 'Hai chữ e và r đi cùng nhau đọc là /er/, như "ơ" kéo dài: er. Như trong "hammer" (cái búa).' },
  ar: { letters: 'ar', word: 'car', emoji: '🚗', vi: 'Hai chữ a và r đi cùng nhau đọc là /ar/, như "a" kéo dài, miệng mở to: ar. Như trong "car" (ô tô).' },
};

/** Tricky words theo thứ tự kiểu Jolly (nhóm 1: I the he she me we be was to do are all; nhóm 2: you your come some…), chia theo nhóm âm đang học (SPEC 3.1.4). */
export const TRICKY_BY_GROUP = {
  1: ['I', 'the'],
  2: ['he', 'she', 'me', 'we'],
  3: ['be', 'was', 'to', 'do'],
  4: ['are', 'all', 'you', 'your'],
  5: ['come', 'some', 'said', 'here'],
  6: ['there', 'they', 'go', 'no'],
  7: ['so', 'my', 'one', 'by'],
};

/** c, k, ck cùng âm `k`; các grapheme khác trùng mã âm. oo / th có hai âm — từ dùng âm thứ hai (oo-l, th-v) ghi riêng. */
export const soundOfGrapheme = (g) => (g === 'c' || g === 'ck' ? 'k' : g);

/** Tách từ thành grapheme theo tập đã học, ưu tiên grapheme dài (ck trước c). Không tách được → null. */
export function toGraphemes(word, learned) {
  const w = String(word).toLowerCase();
  const sorted = [...learned].filter((g) => !g.includes('_')).sort((a, b) => b.length - a.length);
  const out = [];
  for (let i = 0; i < w.length;) {
    const g = sorted.find((x) => w.startsWith(x, i));
    if (!g) return null;
    out.push(g);
    i += g.length;
  }
  return out;
}

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

// 🧩 Quest (SPEC-quest.md) — hàm thuần: danh sách trò, Quest 1 Read and Do (bảng cặp đồ – chỗ đặt, sinh câu chỉ dẫn,
// chấm theo 3 trường thing / place / where, câu hai việc), Quest 2 Build a Sentence (tách thẻ từ, chấm theo chuỗi chữ),
// Quest 3 Guess the Word (câu đố viết sẵn, nhiễu sai câu gợi ý 2), câu đọc, khóa tiến độ, giải thích tiếng Việt.

import { canRead, fillTo, shuffle, lookAlike, QUEST_WORDS } from './content.js';
import { RIDDLE_BY_WORD, distractorsFor, choicesAt, onsetOf } from './riddles.js';
import { toGraphemes, learnedGraphemes, soundOfGrapheme } from '../phonics.js';

export const QUEST_ITEMS = 8;

/** Trò của khu 🧩 (2.1). `batch`: đợt làm (mục 11) — chỉ trò đã làm mới hiện. */
export const BUILTIN_QUESTS = [
  { id: 'quest-q1', key: 'q1', emoji: '🧸', title: 'Read and Do', titleVi: 'Đọc rồi làm', batch: 'a' },
  { id: 'quest-q2', key: 'q2', emoji: '🧱', title: 'Build a Sentence', titleVi: 'Xếp câu', batch: 'a' },
  { id: 'quest-q3', key: 'q3', emoji: '🔍', title: 'Guess the Word', titleVi: 'Đoán từ', batch: 'b' },
  { id: 'quest-q4', key: 'q4', emoji: '✏️', title: 'Mini Crossword', titleVi: 'Ô chữ nhỏ', batch: 'c' },
];
export const QUEST_BY_ID = new Map(BUILTIN_QUESTS.map((q) => [q.id, q]));

// ---------- Quest 1 — Read and Do ----------

/** Chỗ đặt và vị trí dùng được (4.4): box (in, on), bag (in), cup (in, đồ nhỏ), bed (on, under). */
export const PLACES = ['box', 'bag', 'cup', 'bed'];
export const WHERE_VI = { in: 'vào trong', on: 'lên trên', under: 'xuống dưới' };

const ANIMAL = { in: ['box', 'bag'], on: ['bed', 'box'], under: ['bed'] };
const SMALL = { in: ['box', 'bag', 'cup'], on: ['bed', 'box'], under: ['bed'] };
/** Bảng cặp đồ – chỗ đặt hợp lý (4.4, bố mẹ duyệt). Không ghép tự do. */
export const PAIRS = {
  cat: ANIMAL, dog: ANIMAL, pig: ANIMAL, rat: ANIMAL, hen: ANIMAL, fox: ANIMAL,
  ant: SMALL, bug: SMALL, frog: SMALL, chick: SMALL,
  hat: ANIMAL, book: ANIMAL,
  pen: SMALL, pin: SMALL, coin: SMALL, ring: SMALL,
  fish: { in: ['cup'], on: [], under: [] },
};

const article = (w) => (/^[aeiou]/.test(w) ? 'an' : 'a');
const part = (a) => `the ${a.thing} ${a.where} the ${a.place}`;
export const actionId = (a) => `${a.thing}-${a.where}-${a.place}`;

/** Câu chỉ dẫn + dòng tiếng Việt của một mục (một hoặc hai việc). */
export function q1Text(actions, byWord) {
  const vi = (w) => byWord.get(w)?.vi ?? w;
  const viPart = (a) => `${vi(a.thing)} ${WHERE_VI[a.where]} ${vi(a.place)}`;
  return {
    en: `Put ${actions.map(part).join(' and ')}.`,
    vi: `Đặt ${actions.map(viPart).join(', và ')}.`,
  };
}

/** Mọi việc dùng được (một việc) theo kho + mức: đồ và chỗ đều có trong kho, câu đọc được (put / under giới thiệu trước). */
export function q1Actions(pool, lp, level) {
  const wheres = level === 3 ? ['in', 'on', 'under'] : ['in', 'on'];
  const out = [];
  for (const [thing, table] of Object.entries(PAIRS)) {
    if (!pool.byWord.has(thing)) continue;
    for (const where of wheres) {
      for (const place of table[where]) {
        if (!pool.byWord.has(place)) continue;
        const a = { thing, where, place };
        if (canRead(q1Text([a], pool.byWord).en, lp, QUEST_WORDS).ok) out.push(a);
      }
    }
  }
  return out;
}

/** Đồ trên kệ: đồ cần đặt + nhiễu (mức 1 khác hẳn; mức 2–3 có ít nhất một đồ giống chữ nếu kho có). */
function shelfFor(things, size, level, pool, rand) {
  const objects = Object.keys(PAIRS).filter((t) => pool.byWord.has(t) && !things.includes(t));
  const others = pool.words.map((w) => w.en).filter((w) => !things.includes(w) && !PLACES.includes(w) && !objects.includes(w));
  const alike = (w) => things.some((t) => lookAlike(t, w));
  const shelf = [...things];
  if (level >= 2) {
    const a = shuffle(rand, [...objects, ...others].filter(alike))[0];
    if (a) shelf.push(a);
  }
  const rest = shuffle(rand, objects).filter((w) => !shelf.includes(w) && (level >= 2 || !alike(w)));
  const extra = shuffle(rand, others).filter((w) => !shelf.includes(w) && (level >= 2 || !alike(w)));
  for (const w of [...rest, ...extra]) {
    if (shelf.length >= size) break;
    shelf.push(w);
  }
  return shuffle(rand, shelf);
}

function q1Item(actions, level, pool, rand) {
  const things = actions.map((a) => a.thing);
  const size = level === 1 ? 4 : level === 2 ? 5 : actions.length > 1 ? 6 : 5;
  const need = [...new Set(actions.map((a) => a.place))];
  const places = PLACES.filter((p) => pool.byWord.has(p));
  const shown = [...need, ...shuffle(rand, places.filter((p) => !need.includes(p)))].slice(0, Math.max(3, need.length));
  const { en, vi } = q1Text(actions, pool.byWord);
  return {
    id: `q1-${actions.map(actionId).join('-and-')}`,
    actions,
    text: en,
    vi,
    shelf: shelfFor(things, size, level, pool, rand),
    places: shuffle(rand, shown),
    kind: actions.length > 1 ? 'q1:two' : `q1:${actions[0].where}`,
  };
}

/** Một việc / câu: in / on (/ under) cân bằng (chênh ≤ 2), không hai mục liền cùng đồ. */
function balancedSingles(cands, n, rand, { minUnder = 0 } = {}) {
  let best = null;
  for (let attempt = 0; attempt < 300; attempt++) {
    const seq = fillTo(shuffle(rand, cands), n, rand, (a) => a.thing);
    if (seq.length < n) return seq;
    const counts = ['in', 'on', 'under'].map((w) => seq.filter((a) => a.where === w).length).filter((c, i) => cands.some((a) => a.where === ['in', 'on', 'under'][i]));
    const spread = Math.max(...counts) - Math.min(...counts);
    const unique = new Set(seq.map(actionId)).size === Math.min(n, cands.length) || cands.length < n;
    const under = seq.filter((a) => a.where === 'under').length;
    const good = spread <= 2 && unique && under >= Math.min(minUnder, cands.filter((a) => a.where === 'under').length);
    if (good) return seq;
    if (!best) best = seq;
  }
  return best;
}

/**
 * 3 câu hai việc, không hai mục liền cùng đồ đầu (so cả với câu một việc ngay trước): mỗi cặp thử cả hai thứ tự việc.
 * Ít cặp thì lặp lại (2.5).
 */
function pickTwos(pairs, prevThing, rand) {
  const out = [];
  let prev = prevThing;
  let bag = [];
  for (let guard = 0; out.length < 3 && guard < 200; guard++) {
    if (!bag.length) bag = shuffle(rand, pairs);
    const p = bag.pop();
    const order = p[0].thing !== prev ? p : p[1].thing !== prev ? [p[1], p[0]] : null;
    if (!order) continue;
    out.push(order);
    prev = order[0].thing;
  }
  return out;
}

/**
 * 8 mục Quest 1 (4.3). Mức 3: mục 1–5 một việc (≥ 2 câu under), mục 6–8 câu hai việc in / on (khác đồ, khác chỗ).
 * Kho không có việc nào → [] (không mở lượt, 2.5).
 */
export function makeQ1(level, rand, pool, lp) {
  const cands = q1Actions(pool, lp, level);
  if (!cands.length) return [];
  if (level < 3) return balancedSingles(cands, QUEST_ITEMS, rand).map((a) => q1Item([a], level, pool, rand));
  const singles = balancedSingles(cands, 5, rand, { minUnder: 2 }).map((a) => q1Item([a], level, pool, rand));
  const io = cands.filter((a) => a.where !== 'under');
  const pairs = [];
  for (const a of io) for (const b of io) if (a.thing !== b.thing && a.place !== b.place) pairs.push([a, b]);
  // Câu hai việc đọc được khi từng việc đọc được (cands đã lọc) và bé đọc được "and" — không kiểm từng cặp.
  const readablePairs = canRead('and', lp).ok ? pairs : [];
  const twos = readablePairs.length
    ? pickTwos(readablePairs, singles.at(-1).actions[0].thing, rand).map((p) => q1Item(p, level, pool, rand))
    : balancedSingles(cands, 3, rand).map((a) => q1Item([a], level, pool, rand));
  return [...singles, ...twos];
}

/**
 * Chấm một lần đặt (4.2): so với các việc CHƯA xong. Khớp đồ của việc nào thì chấm việc đó (sai chỗ → `place`, sai vị
 * trí → `where`); không khớp đồ nào → `thing` cho việc chưa xong đầu tiên.
 * @returns {{ index: number, error: null | 'thing' | 'place' | 'where' }}
 */
export function judgeQ1(actions, done, pick) {
  const open = actions.map((a, i) => i).filter((i) => !done[i]);
  const i = open.find((k) => actions[k].thing === pick.thing);
  if (i == null) return { index: open[0], error: 'thing' };
  const a = actions[i];
  if (a.place !== pick.place) return { index: i, error: 'place' };
  if (a.where !== pick.where) return { index: i, error: 'where' };
  return { index: i, error: null };
}

/** Câu Olly nói khi sai (4.2, mục 9). */
export function q1WrongLine(a, pick, error) {
  if (error === 'thing') return `That is ${article(pick.thing)} ${pick.thing}. Find the ${a.thing}!`;
  if (error === 'place') return `That is the ${pick.place}. Put it ${a.where} the ${a.place}!`;
  return `The ${a.thing} is ${pick.where} the ${pick.place}. Put it ${a.where.toUpperCase()} the ${a.place}!`;
}

/** Từ cần sáng trong câu chỉ dẫn theo lỗi (4.2). */
export const q1HintWords = (a, error) => (error === 'thing' ? [a.thing] : error === 'place' ? [a.place] : [a.where]);

// ---------- Quest 2 — Build a Sentence ----------

/** Thẻ từ của câu: giữ chữ hoa của từ đầu, bỏ dấu câu cuối (5.4). Câu có dấu phẩy / ngoặc kép → null. */
export function sentenceWords(en) {
  if (/[,"“”]/.test(en)) return null;
  return en.trim().replace(/[.!?]+$/, '').split(/\s+/);
}

const Q2_RANGE = { 1: [3, 4], 2: [4, 6], 3: [4, 7] };
const startOf = (words) => words.slice(0, 2).join(' ').toLowerCase();

/** 8 mục Quest 2 (5.2): câu theo độ dài của mức (không có thì lấy câu 3–7 từ), ≤ 3 câu cùng 2 từ đầu. */
export function makeQ2(level, rand, pool, lp) {
  const usable = pool.sentences
    .map((s) => ({ ...s, words: sentenceWords(s.en) }))
    .filter((s) => s.words && s.words.length >= 3 && s.words.length <= 7);
  if (!usable.length) return [];
  const [lo, hi] = Q2_RANGE[level];
  const inRange = usable.filter((s) => s.words.length >= lo && s.words.length <= hi);
  const list = inRange.length ? inRange : usable;
  let seq = null;
  for (let attempt = 0; attempt < 200; attempt++) {
    seq = fillTo(shuffle(rand, list), QUEST_ITEMS, rand, (s) => s.id);
    const starts = new Map();
    for (const s of seq) starts.set(startOf(s.words), (starts.get(startOf(s.words)) ?? 0) + 1);
    const distinctStarts = new Set(list.map((s) => startOf(s.words))).size;
    if (Math.max(...starts.values()) <= 3 || distinctStarts * 3 < QUEST_ITEMS) break;
  }
  return seq.map((s) => {
    // Mức 3: một thẻ nhiễu cùng loại (danh từ có hình), đọc được, không có trong câu; ưu tiên từ giống chữ.
    let extra = null;
    if (level === 3) {
      const inSentence = new Set(s.words.map((w) => w.toLowerCase()));
      const nouns = pool.words.map((w) => w.en).filter((w) => !inSentence.has(w) && canRead(w, lp).ok);
      extra = shuffle(rand, nouns.filter((w) => [...inSentence].some((x) => lookAlike(x, w))))[0] ?? shuffle(rand, nouns)[0] ?? null;
    }
    return {
      id: s.id, en: s.en, vi: s.vi, emoji: s.emoji, words: s.words, extra, given: level < 3 ? 1 : 0,
      kind: s.words.length <= 4 ? 'q2:short' : 'q2:long',
    };
  });
}

/** Chấm hàng thẻ theo chuỗi chữ (5.1): trả về chỉ số các chỗ có chữ khác chữ đúng (thẻ cùng chữ đổi chỗ tự do). */
export const q2Wrong = (placed, words) => words.map((w, i) => (placed[i] === w ? -1 : i)).filter((i) => i >= 0);

/** Phần đúng liền đầu câu (để Olly đọc rồi dừng ở chỗ trống: "The dog is … ?"). */
export function q2Prefix(placed, words) {
  const out = [];
  for (let i = 0; i < words.length && placed[i] === words[i]; i++) out.push(words[i]);
  return out;
}

// ---------- Quest 3 — Guess the Word ----------

const ALL_GRAPHEMES = learnedGraphemes(7);
/** Âm đầu của từ (gợi ý sau lần sai 1, phát từ file — 6.1) và chữ đầu (để làm sáng chữ đầu mọi lựa chọn). */
export function firstSoundOf(word) {
  const g = toGraphemes(word, ALL_GRAPHEMES)?.[0] ?? word[0];
  return { grapheme: g, sound: soundOfGrapheme(g) };
}

/**
 * Cặp gợi ý dùng được của câu đố ở mức `level` với kho `words`: bé đọc được cả 2 câu (2.3) và đủ nhiễu ở mức đó
 * (6.2 — mức 2–3 chỉ nhiễu cùng loại).
 */
function usablePairs(riddle, words, lp, level) {
  return riddle.clues.filter((c) => canRead(c.en.join(' '), lp).ok && choicesAt(riddle, c, words, level) > 0);
}

/**
 * 8 mục Quest 3 (6). Mức không đủ 3 từ dùng được → lùi mức hiển thị (`show`) cho cả lượt; mức 1 cũng không đủ → [] (kho
 * rỗng, 2.5). Từ lặp lại trong lượt thì đổi cặp gợi ý nếu có (RD-15); vị trí đáp án chia đều (RD-17).
 */
export function makeQ3(level, rand, pool, lp) {
  const words = pool.words.map((w) => w.en).filter((w) => RIDDLE_BY_WORD.has(w));
  let show = level;
  let cands = [];
  for (; show >= 1; show--) {
    cands = words.filter((w) => usablePairs(RIDDLE_BY_WORD.get(w), words, lp, show).length);
    if (cands.length >= 3) break;
  }
  if (show < 1) return [];
  const seq = fillTo(shuffle(rand, cands), QUEST_ITEMS, rand);
  const usedPair = new Map();
  const out = seq.map((word) => {
    const r = RIDDLE_BY_WORD.get(word);
    const pairs = usablePairs(r, words, lp, show);
    const seen = usedPair.get(word) ?? [];
    const fresh = pairs.filter((c) => !seen.includes(c));
    const clue = shuffle(rand, fresh.length ? fresh : pairs)[0];
    usedPair.set(word, [...seen, clue]);
    const count = choicesAt(r, clue, words, show);
    // Nhiễu khác âm đầu với nhau; mức 3 ưu tiên từ giống chữ (cat / rat).
    const pool3 = shuffle(rand, distractorsFor(r, clue, words, show));
    if (show === 3) pool3.sort((a, b) => Number(lookAlike(b, word)) - Number(lookAlike(a, word)));
    const picks = [];
    for (const d of pool3) if (picks.length < count - 1 && !picks.some((p) => onsetOf(p) === onsetOf(d))) picks.push(d);
    const alike = show === 3 && picks.some((d) => lookAlike(d, word));
    return {
      id: word, word, en: clue.en, vi: clue.vi, trait: clue.trait, show, distractors: picks,
      sum: r.sum, sumVi: r.sumVi, sumReadable: canRead(r.sum, lp).ok, first: firstSoundOf(word),
      kind: show === 1 ? 'q3:pic' : alike ? 'q3:look-alike' : 'q3:word',
    };
  });
  // Vị trí đáp án chia đều trong lượt (không để bé đoán theo chỗ): rút lần lượt từ túi vị trí theo số lựa chọn.
  const bags = new Map();
  for (const it of out) {
    const size = it.distractors.length + 1;
    if (!bags.get(size)?.length) bags.set(size, shuffle(rand, [...Array(size).keys()]));
    it.options = [...it.distractors];
    it.options.splice(bags.get(size).shift(), 0, it.word);
  }
  return out;
}

// ---------- Chung ----------

/** Kiểu câu theo mức (để bố mẹ xem kiểu hay sai, 10.1). */
export function questKindsAt(key, level) {
  if (key === 'q1') return level === 3 ? ['q1:in', 'q1:on', 'q1:under', 'q1:two'] : ['q1:in', 'q1:on'];
  if (key === 'q2') return ['q2:short', 'q2:long'];
  if (key === 'q3') return level === 1 ? ['q3:pic'] : ['q3:word', 'q3:look-alike'];
  if (key === 'q4') return level === 1 ? ['q4:cvc'] : ['q4:cvc', 'q4:digraph'];
  return [];
}

/** Câu đọc của mục: Quest 1 = câu chỉ dẫn; Quest 2 = câu vừa xếp; Quest 3 = câu tổng kết. */
export function questSentence(key, item) {
  if (key === 'q1') return { en: item.text, vi: item.vi };
  if (key === 'q3') return { en: item.sum, vi: item.sumVi };
  return { en: item.en, vi: item.vi };
}

/** Khóa tiến độ (10.1): ID ổn định của nội dung. */
export function questRef(lesson, item) {
  return { lessonId: lesson.id, activity: { q1: 'do', q2: 'build', q3: 'guess', q4: 'cross' }[lesson.key], itemId: item.id };
}

/** Giải thích tiếng Việt khi sai 2 lần. Quest 1 theo đúng lỗi; Quest 2 dịch câu + thứ tự từ; Quest 4 nghĩa + số chữ. */
export function questExplainVi(key, item, { action = null, error = null, byWord = null } = {}) {
  if (key === 'q4') return `Từ "${item.word}" nghĩa là ${byWord?.get(item.word)?.vi ?? item.word}. Từ này có ${item.word.length} chữ: ${[...item.word].join(' – ')}.`;
  if (key === 'q3') return `Gợi ý: ${item.vi.join(' ')} Đáp án là "${item.word}" (${byWord?.get(item.word)?.vi ?? item.word}).`;
  if (key === 'q2') return `Câu "${item.en}" nghĩa là: ${item.vi} Câu tiếng Anh bắt đầu bằng ai / cái gì, rồi tới việc làm. Thứ tự đúng: ${item.words.join(' – ')}.`;
  const vi = (w) => byWord?.get(w)?.vi ?? w;
  const a = action ?? item.actions[0];
  const say = `Câu nói: đặt ${vi(a.thing)} ${WHERE_VI[a.where].toUpperCase()} ${vi(a.place)}.`;
  if (error === 'thing') return `${say} Bé tìm "${a.thing}" (${vi(a.thing)}) trên kệ.`;
  if (error === 'place') return `${say} Bé đặt vào "${a.place}" (${vi(a.place)}).`;
  return `${say} "${a.where}" là ${WHERE_VI[a.where].replace('vào ', '').replace('lên ', '').replace('xuống ', '')}.`;
}

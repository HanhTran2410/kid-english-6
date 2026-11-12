// 🧩 Quest 4 — Mini Crossword (SPEC-quest.md mục 7): bộ ghép ô chữ (mỗi ô một chữ cái, digraph 2 ô, giao nhau theo
// chữ cái), kiểm tra lưới hợp lệ, sinh lượt 2 lưới. Hàm thuần.

import { shuffle } from './content.js';
import { toGraphemes, learnedGraphemes } from '../phonics.js';

export const GRID_SIZE = 6;
const STEP = { across: [0, 1], down: [1, 0] };
const key = (r, c) => `${r},${c}`;

/** Ô của một từ trong lưới. */
export const entryCells = (e) => [...e.word].map((ch, i) => ({ row: e.row + STEP[e.dir][0] * i, col: e.col + STEP[e.dir][1] * i, letter: ch }));

/**
 * Ghép `words` thành ô chữ ≤ size × size (7.5): từ dài nhất nằm ngang trước, từ sau giao với từ đã đặt ở một chữ cái chung
 * theo chiều ngược lại; không hai ô kề nhau tạo "từ" thừa, không chạm cạnh từ khác ngoài chỗ giao. Thử tối đa 200 thứ tự.
 * @returns {{ rows: number, cols: number, cells: Array<{row, col, letter, entries: number[]}>, entries: Array<{word, row, col, dir}> } | null}
 */
export function buildCrossword(words, rand, { size = GRID_SIZE } = {}) {
  if (!words.length || words.some((w) => w.length > size) || new Set(words).size !== words.length) return null;
  for (let attempt = 0; attempt < 200; attempt++) {
    const [first, ...rest] = [...words].sort((a, b) => b.length - a.length);
    const order = [first, ...shuffle(rand, rest)];
    const grid = new Map(); // "r,c" → { letter, dirs: Set }
    const entries = [];
    const put = (e) => {
      for (const c of entryCells(e)) {
        const cell = grid.get(key(c.row, c.col)) ?? { letter: c.letter, dirs: new Set() };
        cell.dirs.add(e.dir);
        grid.set(key(c.row, c.col), cell);
      }
      entries.push(e);
    };
    put({ word: first, row: 0, col: 0, dir: 'across' });
    let ok = true;
    for (const word of order.slice(1)) {
      const options = [];
      for (const placed of entries) {
        const dir = placed.dir === 'across' ? 'down' : 'across';
        entryCells(placed).forEach((pc) => {
          for (let i = 0; i < word.length; i++) {
            if (word[i] !== pc.letter) continue;
            const e = { word, row: pc.row - STEP[dir][0] * i, col: pc.col - STEP[dir][1] * i, dir };
            if (fits(grid, entries, e, size)) options.push(e);
          }
        });
      }
      if (!options.length) {
        ok = false;
        break;
      }
      put(options[Math.floor(rand() * options.length)]);
    }
    if (ok) return normalize(entries);
  }
  return null;
}

function bounds(entries) {
  const cells = entries.flatMap(entryCells);
  const rows = cells.map((c) => c.row);
  const cols = cells.map((c) => c.col);
  return { r0: Math.min(...rows), c0: Math.min(...cols), rows: Math.max(...rows) - Math.min(...rows) + 1, cols: Math.max(...cols) - Math.min(...cols) + 1 };
}

/** Từ mới đặt được không: chữ trùng ở ô đã có (ô giao, khác chiều), ô mới không kề cạnh ô khác, hai đầu trống, lưới ≤ size. */
function fits(grid, entries, e, size) {
  const [dr, dc] = STEP[e.dir];
  const at = (r, c) => grid.get(key(r, c));
  if (at(e.row - dr, e.col - dc) || at(e.row + dr * e.word.length, e.col + dc * e.word.length)) return false;
  let crossings = 0;
  for (const c of entryCells(e)) {
    const cell = at(c.row, c.col);
    if (cell) {
      if (cell.letter !== c.letter || cell.dirs.has(e.dir)) return false;
      crossings++;
    } else if (at(c.row + dc, c.col + dr) || at(c.row - dc, c.col - dr)) {
      return false; // ô mới chạm cạnh ô của từ khác (tạo "từ" thừa)
    }
  }
  if (!crossings || crossings === e.word.length) return false;
  const b = bounds([...entries, e]);
  return b.rows <= size && b.cols <= size;
}

/** Dời lưới về góc (0, 0) và gom ô: mỗi ô một dữ liệu, ô giao nhau thuộc cả hai từ. */
function normalize(entries) {
  const b = bounds(entries);
  const out = entries.map((e) => ({ ...e, row: e.row - b.r0, col: e.col - b.c0 }));
  const cells = new Map();
  out.forEach((e, i) => {
    for (const c of entryCells(e)) {
      const cell = cells.get(key(c.row, c.col)) ?? { row: c.row, col: c.col, letter: c.letter, entries: [] };
      cell.entries.push(i);
      cells.set(key(c.row, c.col), cell);
    }
  });
  return { rows: b.rows, cols: b.cols, cells: [...cells.values()], entries: out };
}

/**
 * Lưới hợp lệ (test 7.5): trong size × size; mọi dãy ≥ 2 ô liền nhau theo hàng / cột đúng là một từ của lưới; các từ
 * nối liền nhau qua ô giao.
 */
export function validCrossword(cw, size = GRID_SIZE) {
  if (!cw || cw.rows > size || cw.cols > size) return false;
  const grid = new Map(cw.cells.map((c) => [key(c.row, c.col), c.letter]));
  for (const e of cw.entries) for (const c of entryCells(e)) if (grid.get(key(c.row, c.col)) !== c.letter) return false;
  const runs = [];
  for (const dir of ['across', 'down']) {
    const [dr, dc] = STEP[dir];
    for (const c of cw.cells) {
      if (grid.has(key(c.row - dr, c.col - dc))) continue;
      let word = '';
      for (let r = c.row, k = c.col; grid.has(key(r, k)); r += dr, k += dc) word += grid.get(key(r, k));
      if (word.length >= 2) runs.push(`${dir}:${c.row},${c.col}:${word}`);
    }
  }
  const want = cw.entries.map((e) => `${e.dir}:${e.row},${e.col}:${e.word}`);
  if (runs.length !== want.length || !want.every((w) => runs.includes(w))) return false;
  // Liền mạch: đi từ từ đầu qua ô giao tới mọi từ.
  const seen = new Set([0]);
  for (let changed = true; changed;) {
    changed = false;
    for (const c of cw.cells) {
      if (c.entries.some((i) => seen.has(i)) && c.entries.some((i) => !seen.has(i))) {
        c.entries.forEach((i) => seen.add(i));
        changed = true;
      }
    }
  }
  return seen.size === cw.entries.length;
}

const ALL_GRAPHEMES = learnedGraphemes(7);
/** Từ có digraph (sh, ch, ee, oo…): ít grapheme hơn chữ cái → mỗi chữ cái một ô (7.1). */
export const hasDigraph = (word) => (toGraphemes(word, ALL_GRAPHEMES)?.length ?? word.length) < word.length;

/** Mức (7.3): độ dài từ, số từ mỗi lưới, số chữ nhiễu trong khay. */
export const Q4_LEVELS = {
  1: { min: 3, max: 3, counts: [3], extras: 0 },
  2: { min: 3, max: 4, counts: [3, 4], extras: 1 },
  3: { min: 3, max: 5, counts: [4], extras: 2 },
};
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Một lượt Quest 4 (7): 2 lưới, mỗi từ một mục (6–8 mục). Từ của kho 2.2 (có hình, a–z) thuộc nhóm đã học — không cần
 * qua 2.3. Mức 1 chỉ từ CVC 3 chữ; mức 3 mỗi lưới có ≥ 1 từ digraph nếu kho có. Không ghép được sau 20 bộ từ → [] (2.5).
 * Mục: { id: word, word, grid: { rows, cols, cells, entries }, gridIndex, entry, first, extras, kind }.
 */
export function makeQ4(level, rand, pool, lp) {
  const cfg = Q4_LEVELS[level];
  const learnedLetters = [...LETTERS].filter((ch) => [...lp.graphemes].some((g) => g.includes(ch)));
  const words = pool.words.map((w) => w.en)
    .filter((w) => /^[a-z]+$/.test(w) && w.length >= cfg.min && w.length <= cfg.max && (level > 1 || !hasDigraph(w)));
  const digraphs = words.filter(hasDigraph);
  const items = [];
  const used = new Set();
  for (let g = 0; g < 2; g++) {
    let cw = null;
    for (let tries = 0; tries < 20 && !cw; tries++) {
      const count = cfg.counts[Math.floor(rand() * cfg.counts.length)];
      if (words.length < count) break;
      // Ưu tiên từ chưa dùng ở lưới trước; mức 3 có một từ digraph.
      const fresh = shuffle(rand, words.filter((w) => !used.has(w)));
      const old = shuffle(rand, words.filter((w) => used.has(w)));
      let order = [...fresh, ...old];
      if (level === 3 && digraphs.length) {
        const d = shuffle(rand, digraphs)[0];
        order = [d, ...order.filter((w) => w !== d)];
      }
      // Bộ từ: từ sau phải có chữ chung với một từ đã chọn (không thì chắc chắn không ghép được).
      const pick = [order[0]];
      for (const w of order.slice(1)) {
        if (pick.length < count && pick.some((p) => [...w].some((ch) => p.includes(ch)))) pick.push(w);
      }
      if (pick.length === count) cw = buildCrossword(pick, rand);
    }
    if (!cw) return [];
    cw.entries.forEach((e, i) => {
      used.add(e.word);
      const others = shuffle(rand, learnedLetters.filter((ch) => !e.word.includes(ch)));
      items.push({
        id: e.word, word: e.word, grid: cw, gridIndex: g, entry: i, first: i === 0, extras: others.slice(0, cfg.extras),
        kind: hasDigraph(e.word) ? 'q4:digraph' : 'q4:cvc',
      });
    });
  }
  return items;
}

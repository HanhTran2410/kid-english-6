// 🧩 Quest 4 — bộ ghép ô chữ + sinh lượt (SPEC-quest.md 7.5, QU-21 / 22 / 23): 500 lần × mỗi mức với rand cố định, bộ
// từ không có chữ chung → null, từ có chữ lặp, digraph 2 ô, nhiều giao điểm; mọi lưới trả về hợp lệ.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_LESSONS } from '../../app/js/data/builtin-lessons.js';
import { learnedPhonics, questPool } from '../../app/js/quest/content.js';
import { buildCrossword, validCrossword, entryCells, hasDigraph, makeQ4, Q4_LEVELS, GRID_SIZE } from '../../app/js/quest/crossword.js';
import { questKindsAt, questRef, questExplainVi, BUILTIN_QUESTS } from '../../app/js/quest/quest.js';
import { QUESTIONS, translateQuestion } from '../../app/js/captions.js';
import { seeded } from '../../app/js/math/math.js';

const setup = (groups) => {
  const lp = learnedPhonics(groups);
  return { lp, pool: questPool(BUILTIN_LESSONS, lp) };
};

test('buildCrossword: lưới hợp lệ, ô giao nhau là một ô dùng chung, đúng chữ của cả hai từ (QU-21)', () => {
  for (let run = 0; run < 300; run++) {
    const cw = buildCrossword(['cat', 'hat', 'ant', 'tap'], seeded(run));
    assert.ok(validCrossword(cw), `run ${run}`);
    assert.equal(cw.entries.length, 4);
    const shared = cw.cells.filter((c) => c.entries.length === 2);
    assert.ok(shared.length >= 3, 'mỗi từ sau giao với từ trước');
    for (const c of shared) {
      for (const i of c.entries) {
        const at = entryCells(cw.entries[i]).find((x) => x.row === c.row && x.col === c.col);
        assert.equal(at.letter, c.letter);
      }
      assert.notEqual(cw.entries[c.entries[0]].dir, cw.entries[c.entries[1]].dir);
    }
    // Không trùng ô: số ô = tổng chữ − số ô giao.
    const total = cw.entries.reduce((n, e) => n + e.word.length, 0);
    assert.equal(cw.cells.length, total - shared.length);
  }
});

test('buildCrossword: không có chữ chung / từ quá dài / từ trùng → null (QU-23)', () => {
  assert.equal(buildCrossword(['cat', 'dog'], seeded(1)), null);
  assert.equal(buildCrossword(['sun', 'pig', 'cat'], seeded(1)), null);
  assert.equal(buildCrossword(['hammers'], seeded(1)), null);
  assert.equal(buildCrossword(['cat', 'cat'], seeded(1)), null);
  assert.equal(buildCrossword([], seeded(1)), null);
  // queen có "ee" liền nhau: tree và bee đều phải giao ở e → chạm cạnh nhau hoặc chạm queen → không ghép được.
  for (let run = 0; run < 50; run++) assert.equal(buildCrossword(['tree', 'queen', 'bee'], seeded(run)), null);
});

test('buildCrossword: chữ lặp (tree, moon, queen), digraph mỗi chữ cái một ô (QU-22), lưới ≤ 6 × 6', () => {
  for (const set of [['tree', 'rat', 'bee'], ['queen', 'tree', 'net'], ['ship', 'fish', 'chips', 'shop'], ['three', 'tree', 'bath']]) {
    let built = 0;
    for (let run = 0; run < 100; run++) {
      const cw = buildCrossword(set, seeded(run));
      if (!cw) continue;
      built++;
      assert.ok(validCrossword(cw), set.join());
      assert.ok(cw.rows <= GRID_SIZE && cw.cols <= GRID_SIZE);
    }
    assert.ok(built > 0, `ghép được ${set.join()}`);
  }
  const cw = buildCrossword(['ship', 'fish'], seeded(2));
  const ship = cw.entries.find((e) => e.word === 'ship');
  assert.deepEqual(entryCells(ship).map((c) => c.letter), ['s', 'h', 'i', 'p']); // sh = 2 ô
  assert.ok(hasDigraph('ship') && hasDigraph('moon') && !hasDigraph('cat') && !hasDigraph('frog'));
});

test('validCrossword bắt lưới sai: từ chạm cạnh tạo "từ" thừa, rời nhau, vượt 6 × 6', () => {
  const ok = buildCrossword(['cat', 'ant'], seeded(1));
  assert.ok(validCrossword(ok));
  // Hai từ ngang song song sát nhau → tạo các dãy dọc 2 chữ không phải từ.
  const touching = { rows: 2, cols: 3, entries: [{ word: 'cat', row: 0, col: 0, dir: 'across' }, { word: 'hat', row: 1, col: 0, dir: 'across' }] };
  touching.cells = [...entryCells(touching.entries[0]), ...entryCells(touching.entries[1])].map((c, k) => ({ ...c, entries: [k < 3 ? 0 : 1] }));
  assert.equal(validCrossword(touching), false);
  const apart = { rows: 3, cols: 3, entries: [{ word: 'cat', row: 0, col: 0, dir: 'across' }, { word: 'pin', row: 2, col: 0, dir: 'across' }] };
  apart.cells = [...entryCells(apart.entries[0]), ...entryCells(apart.entries[1])].map((c, k) => ({ ...c, entries: [k < 3 ? 0 : 1] }));
  assert.equal(validCrossword(apart), false);
  assert.equal(validCrossword({ ...ok, rows: 7 }), false);
  assert.equal(validCrossword(null), false);
});

test('makeQ4: 500 lượt × mỗi mức — 2 lưới hợp lệ, số mục = số từ (6–8), từ đúng độ dài mức, chữ nhiễu không có trong từ', () => {
  for (const groups of [[1], [1, 2, 3], [1, 2, 3, 4, 5, 6, 7]]) {
    const { lp, pool } = setup(groups);
    const learned = new Set(pool.words.map((w) => w.en));
    for (const level of [1, 2, 3]) {
      const cfg = Q4_LEVELS[level];
      let empty = 0;
      let digraphGrids = 0;
      for (let run = 0; run < 500; run++) {
        const items = makeQ4(level, seeded(run * 3 + level), pool, lp);
        if (!items.length) {
          empty++;
          continue;
        }
        assert.ok(items.length >= 6 && items.length <= 8, `${items.length} mục`);
        const grids = [...new Set(items.map((it) => it.grid))];
        assert.equal(grids.length, 2);
        for (const g of grids) {
          assert.ok(validCrossword(g));
          assert.ok(cfg.counts.includes(g.entries.length));
          if (g.entries.some((e) => hasDigraph(e.word))) digraphGrids++;
        }
        items.forEach((it, i) => {
          assert.equal(it.word, it.grid.entries[it.entry].word);
          assert.equal(it.first, it.entry === 0);
          if (i) assert.ok(it.gridIndex > items[i - 1].gridIndex || it.entry === items[i - 1].entry + 1, 'mục theo thứ tự từ trong lưới');
          assert.ok(learned.has(it.word));
          assert.ok(it.word.length >= cfg.min && it.word.length <= cfg.max);
          if (level === 1) assert.ok(!hasDigraph(it.word));
          assert.equal(it.extras.length, cfg.extras);
          for (const x of it.extras) assert.ok(!it.word.includes(x));
          assert.equal(it.kind, hasDigraph(it.word) ? 'q4:digraph' : 'q4:cvc');
        });
      }
      assert.ok(empty <= 10, `nhóm ${groups.join('')} mức ${level}: ${empty} lượt không ghép được`);
      if (level === 3 && groups.length === 7) assert.ok(digraphGrids > 900, 'mức 3 mỗi lưới có từ digraph');
    }
  }
});

test('makeQ4: kho không ghép được → [] (không bao giờ lưới sai); khóa theo từ, kiểu câu, câu Olly có phụ đề', () => {
  assert.deepEqual(makeQ4(1, seeded(1), { words: [{ en: 'cat' }, { en: 'dog' }, { en: 'sun' }] }, learnedPhonics([1, 2, 3])), []);
  assert.deepEqual(questKindsAt('q4', 1), ['q4:cvc']);
  assert.deepEqual(questKindsAt('q4', 3), ['q4:cvc', 'q4:digraph']);
  assert.deepEqual(questRef(BUILTIN_QUESTS[3], { id: 'ship' }), { lessonId: 'quest-q4', activity: 'cross', itemId: 'ship' });
  assert.match(questExplainVi('q4', { word: 'ship' }, { byWord: new Map([['ship', { vi: 'con tàu' }]]) }), /con tàu.*4 chữ: s – h – i – p/);
  for (const q of ['tapPicture', 'spellPicture']) assert.ok(translateQuestion(QUESTIONS[q]()), q);
});

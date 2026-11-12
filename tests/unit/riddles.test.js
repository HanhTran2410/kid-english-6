// 🧩 Quest 3 — dữ liệu câu đố (SPEC-quest.md 6.3, review bảng câu đố RD-01 → RD-18): đủ 67 từ có hình, đủ trường,
// đọc được (máy tính nhóm), đáp án duy nhất theo đặc điểm câu 2, nhiễu cùng loại không mượn loại khác.
// RD-11 / RD-12 / RD-16 (ngữ pháp, nghĩa câu tổng kết, nghĩa theo hình) do bố mẹ duyệt QUEST-RIDDLES.md;
// RD-08 / RD-14 / RD-15 / RD-17 (nhiễu đã học, kho < 3 từ, không trùng trong lượt, vị trí đáp án) test ở bộ sinh Quest 3.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_LESSONS } from '../../app/js/data/builtin-lessons.js';
import { wordsOf } from '../../app/js/quest/content.js';
import {
  RIDDLES, TRAITS, KINDS, NOT_DECODABLE, readFrom, distractorsFor, choicesAt, traitsOf,
} from '../../app/js/quest/riddles.js';

const pictured = new Map();
for (const l of BUILTIN_LESSONS) {
  if (l.track !== 'phonics') continue;
  for (const w of l.words) if (w.emoji && !pictured.has(w.en)) pictured.set(w.en, { group: l.group, emoji: w.emoji });
}
const ALL = [...pictured.keys()];

test('RD-01 / 02: đúng 67 từ có hình, không thiếu, không trùng; mỗi từ có emoji', () => {
  const words = RIDDLES.map((r) => r.word);
  assert.equal(new Set(words).size, words.length);
  assert.deepEqual([...words].sort(), [...ALL].sort());
  assert.equal(words.length, 67);
  for (const w of words) assert.ok(pictured.get(w).emoji, w);
});

test('RD-03 / 10: mỗi câu đố có loại, ≥ 1 cặp gợi ý đủ 2 câu Anh + 2 câu Việt + đặc điểm, câu tổng kết Anh + Việt', () => {
  for (const r of RIDDLES) {
    assert.ok(KINDS[r.kind], r.word);
    assert.ok(r.clues.length >= 1, r.word);
    for (const c of r.clues) {
      assert.equal(c.en.length, 2, r.word);
      assert.equal(c.vi.length, 2, r.word);
      for (const s of [...c.en, ...c.vi]) assert.ok(s.trim(), r.word);
      assert.ok(TRAITS[c.trait], `${r.word}: ${c.trait}`);
    }
    assert.ok(r.sum.trim() && r.sumVi.trim(), r.word);
  }
});

test('RD-04 / 05 / 13: nhóm đọc được tính bằng canRead — mỗi từ có cặp gợi ý đọc được, câu tổng kết đọc được khi xong nhóm 7', () => {
  for (const r of RIDDLES) {
    const g = pictured.get(r.word).group;
    assert.ok(r.clues.some((c) => readFrom(c.en.join(' '), g) <= 7), `${r.word}: không cặp nào đọc được`);
    assert.ok(readFrom(r.sum, g) <= 7, `${r.word}: tổng kết`);
  }
  // Tính theo nhóm thật, không ghi tay: "It is hot." cần o (nhóm 3); "It can swim." cần w (nhóm 5).
  assert.equal(readFrom('It is hot.'), 3);
  assert.equal(readFrom('It can swim.'), 5);
  assert.equal(readFrom('We see it.'), 4);
});

test('RD-04: không có từ ghép được bằng chữ đã học nhưng đọc theo âm sai (NOT_DECODABLE)', () => {
  const bad = new Set(NOT_DECODABLE);
  for (const r of RIDDLES) {
    for (const t of [...r.clues.flatMap((c) => c.en), r.sum]) {
      for (const w of wordsOf(t)) assert.ok(!bad.has(w), `${r.word}: "${w}" trong "${t}"`);
    }
  }
});

test('RD-06 / 07: câu 2 đúng với đáp án; mọi nhiễu đều sai câu 2 → chỉ đáp án khớp cả hai câu', () => {
  for (const [t, [, words]] of Object.entries(TRAITS)) {
    for (const w of words) assert.ok(pictured.has(w), `${t}: ${w} không phải từ có hình`);
  }
  for (const r of RIDDLES) {
    for (const c of r.clues) {
      assert.ok(TRAITS[c.trait][1].includes(r.word), `${r.word}: "${c.en[1]}"`);
      for (const lv of [1, 2, 3]) {
        for (const d of distractorsFor(r, c, ALL, lv)) {
          assert.ok(!TRAITS[c.trait][1].includes(d), `${r.word}: nhiễu ${d} cũng đúng "${c.en[1]}"`);
          assert.notEqual(d[0], r.word[0], `${r.word}: nhiễu ${d} cùng chữ đầu`);
        }
      }
    }
  }
  // Ví dụ trong spec: "It can swim." → ếch, chó không làm nhiễu cho cá.
  const fish = RIDDLES.find((r) => r.word === 'fish');
  const swim = fish.clues.find((c) => c.trait === 'swim');
  assert.ok(!distractorsFor(fish, swim, ALL, 2).includes('frog'));
  assert.ok(!distractorsFor(fish, swim, ALL, 2).includes('dog'));
  assert.ok(traitsOf('frog').includes('swim'));
});

test('RD-09 / 18: mức 1 nhiễu khác loại; mức 2–3 chỉ cùng loại, không mượn loại khác — thiếu thì bớt lựa chọn hoặc bỏ mức', () => {
  for (const r of RIDDLES) {
    for (const c of r.clues) {
      for (const d of distractorsFor(r, c, ALL, 1)) assert.notEqual(RIDDLES.find((x) => x.word === d).kind, r.kind);
      for (const lv of [2, 3]) {
        for (const d of distractorsFor(r, c, ALL, lv)) assert.equal(RIDDLES.find((x) => x.word === d).kind, r.kind);
      }
      assert.equal(choicesAt(r, c, ALL, 1), 3, `${r.word}: mức 1 luôn đủ 3 hình`);
    }
  }
  // Màu chỉ có red → không có mức 2–3; con vật đủ 4 lựa chọn.
  const red = RIDDLES.find((r) => r.word === 'red');
  assert.equal(choicesAt(red, red.clues[0], ALL, 2), 0);
  const frog = RIDDLES.find((r) => r.word === 'frog');
  assert.equal(choicesAt(frog, frog.clues[0], ALL, 3), 4);
  // Kho chỉ có từ bé đã học: nhiễu không lấy ngoài kho.
  assert.deepEqual(distractorsFor(frog, frog.clues[0], ['frog', 'cat', 'dog'], 2), ['cat', 'dog']);
});

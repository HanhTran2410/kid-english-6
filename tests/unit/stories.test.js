// 📖 T12 Story sums — câu đố viết sẵn (SPEC-math2.md 3.5, MATH-11 / 12 / 13): phép tính suy từ dữ liệu câu chuyện,
// không từ từ khóa; bộ kiểm tra bắt câu đố lệch dữ liệu.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STORIES, STORY_BY_ID, TRICKS, storyMath, storyLevel, storyProblems, storyAsk } from '../../app/js/math/stories.js';
import { T7_PEOPLE, T7_THINGS } from '../../app/js/math/math.js';

test('câu đố: 24 câu, 12 cộng – 12 trừ, dữ liệu hợp lệ, người / đồ có hình, id không trùng', () => {
  assert.equal(STORIES.length, 24);
  assert.equal(new Set(STORIES.map((s) => s.id)).size, 24);
  for (const s of STORIES) {
    assert.deepEqual(storyProblems(s), [], s.id);
    assert.ok(T7_THINGS[s.thing], s.thing);
    assert.ok(T7_PEOPLE[s.owner] || ['pond', 'tank', 'sky'].includes(s.owner), s.owner);
  }
  const ops = STORIES.map((s) => storyMath(s).op);
  assert.equal(ops.filter((o) => o === '+').length, 12);
  // Mỗi mức đủ 4 câu mỗi phép (lượt 4 + 4, không lặp).
  for (const lv of [1, 2, 3]) {
    for (const op of ['+', '−']) assert.ok(STORIES.filter((s) => storyLevel(s) <= lv && storyMath(s).op === op).length >= 4, `mức ${lv} ${op}`);
  }
  for (const s of STORIES.filter((x) => storyLevel(x) === 1)) assert.ok(Math.max(s.start, s.change, storyMath(s).answer) <= 5);
});

test('MATH-11 / 12: gives hai chiều, more trong bài trừ — phép tính theo owner, không theo từ khóa', () => {
  const gives = STORIES.filter((s) => / gives /.test(s.text));
  assert.ok(gives.some((s) => storyMath(s).op === '+') && gives.some((s) => storyMath(s).op === '−'));
  const moreSub = STORIES.filter((s) => /\bmore\b/.test(s.text) && storyMath(s).op === '−');
  assert.ok(moreSub.length >= 2);
  const plainAdd = STORIES.filter((s) => storyMath(s).op === '+' && !/\b(more|altogether)\b/.test(s.text));
  assert.ok(plainAdd.length >= 2);
  for (const k of Object.keys(TRICKS)) assert.ok(STORIES.filter((s) => s.trick === k).length >= 2, k);
  assert.deepEqual(storyMath(STORIES.find((s) => s.text.startsWith('Tom has 8 sweets. Tom gives Anna'))), { op: '−', a: 8, b: 3, answer: 5 });
});

test('MATH-13: bộ kiểm tra bắt câu đố lệch dữ liệu', () => {
  const ok = STORIES[0];
  assert.ok(storyProblems({ ...ok, start: 4 }).length);
  assert.ok(storyProblems({ ...ok, hint: 'Anna gives him 4 more' }).length);
  assert.ok(storyProblems({ ...ok, owner: 'Anna', text: ok.text.replace('does Tom have', 'does he have') }).length);
  assert.ok(storyProblems({ ...ok, vi: ok.vi.replace('3 quả', '4 quả') }).length);
  assert.ok(storyProblems({ ...ok, direction: 'decrease', start: 2, change: 3 }).some((p) => p.includes('ngoài 0–10')));
});

test('câu hỏi gợi ý khi sai dấu: theo người / chỗ và đồ vật, có tiếng Việt (review 2026-11-13)', () => {
  for (const s of STORIES) {
    const a = storyAsk(s);
    assert.match(a.en, /more or fewer .*?$/, s.id);
    assert.ok(a.en.includes(s.thing) && a.vi.endsWith('?'), s.id);
  }
  assert.equal(storyAsk(STORY_BY_ID.get('s14')).en, 'Are there more or fewer ducks in the pond now?');
  assert.equal(storyAsk(STORY_BY_ID.get('s13')).vi, 'Bây giờ Tom có nhiều táo hơn hay ít táo hơn?');
});

test('MATH-13 (draft3): số đúng vai trò — đổi chỗ số ban đầu / số thay đổi, hint sai số → báo lỗi', () => {
  const ok = STORY_BY_ID.get('s01'); // Tom has 2 apples. Anna gives him 3 more.
  const swapped = { ...ok, text: ok.text.replace('has 2', 'has X').replace('him 3', 'him 2').replace('has X', 'has 3'), hint: 'Anna gives him 2 more' };
  assert.ok(storyProblems(swapped).length, 'số đổi vai trò');
  assert.ok(storyProblems({ ...ok, hintVi: 'Anna cho Tom thêm quả' }).length);
  assert.ok(storyProblems({ ...ok, text: ok.text.replace('Tom has 2', 'Anna has 2') }).length, 'câu đầu không nói owner');
});

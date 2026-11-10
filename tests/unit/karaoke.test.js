// Karaoke (SPEC-ta-tranh 5.4) và Đọc câu (SPEC 3.1.5): âm tiết, trọng số, lịch sáng, hiệu chỉnh; câu có sẵn đọc được.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syllables, displayWords, wordWeights, schedule, calibrate, initialMsPerUnit, activeIndex, MIN_WORD_MS } from '../../app/js/karaoke.js';
import { BUILTIN_LESSONS } from '../../app/js/data/builtin-lessons.js';
import { learnedGraphemes, toGraphemes, TRICKY_BY_GROUP } from '../../app/js/phonics.js';
import { tokenize } from '../../app/js/text.js';
import { RESULT } from '../../app/js/progress.js';
import { sentenceResult } from '../../app/js/read/sentence-stages.js';

test('âm tiết: cụm nguyên âm, bỏ e câm cuối, y ở giữa / cuối là nguyên âm; tối thiểu 1', () => {
  assert.deepEqual(['cat', 'rabbit', 'cake', 'little', 'happy', 'yes', 'the', 'I', 'queen', 'sister'].map(syllables), [1, 2, 1, 2, 2, 1, 1, 1, 1, 2]);
  assert.equal(syllables('!!'), 1);
});

test('trọng số: dấu phẩy +1, dấu chấm giữa câu +2, dấu cuối câu không cộng', () => {
  const w = displayWords('Hi, Tom. I see a cat!');
  assert.deepEqual(w, ['Hi,', 'Tom.', 'I', 'see', 'a', 'cat!']);
  assert.deepEqual(wordWeights(w), [2, 3, 1, 1, 1, 1]);
});

test('lịch sáng: liền nhau, mỗi từ tối thiểu 250 ms; từ đang sáng theo thời gian', () => {
  const slots = schedule(['I', 'see', 'a', 'rabbit.'], 200);
  assert.deepEqual(slots.map((s) => s.end - s.start), [MIN_WORD_MS, MIN_WORD_MS, MIN_WORD_MS, 400]);
  for (let i = 1; i < slots.length; i++) assert.equal(slots[i].start, slots[i - 1].end);
  assert.equal(activeIndex(slots, 0), 0);
  assert.equal(activeIndex(slots, 260), 1);
  assert.equal(activeIndex(slots, 10_000), -1);
});

test('hiệu chỉnh: 70% cũ + 30% đo được, kẹp 120–700; tốc độ chậm → ms mỗi đơn vị lớn hơn', () => {
  const words = ['I', 'see', 'a', 'cat.']; // 4 đơn vị
  assert.equal(calibrate(300, 2000, words), 300 * 0.7 + 500 * 0.3);
  assert.equal(calibrate(300, 0, words), 300);
  assert.equal(calibrate(300, 100_000, words), 700);
  assert.ok(initialMsPerUnit(0.7) > initialMsPerUnit(1));
});

test('câu có sẵn: mọi từ đọc được bằng âm đã học tới nhóm đó, hoặc là tricky word đã học; mỗi câu có hình + nghĩa', () => {
  for (const l of BUILTIN_LESSONS) {
    const learned = learnedGraphemes(l.group);
    const tricky = new Set(Object.entries(TRICKY_BY_GROUP).filter(([g]) => Number(g) <= l.group).flatMap(([, ws]) => ws.map((w) => w.toLowerCase())));
    assert.ok(l.sentences.length >= 3, l.id);
    assert.ok(l.activities.some((a) => a.type === 'sentence'));
    for (const s of l.sentences) {
      assert.ok(s.emoji && s.vi, s.en);
      for (const w of tokenize(s.en)) {
        assert.ok(tricky.has(w) || toGraphemes(w, learned), `${l.id}: "${w}" trong "${s.en}" chưa đọc được`);
      }
    }
  }
});

test('kết quả đọc câu: đủ từ → độc lập; một phần → có gợi ý; không từ nào / không nghe được → luyện', () => {
  const words = ['the', 'cat', 'can', 'nap'];
  assert.equal(sentenceResult(words, new Set(words)), RESULT.INDEPENDENT);
  assert.equal(sentenceResult(words, new Set(['cat', 'nap'])), RESULT.HELPED);
  assert.equal(sentenceResult(words, new Set()), RESULT.PRACTICED);
  assert.equal(sentenceResult(words, null), RESULT.PRACTICED);
});

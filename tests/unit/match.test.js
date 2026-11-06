import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matches, keywordsFor, similarWord } from '../../app/js/match.js';

test('các cách nói gần đúng của "cow" đều tính đạt', () => {
  for (const heard of ['cow', 'cao', 'kow', 'a cow', 'Cow.', "It's a cow!", 'cows']) {
    assert.equal(matches(heard, ['cow']), true, heard);
  }
});

test('từ khác hẳn thì không đạt', () => {
  for (const heard of ['banana', 'elephant', '', 'hello there']) {
    assert.equal(matches(heard, ['cow']), false, heard);
  }
});

test('khớp với từ chính trong câu child: "moo" với "Moo moo!"', () => {
  const keys = keywordsFor('cow', 'Moo moo!');
  assert.deepEqual(keys, ['cow', 'moo']);
  assert.equal(matches('moo', keys), true);
  assert.equal(matches('mu mu', keys), true);
});

test('từ khóa bỏ các từ phụ như it\'s, a, yes', () => {
  assert.deepEqual(keywordsFor('cow', "Yes! It's a cow!"), ['cow']);
});

test('nhận nhiều phương án nhận dạng, chỉ cần một phương án khớp', () => {
  assert.equal(matches(['how', 'now', 'cow'], ['cow']), true);
});

test('cụm nhiều chữ "ice cream", kể cả nghe liền "icecream"', () => {
  assert.equal(matches('I want ice cream', ['ice cream']), true);
  assert.equal(matches('icecream', ['ice cream']), true);
  assert.equal(matches('ice', ['ice cream']), false);
});

test('từ dài cho phép sai 2 chữ', () => {
  assert.equal(similarWord('elefant', 'elephant'), true);
  assert.equal(similarWord('banana', 'bandana'), true);
});

test('so khớp chặt để chấm đọc: ship ≠ shop ≠ sheep; nhận dấu câu / chữ hoa / từ đồng âm bài cho phép', async () => {
  const { exactMatch } = await import('../../app/js/match.js');
  assert.equal(exactMatch('Ship.', 'ship'), true);
  assert.equal(exactMatch(['shop', 'a ship'], 'ship'), true);
  for (const heard of ['shop', 'sheep', 'ships', 'chip', '']) assert.equal(exactMatch(heard, 'ship'), false, heard);
  assert.equal(exactMatch('see', 'sea'), false);
  assert.equal(exactMatch('see', 'sea', ['see']), true);
  assert.equal(exactMatch('I like ice cream', 'ice cream'), true);
  assert.equal(exactMatch('icecream', 'ice cream'), false);
});

// Nhắc "còn một chút nữa" (SPEC 1.1): còn ≤ 2 phút của buổi → nhắc một lần mỗi buổi; học thêm → nhắc lại được; tắt giới hạn → không nhắc.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSession, addTime, extend, timeLeftMs, shouldWarnAlmostUp, ALMOST_UP_MS } from '../../app/js/session.js';

const MIN = 60 * 1000;

test('timeLeftMs: còn lại = giới hạn + học thêm − đã học, không âm; tắt giới hạn → null', () => {
  const s = addTime(newSession(0), 15 * MIN, 0);
  assert.equal(timeLeftMs(s, 20), 5 * MIN);
  assert.equal(timeLeftMs(extend(s, 0), 20), 20 * MIN);
  assert.equal(timeLeftMs(addTime(s, 10 * MIN, 0), 20), 0);
  assert.equal(timeLeftMs(s, null), null);
});

test('shouldWarnAlmostUp: chỉ khi còn (0, 2 phút], chưa nhắc trong buổi; học thêm → nhắc lại được', () => {
  const at = (used) => addTime(newSession(0), used, 0);
  assert.equal(shouldWarnAlmostUp(at(17 * MIN), 20), false); // còn 3 phút
  assert.equal(shouldWarnAlmostUp(at(20 * MIN - ALMOST_UP_MS), 20), true); // còn đúng 2 phút
  assert.equal(shouldWarnAlmostUp(at(19.5 * MIN), 20), true);
  assert.equal(shouldWarnAlmostUp(at(20 * MIN), 20), false); // hết giờ rồi → Olly đi ngủ, không nhắc
  assert.equal(shouldWarnAlmostUp({ ...at(19 * MIN), warned: true }, 20), false);
  assert.equal(shouldWarnAlmostUp(at(19 * MIN), null), false);
  const extended = extend({ ...at(19 * MIN), warned: true }, 0);
  assert.equal(shouldWarnAlmostUp(addTime(extended, 15 * MIN, 0), 20), true);
});

// ---------- Ôn thẻ tricky quá hạn (SPEC 3.1.4) ----------
import { dueTrickyCards, TRICKY_REVIEW_MAX } from '../../app/js/progress.js';

test('dueTrickyCards: thẻ đến hạn, quá hạn lâu nhất trước, cùng hạn thì hộp thấp trước, bỏ từ của bài sắp học, tối đa 5', () => {
  const card = (w, nextAt, box = 1) => ({ key: `tricky/card/${w}`, lessonId: 'tricky', activity: 'card', itemId: w, nextAt, box });
  const records = [
    card('the', 50), card('was', 10, 2), card('he', 10, 0), card('to', 200), card('she', 90), card('we', 30), card('me', 40), card('do', 60),
    { key: 'x/blend/cat', lessonId: 'x', activity: 'blend', itemId: 'cat', nextAt: 1 },
    { key: 'tricky/card/are', lessonId: 'tricky', activity: 'card', itemId: 'are' }, // chưa có hạn
  ];
  assert.equal(TRICKY_REVIEW_MAX, 5);
  assert.deepEqual(dueTrickyCards(records, 100), ['he', 'was', 'we', 'me', 'the']);
  assert.deepEqual(dueTrickyCards(records, 100, { exclude: new Set(['he', 'the']) }), ['was', 'we', 'me', 'do', 'she']);
  assert.deepEqual(dueTrickyCards(records, 5), []);
});

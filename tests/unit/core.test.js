// Phần lõi của app: 4 khu học, câu chào, kho dữ liệu, tiến độ, thời gian buổi học.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { ZONES, ZONE_BY_ID, greeting } from '../../app/js/zones.js';
import { openDatabase, STORES } from '../../app/js/db.js';
import { loadSettings, saveSetting, DEFAULT_SETTINGS, VI_HELP_AFTER, needsVietnameseHelp } from '../../app/js/settings.js';
import { newSession, addTime, isTimeUp } from '../../app/js/session.js';

test('4 khu học theo thứ tự Read, Spell, Talk, Quest; mỗi khu có tên Anh / Việt, màu, câu mở đầu', () => {
  assert.deepEqual(ZONES.map((z) => z.id), ['read', 'spell', 'talk', 'quest']);
  for (const z of ZONES) {
    assert.ok(z.en && z.vi && z.emoji && z.color && z.intro, z.id);
    assert.equal(ZONE_BY_ID.get(z.id), z);
  }
});

test('câu chào: có tên bé thì gọi tên', () => {
  assert.equal(greeting('Minh'), 'Hi, Minh! What do you want to do today?');
  assert.equal(greeting('  '), 'Hi! What do you want to do today?');
  assert.equal(greeting(undefined), 'Hi! What do you want to do today?');
});

test('kho dữ liệu: đủ các kho; cài đặt mặc định + đã lưu', async () => {
  const db = await openDatabase(`test-${Math.random()}`);
  assert.deepEqual([...db.idb.objectStoreNames].sort(), [...STORES].sort());

  assert.equal((await loadSettings(db)).characterName, DEFAULT_SETTINGS.characterName);
  await saveSetting(db, 'childName', 'Minh');
  assert.equal((await loadSettings(db)).childName, 'Minh');
  db.close();
});

test('giải thích tiếng Việt: mặc định bật; nói đúng một lần khi sai liên tiếp đủ VI_HELP_AFTER lần; tắt thì không nói', () => {
  const on = { ...DEFAULT_SETTINGS };
  assert.equal(on.explainVietnamese, true);
  assert.deepEqual([1, 2, 3, 4].map((n) => needsVietnameseHelp(on, n)), [false, true, false, false]);
  assert.equal(needsVietnameseHelp({ ...on, explainVietnamese: false }, VI_HELP_AFTER), false);
});

test('thời gian buổi học: mặc định 20 phút', () => {
  const s = addTime(newSession(0), 19 * 60 * 1000, 0);
  assert.equal(isTimeUp(s, DEFAULT_SETTINGS.limitMinutes), false);
  assert.equal(isTimeUp(addTime(s, 60 * 1000, 0), DEFAULT_SETTINGS.limitMinutes), true);
});

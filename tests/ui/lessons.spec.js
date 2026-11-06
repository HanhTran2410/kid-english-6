// Góc bố mẹ → Bài học (SPEC 5.5): nhập JSON lỗi → chỉ rõ lỗi; nhập đúng → lưu; trùng id → thay bài / lưu bài mới; xuất; xóa.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

const lesson = {
  version: 1,
  id: 'phonics-g1-test',
  track: 'phonics',
  group: 1,
  title: 'Sounds s a t',
  titleVi: 'Âm s a t',
  words: [
    { id: 'sat', en: 'sat', graphemes: ['s', 'a', 't'], sounds: ['s', 'a', 't'] },
    { id: 'pin', en: 'pin', graphemes: ['p', 'i', 'n'], sounds: ['p', 'i', 'n'], emoji: '📌' },
  ],
  activities: [{ type: 'blend', items: ['sat', 'pin'] }],
};

async function openLessons(page) {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Bài học' }).click();
  await expect(page.getByText('Chưa có bài nào')).toBeVisible();
}

const paste = async (page, data) => {
  await page.locator('.lesson-json').fill(typeof data === 'string' ? data : `\`\`\`json\n${JSON.stringify(data)}\n\`\`\``);
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
};

test('nhập bài: JSON lỗi bị từ chối và chỉ rõ chỗ sai; JSON đúng (bọc ```json) lưu được', async ({ page }) => {
  await openLessons(page);

  await paste(page, '{ "version": 1, ');
  await expect(page.locator('.notice.error')).toContainText('Không đọc được JSON');

  await paste(page, { ...lesson, title: '', words: [{ ...lesson.words[0], graphemes: ['s', 'a'] }, lesson.words[1]] });
  const err = page.locator('.notice.error');
  await expect(err).toContainText('Thiếu tên bài');
  await expect(err).toContainText('Từ số 1 ("sat"): "graphemes" có 2 ô nhưng "sounds" có 3 âm.');
  await expect(page.getByRole('button', { name: /Lưu bài/ })).toHaveCount(0);

  await paste(page, lesson);
  await expect(page.locator('.notice.info')).toContainText('Sounds s a t');
  await page.getByRole('button', { name: /Lưu bài/ }).click();
  await expect(page.locator('.lesson-row')).toHaveCount(1);
  await expect(page.locator('.lesson-row')).toContainText('2 từ · 0 câu · 1 hoạt động');
});

test('trùng id: lưu thành bài mới (id -2) hoặc thay bài cũ; xuất file; xóa có hỏi lại', async ({ page }) => {
  await openLessons(page);
  await paste(page, lesson);
  await page.getByRole('button', { name: /Lưu bài/ }).click();
  await expect(page.locator('.lesson-row')).toHaveCount(1);

  await paste(page, lesson);
  await page.getByRole('button', { name: /Lưu bài/ }).click();
  await page.getByRole('button', { name: 'Lưu thành bài mới' }).click();
  await expect(page.locator('.lesson-row')).toHaveCount(2);
  await expect(page.locator('.lesson-list')).toContainText('id: phonics-g1-test-2');

  // Thay bài cũ: bỏ từ "pin" → hỏi lại vì mất kết quả của mục đó.
  await paste(page, { ...lesson, title: 'Sounds s a t (mới)', words: [lesson.words[0]], activities: [{ type: 'blend', items: ['sat'] }] });
  await page.getByRole('button', { name: /Lưu bài/ }).click();
  await page.getByRole('button', { name: 'Thay bài cũ' }).click();
  await expect(page.locator('.dialog')).toContainText('(pin) sẽ mất kết quả học');
  await page.getByRole('button', { name: 'Thay bài' }).click();
  await expect(page.locator('.lesson-row')).toHaveCount(2);
  await expect(page.locator('.lesson-list')).toContainText('Sounds s a t (mới)');

  const download = page.waitForEvent('download');
  await page.locator('.lesson-row', { hasText: 'id: phonics-g1-test ·' }).getByRole('button', { name: /Xuất/ }).click();
  expect((await download).suggestedFilename()).toBe('phonics-g1-test.json');

  await page.locator('.lesson-row', { hasText: 'id: phonics-g1-test-2' }).getByRole('button', { name: /Xóa/ }).click();
  await page.getByRole('button', { name: 'Hủy' }).click();
  await expect(page.locator('.lesson-row')).toHaveCount(2);
  await page.locator('.lesson-row', { hasText: 'id: phonics-g1-test-2' }).getByRole('button', { name: /Xóa/ }).click();
  await page.locator('.dialog').getByRole('button', { name: 'Xóa' }).click();
  await expect(page.locator('.lesson-row')).toHaveCount(1);
});

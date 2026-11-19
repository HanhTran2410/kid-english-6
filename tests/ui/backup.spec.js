// 💾 Góc bố mẹ → Sao lưu / Khôi phục (SPEC 6.2): nhắc sao lưu; tạo file → lưu (tải về) → ghi ngày sao lưu, hết nhắc;
// khôi phục file ở "máy khác" (thay toàn bộ, hỏi lại 2 lần) → đủ dữ liệu; file không hợp lệ → báo lỗi; xóa dữ liệu học.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

const db = (page, fn, arg) => page.evaluate(fn, arg);

async function openBackup(page) {
  await fakeSpeech(page);
  await startApp(page);
  // Nhắc sao lưu sau 7 ngày kể từ lần đầu dùng app (chưa sao lưu lần nào).
  await db(page, () => window.kidEnglish6.setSetting('firstUseAt', Date.now() - 8 * 24 * 3600 * 1000));
  await openParent(page);
  await expect(page.locator('.backup-remind')).toContainText('Chưa sao lưu lần nào');
  await page.getByRole('button', { name: 'Sao lưu / Khôi phục' }).click();
  await expect(page.getByRole('heading', { name: '💾 Sao lưu / Khôi phục' })).toBeVisible();
}

test('sao lưu → tải file .zip, ghi ngày, hết nhắc; khôi phục ở máy khác (thay toàn bộ) → có lại tiến độ + cài đặt + truyện', async ({ page, browser }) => {
  await openBackup(page);
  await db(page, async () => {
    const app = window.kidEnglish6;
    await app.setSetting('childName', 'Bông');
    await app.db.put('progress', { key: 'lesson:story-g1-pip', lessonId: 'story-g1-pip', part: '', plays: 1, completedAt: 1, bestStars: 3, lastStars: 3, lastAt: 1, listened: 2 });
    const { BUILTIN_STORIES } = await import('./js/story/builtin-stories.js');
    const s = structuredClone(BUILTIN_STORIES[0]);
    delete s.builtIn;
    await app.db.put('stories', { ...s, id: 'story-mine', title: 'My Story' });
  });
  await page.getByRole('button', { name: '1. Tạo bản sao lưu' }).click();
  await expect(page.locator('.backup-status')).toContainText('1 truyện');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: '2. Lưu file' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^olly-sao-luu-\d{4}-\d{2}-\d{2}\.zip$/);
  const file = await download.path();
  await expect.poll(() => db(page, () => window.kidEnglish6.settings.lastBackupAt)).toBeGreaterThan(0);
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await expect(page.locator('.backup-remind')).toHaveCount(0);

  // "Máy khác": trang mới, dữ liệu trống.
  const ctx = await browser.newContext();
  const b = await ctx.newPage();
  await fakeSpeech(b);
  await startApp(b);
  await openParent(b);
  await b.getByRole('button', { name: 'Sao lưu / Khôi phục' }).click();
  await b.getByLabel('File sao lưu').setInputFiles({ name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
  await expect(b.locator('.restore-box .notice.error')).toContainText('không mở được file zip');
  await b.getByLabel('File sao lưu').setInputFiles(file);
  await expect(b.locator('.restore-box .notice.info')).toContainText('1 truyện');
  await b.getByRole('button', { name: 'Thay thế toàn bộ' }).click();
  await b.locator('.dialog').getByRole('button', { name: 'Thay thế' }).click();
  await b.locator('.dialog').getByRole('button', { name: 'Chắc chắn' }).click();
  await expect(b.getByRole('heading', { name: 'Góc bố mẹ' })).toBeVisible();
  expect(await b.evaluate(() => window.kidEnglish6.settings.childName)).toBe('Bông');
  expect(await b.evaluate(() => window.kidEnglish6.db.get('progress', 'lesson:story-g1-pip').then((p) => p.bestStars))).toBe(3);
  expect(await b.evaluate(() => window.kidEnglish6.db.get('stories', 'story-mine').then((s) => s.title))).toBe('My Story');
  await ctx.close();
});

test('xóa toàn bộ dữ liệu học: hỏi lại 2 lần → tiến độ + ghi âm mất, truyện / cài đặt còn', async ({ page }) => {
  await openBackup(page);
  await db(page, async () => {
    const app = window.kidEnglish6;
    await app.setSetting('childName', 'Bông');
    await app.db.put('progress', { key: 'lesson:story-g1-pip', lessonId: 'story-g1-pip', part: '', plays: 1, completedAt: 1, bestStars: 3, lastStars: 3, lastAt: 1 });
  });
  await page.getByRole('button', { name: '🗑️ Xóa toàn bộ dữ liệu học' }).click();
  await page.locator('.dialog').getByRole('button', { name: 'Hủy' }).click();
  expect(await db(page, () => window.kidEnglish6.db.getAll('progress').then((a) => a.length))).toBe(1);
  await page.getByRole('button', { name: '🗑️ Xóa toàn bộ dữ liệu học' }).click();
  await page.locator('.dialog').getByRole('button', { name: 'Xóa' }).click();
  await page.locator('.dialog').getByRole('button', { name: 'Chắc chắn xóa' }).click();
  await expect.poll(() => db(page, () => window.kidEnglish6.db.getAll('progress').then((a) => a.length))).toBe(0);
  expect(await db(page, () => window.kidEnglish6.settings.childName)).toBe('Bông');
});

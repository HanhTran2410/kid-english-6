// Chuông thông báo (SPEC 6.3): có bản mới / bài mới trong Thư viện bài → 🔔 hiện ở màn chính + Góc bố mẹ; nhập bài từ chuông
// và từ Góc bố mẹ → Bài học → Thư viện bài. Mạng được giả lập bằng page.route.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

const lesson = {
  version: 1,
  id: 'phonics-g1-lib',
  track: 'phonics',
  title: 'Sounds s a t',
  words: [{ id: 'sat', en: 'sat', graphemes: ['s', 'a', 't'], sounds: ['s', 'a', 't'], emoji: '🪑' }],
  activities: [{ type: 'blend', items: ['sat'] }],
};
const body = JSON.stringify(lesson);
const index = { files: [{ file: '01-sat.json', size: body.length, id: lesson.id, title: lesson.title, titleVi: 'Âm s a t', track: 'phonics', emoji: '🪑' }] };

async function fakeNetwork(page, { version = '9.9.9' } = {}) {
  await page.route('**/sw.js', (route) => route.fulfill({ contentType: 'text/javascript', body: `const VERSION = '${version}';` }));
  await page.route('**/shared/index.json', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(index) }));
  await page.route('**/shared/01-sat.json', (route) => route.fulfill({ contentType: 'application/json', body }));
}

test('🔔 chỉ hiện khi có tin; bản mới + bài mới; nhập bài từ chuông; "Để sau" thì chuông ẩn', async ({ page }) => {
  await fakeSpeech(page);
  await fakeNetwork(page);
  await startApp(page);
  const bell = page.getByRole('button', { name: /Thông báo/ });

  // Lần đầu: cả thư viện thành mốc (không báo bài), chỉ báo bản mới.
  await page.evaluate(() => window.kidEnglish6.checkNotices());
  await expect(bell).toBeVisible();
  await expect(bell).toHaveAccessibleName('Thông báo (1)');

  // Máy chưa thấy bài nào → báo bài mới.
  await page.evaluate(async () => {
    await window.kidEnglish6.setSetting('librarySeen', []);
    await window.kidEnglish6.checkNotices();
  });
  await expect(bell).toHaveAccessibleName('Thông báo (2)');
  await bell.click();
  const panel = page.getByRole('dialog', { name: 'Thông báo' });
  await expect(panel).toContainText('Có bản mới 9.9.9');
  await expect(panel).toContainText('Sounds s a t');
  await panel.locator('.notice-row', { hasText: 'Sounds s a t' }).getByRole('button', { name: 'Nhập' }).click();
  await expect(page.locator('.toast')).toContainText('Đã nhập bài "Sounds s a t"');
  await expect.poll(() => page.evaluate(() => window.kidEnglish6.db.get('lessons', 'phonics-g1-lib').then((l) => l?.title))).toBe('Sounds s a t');
  await expect(bell).toHaveAccessibleName('Thông báo (1)');
  await panel.getByRole('button', { name: 'Đóng' }).click();

  // Bản app trùng bản đang dùng → không còn tin → chuông ẩn.
  await page.unroute('**/sw.js');
  await page.route('**/sw.js', (route) => route.fulfill({ contentType: 'text/javascript', body: `const VERSION = '0.0.1';` }));
  await page.evaluate(() => window.kidEnglish6.checkNotices());
  await expect(bell).toBeHidden();
});

test('Góc bố mẹ → Bài học → Thư viện bài: nhập bài cũ (chuông không báo), lần sau thành "Cập nhật"', async ({ page }) => {
  await fakeSpeech(page);
  await fakeNetwork(page, { version: '0.0.1' });
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Bài học' }).click();
  const row = page.locator('.lesson-row[data-file="01-sat.json"]');
  await expect(row).toContainText('Sounds s a t');
  await row.getByRole('button', { name: 'Nhập' }).click();
  await expect(row).toContainText('Đã có trên máy');
  await expect(row.getByRole('button', { name: 'Cập nhật' })).toBeVisible();
  await expect(page.locator('.my-lessons')).toContainText('id: phonics-g1-lib');
});

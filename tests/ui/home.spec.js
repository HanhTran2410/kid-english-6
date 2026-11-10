// Khung app: Bắt đầu → màn chính 4 khu học (khu chưa làm "Sắp mở") → Read → về; Góc bố mẹ → Cài đặt tên bé → Olly gọi tên.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent, spoken } from './helpers.js';

test('màn chính: Olly chào, 4 khu học; khu chưa làm "Sắp mở" → Olly nói tiếng Việt, không chuyển màn; Read → 🏠 về', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await expect(page.locator('.zone-card')).toHaveCount(4);
  for (const name of ['Tập đọc', 'Đánh vần và viết', 'Nói chuyện', 'Thử thách']) await expect(page.getByRole('button', { name })).toBeVisible();
  await expect.poll(() => spoken(page)).toContain('Hi! What do you want to do today?');

  await page.getByRole('button', { name: 'Nói chuyện' }).click();
  await expect(page.locator('.zone-card[data-zone="talk"] .soon-chip')).toHaveText('Sắp mở');
  await expect.poll(() => spoken(page)).toContain('Khu này Olly đang chuẩn bị nhé!');
  await expect(page.locator('.zone-card')).toHaveCount(4);

  await page.getByRole('button', { name: 'Tập đọc' }).click();
  await expect(page.locator('.lesson-card')).toHaveCount(7);
  await page.getByRole('button', { name: 'Về màn hình chính' }).click();
  await expect(page.locator('.zone-card')).toHaveCount(4);
});

test('Góc bố mẹ: nhấn giữ ⚙️ → Cài đặt → đặt tên bé → Olly chào bằng tên', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Cài đặt' }).click();
  const name = page.getByRole('textbox', { name: /Tên bé/ });
  await name.fill('Minh');
  await name.blur();
  await expect.poll(() => page.evaluate(() => window.kidEnglish6.settings.childName)).toBe('Minh');
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: /Về màn hình của bé/ }).click();
  await expect(page.locator('.home-hello')).toHaveText('Hi, Minh! What do you want to do today?');
  await expect.poll(() => spoken(page)).toContain('Hi, Minh! What do you want to do today?');
});

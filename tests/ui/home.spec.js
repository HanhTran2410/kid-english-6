// Khung app: Bắt đầu → màn chính 5 khu học (0.10.0: mọi khu đã mở, không còn "Sắp mở") → Read → về; Góc bố mẹ → Cài đặt tên bé → Olly gọi tên.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent, spoken } from './helpers.js';

test('màn chính: Olly chào, 5 khu học, không còn khu "Sắp mở" (QU-01); Thử thách mở danh sách trò; Read → 🏠 về', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await expect(page.locator('.zone-card')).toHaveCount(5);
  for (const name of ['Tập đọc', 'Đánh vần và viết', 'Nói chuyện', 'Thử thách']) await expect(page.getByRole('button', { name })).toBeVisible();
  await expect.poll(() => spoken(page)).toContain('Hi! What do you want to do today?');

  await expect(page.locator('.zone-card.soon')).toHaveCount(0);
  await page.getByRole('button', { name: 'Thử thách' }).click();
  await expect(page.locator('.lesson-card')).toHaveCount(2);
  await expect.poll(() => spoken(page)).toContain('Are you ready for a quest?');
  await page.getByRole('button', { name: 'Về màn hình chính' }).click();
  await expect(page.locator('.zone-card')).toHaveCount(5);

  await page.getByRole('button', { name: 'Tập đọc' }).click();
  await expect(page.locator('.lesson-card')).toHaveCount(7);
  await page.getByRole('button', { name: 'Về màn hình chính' }).click();
  await expect(page.locator('.zone-card')).toHaveCount(5);
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

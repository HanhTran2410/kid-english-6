// Khu ✏️ Spell 0.3: nghe – xếp ô (chạm ô trong khay → vào chỗ trống) + điền ô thiếu, bài nhóm 1.
// Từ 1: xếp sai một lượt (ô sai rung, về khay) → HELPED. Từ 2: sai 2 lượt → giải thích tiếng Việt + xếp sẵn → MISSED.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, spoken } from './helpers.js';

test('Spell: xếp ô + điền ô thiếu bài nhóm 1 → sao riêng của khu Spell; sai 2 lượt → giải thích tiếng Việt', async ({ page }) => {
  test.setTimeout(240_000);
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Đánh vần và viết' }).click();
  await expect(page.locator('.read-title')).toHaveText('✏️ Spell');
  await expect(page.locator('.lesson-card')).toHaveCount(3);
  await page.locator('.lesson-card[data-lesson="phonics-g1"]').click();
  const lesson = await page.evaluate(async () => (await import('./js/data/builtin-lessons.js')).BUILTIN_BY_ID.get('phonics-g1'));
  const word = (en) => lesson.words.find((w) => w.en === en);
  const tap = (loc) => loc.click({ timeout: 1000 }).catch(() => {});

  let sawViHelp = false;
  const wrongPlan = new Map(); // từ → số lượt còn phải xếp sai
  for (let i = 0; i < 3000; i++) {
    if (await page.locator('.done-panel').isVisible()) break;
    if (await page.locator('.vi-help').isVisible()) sawViHelp = true;
    const asks = (await spoken(page)).filter((s) => s.startsWith('Spell: '));
    const emptySlot = page.locator('.slot-row .slot:empty');
    if (asks.length && await page.locator('.tray .tile').first().isVisible() && await emptySlot.count()) {
      const en = asks.at(-1).match(/^Spell: (.+)!$/)[1];
      if (!wrongPlan.has(en)) wrongPlan.set(en, asks.length === 1 ? 1 : asks.length === 2 ? 2 : 0);
      const w = word(en);
      const slots = page.locator('.slot-row .slot');
      const idx = await slots.evaluateAll((els) => els.findIndex((e) => !e.firstChild));
      const empty = await emptySlot.count();
      const trayGs = await page.locator('.tray .tile').evaluateAll((els) => els.map((e) => e.dataset.grapheme));
      // Lượt sai: chỗ trống đầu tiên đặt một ô KHÁC ô đúng; lượt đúng: đặt đúng ô.
      const wrongTurn = wrongPlan.get(en) > 0;
      const g = wrongTurn ? trayGs.find((x) => x !== w.graphemes[idx]) : w.graphemes[idx];
      const before = await page.locator('.tray .tile').count();
      await tap(page.locator(`.tray .tile[data-grapheme="${g}"]`).first());
      // Ô đã vào chỗ (Olly không đang nói) và đây là chỗ trống cuối → hết một lượt sai.
      if (wrongTurn && empty === 1 && await page.locator('.tray .tile').count() < before) wrongPlan.set(en, wrongPlan.get(en) - 1);
    } else if (await page.locator('.fill-choice').first().isVisible()) {
      const en = (await spoken(page)).filter((s) => s.startsWith('What is missing in ')).at(-1)?.match(/in (.+)\?$/)?.[1];
      if (en) {
        const gap = await page.locator('.slot-row .slot').evaluateAll((els) => els.findIndex((e) => e.classList.contains('gap')));
        await tap(page.locator(`.fill-choice[data-choice="${word(en).graphemes[gap]}"]`));
      }
    }
    await page.waitForTimeout(60);
  }
  await expect(page.locator('.done-panel')).toBeVisible();
  expect(sawViHelp).toBe(true);

  const all = await page.evaluate(() => window.kidEnglish6.db.getAll('progress'));
  const spell = all.filter((p) => p.activity === 'spell');
  expect(spell.filter((p) => p.helped === 1)).toHaveLength(1);
  expect(spell.filter((p) => p.missed === 1)).toHaveLength(1);
  expect(all.filter((p) => p.activity === 'fill' && p.independent === 1)).toHaveLength(2);
  const done = all.find((p) => p.key === 'lesson:phonics-g1/spell');
  expect(done.plays).toBe(1);
  expect(all.find((p) => p.key === 'lesson:phonics-g1')).toBeUndefined(); // sao Read không bị đụng

  await page.getByRole('button', { name: 'Bài khác' }).click();
  await expect(page.locator('.lesson-card.next')).toHaveAttribute('data-lesson', 'phonics-g2');
});

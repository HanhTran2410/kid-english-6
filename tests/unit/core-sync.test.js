// Lõi chép từ kid-english không được sửa "lặng lẽ": mã băm từng file phải khớp CORE.md (SPEC mục 2.2).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** sha-256 của nội dung đã bỏ \r (Windows / Linux checkout ra cùng một mã), 12 ký tự đầu. */
export const coreHash = (text) => createHash('sha256').update(text.replace(/\r/g, ''), 'utf8').digest('hex').slice(0, 12);

test('file lõi chép từ kid-english khớp mã băm ghi trong CORE.md', async () => {
  const doc = await readFile(path.join(root, 'CORE.md'), 'utf8');
  const rows = [...doc.matchAll(/^\| `([^`]+)` \| ([0-9a-f]{7,}) \| ([0-9a-f]{12}) \|/gm)].map((m) => ({ file: m[1], hash: m[3] }));
  assert.ok(rows.length >= 12, 'CORE.md phải liệt kê các file lõi');

  const changed = [];
  for (const { file, hash } of rows) {
    const actual = coreHash(await readFile(path.join(root, file), 'utf8'));
    if (actual !== hash) changed.push(`${file}: ${hash} → ${actual}`);
  }
  assert.deepEqual(changed, [], `File lõi đã đổi. Cập nhật CORE.md (mã băm mới + ghi chú: sửa lỗi chung cần chép sang kid-english, hay sửa riêng cho Olly):\n${changed.join('\n')}`);
});

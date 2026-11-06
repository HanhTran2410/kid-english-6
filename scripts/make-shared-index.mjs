// Tạo app/shared/index.json — danh sách gói bài trong Thư viện bài (SPEC mục 6.3).
// Chạy: node scripts/make-shared-index.mjs. Workflow deploy chạy lại trước khi đưa app lên GitHub Pages, nên bố mẹ chỉ cần
// tải file .json của bài vào app/shared/ (kể cả qua trang web GitHub) là thư viện tự cập nhật và chuông 🔔 báo bài mới.
// Bài lỗi (không qua được kiểm tra) KHÔNG vào danh sách, và script báo lỗi để thấy ngay trong log deploy.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseLessonText, validateLesson } from '../app/js/lesson.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const SHARED = path.join(root, 'app', 'shared');

/** Mô tả các file bài trong thư mục; trả về { files, problems }. */
export async function describeShared(dir = SHARED) {
  const names = (await readdir(dir)).filter((n) => n.endsWith('.json') && n !== 'index.json').sort();
  const files = [];
  const problems = [];
  for (const file of names) {
    const text = await readFile(path.join(dir, file), 'utf8');
    const parsed = parseLessonText(text);
    const r = parsed.error ? { ok: false, errors: [parsed.error] } : validateLesson(parsed.data);
    if (!r.ok) {
      problems.push(`${file}: ${r.errors.join(' | ')}`);
      continue;
    }
    const l = r.lesson;
    files.push({
      file,
      size: Buffer.byteLength(text, 'utf8'),
      id: l.id,
      title: l.title,
      titleVi: l.titleVi,
      track: l.track,
      emoji: l.words.find((w) => w.emoji)?.emoji ?? null,
    });
  }
  const ids = new Map();
  for (const f of files) {
    if (ids.has(f.id)) problems.push(`${f.file}: trùng id "${f.id}" với ${ids.get(f.id)}`);
    ids.set(f.id, f.file);
  }
  return { files, problems };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { files, problems } = await describeShared();
  await writeFile(path.join(SHARED, 'index.json'), `${JSON.stringify({ files }, null, 1)}\n`);
  console.log(`Thư viện bài: ${files.length} bài.`);
  if (problems.length) {
    console.error(`Bài lỗi (không đưa vào thư viện):\n${problems.join('\n')}`);
    process.exitCode = 1;
  }
}

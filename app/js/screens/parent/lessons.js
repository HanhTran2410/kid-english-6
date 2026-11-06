// Góc bố mẹ → 📚 Bài học (SPEC mục 5.5, 6.3): danh sách bài, nhập bài JSON (dán / chọn file) có kiểm tra, xuất, xóa;
// ✨ Tạo bài theo sách bằng AI (create.js); Thư viện bài (bài dùng chung trên GitHub) — nhập bài bất kỳ, kể cả bài cũ chuông thông báo không báo.

import { h, toast, confirmDialog, formatDateTime } from '../../ui.js';
import { parseLessonText, validateLesson, itemsToReset } from '../../lesson.js';
import { saveLesson, replaceLesson, deleteLesson } from '../../db.js';
import { parentLayout, goParent, section, notice } from './common.js';
import { fetchLibrary } from '../../library.js';
import { importShared, errorText } from '../notice-bell.js';
import { createPanel } from './create.js';

const TRACK_LABEL = { phonics: '🔤 Phonics', book: '📘 Theo sách' };

export function lessonsView(app) {
  const body = parentLayout(app, { title: 'Bài học', back: () => goParent(app) });
  const listBox = h('div.lesson-list.my-lessons');
  const refresh = () => renderList(app, listBox).catch((err) => {
    console.error(err);
    toast('Không đọc được danh sách bài.');
  });
  const imp = importPanel(app, refresh);
  const focusImport = () => {
    imp.scrollIntoView({ behavior: 'smooth', block: 'start' });
    imp.querySelector('textarea')?.focus({ preventScroll: true });
  };
  body.append(createPanel(app, { focusImport }), imp, libraryPanel(app, refresh), section('Các bài đã có', listBox));
  refresh();
}

async function renderList(app, box) {
  const lessons = (await app.db.getAll('lessons')).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  box.replaceChildren();
  if (!lessons.length) {
    box.append(h('p.muted', { text: 'Chưa có bài nào. Dán JSON của bài ở trên để nhập.' }));
    return;
  }
  for (const lesson of lessons) {
    box.append(h('div.lesson-row', {},
      h('div.lesson-info', {},
        h('strong', { text: lesson.title }),
        lesson.titleVi ? h('span', { text: ` — ${lesson.titleVi}` }) : null,
        h('div.field-hint', {
          text: [
            TRACK_LABEL[lesson.track] ?? lesson.track,
            lesson.unit,
            `${lesson.words.length} từ · ${lesson.sentences.length} câu · ${lesson.activities.length} hoạt động`,
            `id: ${lesson.id}`,
            lesson.updatedAt ? `sửa ${formatDateTime(lesson.updatedAt)}` : null,
          ].filter(Boolean).join(' · '),
        })),
      h('div.lesson-actions', {},
        h('button.btn', { type: 'button', text: '⬇️ Xuất', onclick: () => exportLesson(lesson) }),
        lesson.builtIn ? null : h('button.btn.danger', {
          type: 'button',
          text: '🗑️ Xóa',
          onclick: async () => {
            const ok = await confirmDialog(`Xóa bài "${lesson.title}"? Kết quả học, ảnh và ghi âm của bài này cũng bị xóa.`, { okText: 'Xóa', danger: true });
            if (!ok) return;
            await deleteLesson(app.db, lesson.id);
            toast('Đã xóa bài.');
            renderList(app, box);
          },
        }))));
  }
}

function importPanel(app, refresh) {
  const area = h('textarea.lesson-json', { rows: 8, placeholder: 'Dán JSON của bài vào đây (AI trả về thế nào cứ dán nguyên, kể cả khối ```json).', spellcheck: false });
  const file = h('input', { type: 'file', accept: '.json,application/json,text/plain' });
  const result = h('div.import-result');

  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    area.value = await f.text();
    check();
  });

  let checked = null;
  const check = () => {
    checked = null;
    result.replaceChildren();
    const parsed = parseLessonText(area.value);
    if (parsed.error) {
      result.append(notice('error', parsed.error));
      return;
    }
    const r = validateLesson(parsed.data);
    if (!r.ok) {
      result.append(notice('error', h('strong', { text: `Chưa lưu được — ${r.errors.length} lỗi:` }), h('ul', {}, ...r.errors.map((e) => h('li', { text: e })))));
      return;
    }
    checked = r.lesson;
    const l = r.lesson;
    result.append(
      notice('info', h('strong', { text: `✅ ${l.title}` }), ` — ${l.words.length} từ, ${l.sentences.length} câu, ${l.activities.length} hoạt động (id: ${l.id}).`),
      r.warnings.length ? notice('warn', h('strong', { text: 'Lưu ý (vẫn lưu được):' }), h('ul', {}, ...r.warnings.map((w) => h('li', { text: w })))) : null,
      h('button.btn.primary', { type: 'button', text: '💾 Lưu bài', onclick: () => save() }),
    );
  };

  const save = async () => {
    if (!checked) return;
    const lesson = checked;
    const existing = await app.db.get('lessons', lesson.id);
    if (!existing) {
      await saveLesson(app.db, lesson);
      toast('Đã lưu bài.');
    } else {
      const choice = existing.builtIn ? 'new' : await choose(`Đã có bài mang id "${lesson.id}" ("${existing.title}").`, [
        ['cancel', 'Hủy'], ['new', 'Lưu thành bài mới'], ['replace', 'Thay bài cũ'],
      ]);
      if (choice === 'cancel') return;
      if (choice === 'replace') {
        const reset = itemsToReset(existing, lesson);
        if (reset.length && !await confirmDialog(`${reset.length} mục bị xóa hoặc đổi chữ (${reset.join(', ')}) sẽ mất kết quả học. Thay bài?`, { okText: 'Thay bài', danger: true })) return;
        await replaceLesson(app.db, lesson, reset);
        toast('Đã thay bài cũ. Kết quả học của các mục còn nguyên vẫn giữ.');
      } else {
        const id = await freeId(app.db, lesson.id);
        await saveLesson(app.db, { ...lesson, id });
        toast(`Đã lưu thành bài mới (id: ${id}).`);
      }
    }
    area.value = '';
    result.replaceChildren();
    checked = null;
    refresh();
  };

  return section('📥 Nhập bài (JSON)',
    area,
    h('div.lesson-actions', {},
      h('button.btn.primary', { type: 'button', text: 'Kiểm tra', onclick: check }),
      h('label.btn', {}, '📄 Chọn file…', file)),
    result);
}

async function freeId(db, base) {
  for (let n = 2; ; n++) {
    const id = `${base}-${n}`;
    if (!await db.get('lessons', id)) return id;
  }
}

/** Hộp thoại nhiều lựa chọn. @returns {Promise<string>} */
function choose(message, options) {
  return new Promise((resolve) => {
    const overlay = h('div.dialog-overlay', {},
      h('div.dialog', { role: 'dialog', 'aria-modal': 'true' },
        h('p', { text: message }),
        h('div.dialog-actions', {}, ...options.map(([value, label], i) => h(`button.btn${i === options.length - 1 ? '.primary' : ''}`, {
          type: 'button',
          text: label,
          onclick: () => {
            overlay.remove();
            resolve(value);
          },
        })))));
    document.body.append(overlay);
  });
}

function exportLesson(lesson) {
  const { createdAt, updatedAt, builtIn, ...data } = lesson;
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: `${lesson.id}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function libraryPanel(app, refresh) {
  const box = h('div.lesson-list.library-list', {}, h('p.muted', { text: 'Đang tải danh sách…' }));
  const load = async () => {
    let files;
    try {
      files = await fetchLibrary();
    } catch {
      box.replaceChildren(h('p.muted', { text: 'Không tải được Thư viện bài (cần mạng).' }));
      return;
    }
    if (!files.length) {
      box.replaceChildren(h('p.muted', { text: 'Thư viện chưa có bài nào.' }));
      return;
    }
    const have = new Set((await app.db.getAll('lessons')).map((l) => l.id));
    box.replaceChildren(...files.map((f) => {
      const status = h('span.field-hint');
      const btn = h('button.btn.primary', {
        type: 'button',
        text: have.has(f.id) ? 'Cập nhật' : 'Nhập',
        onclick: async () => {
          btn.disabled = true;
          status.textContent = 'Đang nhập…';
          try {
            toast(`${await importShared(app, f)}.`, 3500);
            status.textContent = '✅ Đã có trên máy';
            btn.textContent = 'Cập nhật';
            refresh();
          } catch (err) {
            status.textContent = `⚠️ ${errorText(err)}`;
          }
          btn.disabled = false;
        },
      });
      return h('div.lesson-row', { dataset: { file: f.file } },
        h('div.lesson-info', {}, h('strong', { text: `${f.emoji || '📘'} ${f.title}` }), f.titleVi ? h('span', { text: ` — ${f.titleVi}` }) : null,
          h('div.field-hint', { text: [TRACK_LABEL[f.track] ?? f.track, `id: ${f.id}`, have.has(f.id) ? 'đã có trên máy' : null].filter(Boolean).join(' · ') }), status),
        h('div.lesson-actions', {}, btn));
    }));
  };
  load();
  return section('📚 Thư viện bài', h('p.field-hint', { text: 'Bài dùng chung đặt trên GitHub (thư mục app/shared/). Có bài mới thì chuông 🔔 báo.' }), box);
}

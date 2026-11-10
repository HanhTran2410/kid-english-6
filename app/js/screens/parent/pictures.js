// Ảnh thay cho emoji (SPEC 5.6) — LƯU VÀO KHO ẢNH DÙNG CHUNG theo từ / câu (picture-library.js): đặt ảnh cho "cat" một lần,
// mọi bài có "cat" đều dùng. Trang này: Góc bố mẹ → Bài học → 🖼️ Ảnh của một bài. Kho ảnh (library.js) dùng chung các khối
// `pictureRow` và `gridSection` ở đây. Ảnh lưới theo cách kid-english: 1 ảnh AI vẽ → app cắt ô → bố mẹ chọn mục cho từng ô.

import { h, toast, copyText, confirmDialog } from '../../ui.js';
import { resizeImage, sliceGrid, gridShape, loadGridImage, GRID_OPTIONS, ImageError } from '../../image.js';
import { mediaBlob, isQuotaError } from '../../db.js';
import { gridImagePrompt } from '../../lesson-prompts.js';
import { BUILTIN_BY_ID } from '../../data/builtin-lessons.js';
import { pictureItems, libraryImages, setLibraryImage, removeLibraryImage } from '../../picture-library.js';
import { parentLayout, goParent, section, notice } from './common.js';

export const MAX_GRID = 16;
const SKIP = '';

export function imageErrorMessage(err) {
  if (err instanceof ImageError) return err.message;
  if (isQuotaError(err)) return 'Bộ nhớ đầy, không lưu được ảnh.';
  return 'Không đọc được ảnh này, hãy chọn ảnh khác.';
}

export { pictureWords } from '../../picture-library.js';

export function picturesView(app, { lessonId }) {
  const body = parentLayout(app, { title: '🖼️ Ảnh của bài', back: () => goParent(app, 'lessons') });
  const urls = [];
  (async () => {
    const lesson = BUILTIN_BY_ID.get(lessonId) ?? await app.db.get('lessons', lessonId);
    if (!lesson) {
      goParent(app, 'lessons');
      return;
    }
    const items = pictureItems([lesson]);
    const listBox = h('div.picture-list');
    const refresh = async () => {
      const images = await libraryImages(app.db);
      listBox.replaceChildren(...items.map((it) => pictureRow(app, it, images.get(it.key), urls, refresh)));
    };
    body.append(
      h('p.muted', { text: `${lesson.title}${lesson.titleVi ? ` — ${lesson.titleVi}` : ''}` }),
      notice('info', 'Ảnh lưu vào 🖼️ Kho ảnh dùng chung: mọi bài có cùng từ / câu đều dùng ảnh này.'),
      gridSection(app, () => items.slice(0, MAX_GRID), urls, refresh),
      section('Ảnh từng mục', h('p.field-hint', { text: 'Mục chưa có ảnh thì bé thấy emoji. Có thể chọn / chụp ảnh riêng.' }), listBox),
    );
    await refresh();
  })().catch((err) => {
    console.error(err);
    toast('Không mở được ảnh của bài.');
  });
  return () => urls.forEach((u) => URL.revokeObjectURL(u));
}

/** Một mục (từ / câu) với ảnh hiện tại + đổi / xóa ảnh (ảnh lẻ). `select`: ô chọn để vẽ ảnh lưới (Kho ảnh). */
export function pictureRow(app, it, image, urls, refresh, { select = null } = {}) {
  let pic;
  if (image) {
    const url = URL.createObjectURL(mediaBlob(image));
    urls.push(url);
    pic = h('img.picture-thumb', { src: url, alt: it.en });
  } else {
    pic = h('span.picture-thumb.emoji', { text: it.emoji || '—' });
  }
  const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      await setLibraryImage(app.db, it.key, await resizeImage(file));
      toast(`Đã lưu ảnh cho "${it.en}".`);
      refresh();
    } catch (err) {
      toast(imageErrorMessage(err), 4000);
    }
  });
  return h(`div.picture-row${it.kind === 'sentence' ? '.sentence-item' : ''}`, { dataset: { key: it.key, word: it.key } }, select, pic,
    h('div.lesson-info', {}, h('strong', { text: it.en }), it.vi ? h('span.field-hint', { text: ` ${it.vi}` }) : null,
      it.lessons?.length > 1 ? h('div.field-hint', { text: `Dùng ở ${it.lessons.length} bài` }) : null),
    h('div.lesson-actions', {},
      h('button.btn.small', { type: 'button', text: image ? '🔄 Đổi ảnh' : '📷 Chọn ảnh', 'aria-label': `${image ? 'Đổi' : 'Chọn'} ảnh của ${it.en}`, onclick: () => input.click() }),
      image ? h('button.btn.small.danger', {
        type: 'button', text: '✕', 'aria-label': `Xóa ảnh của ${it.en}`,
        onclick: async () => {
          if (!await confirmDialog(`Xóa ảnh của "${it.en}"? Mọi bài dùng mục này sẽ thấy lại emoji.`, { okText: 'Xóa', danger: true })) return;
          await removeLibraryImage(app.db, it.key);
          refresh();
        },
      }) : null),
    input);
}

/**
 * Ảnh lưới: chép prompt → chọn ảnh → app cắt từng ô → bố mẹ chọn mục cho từng ô → lưu vào kho (theo kid-english).
 * @param {() => Array<{ key, en, vi }>} getItems các mục sẽ vẽ (gọi lại mỗi lần bấm — Kho ảnh cho chọn mục)
 */
export function gridSection(app, getItems, urls, onSaved) {
  const input = h('input', { type: 'file', accept: 'image/*', hidden: true, 'aria-label': 'Ảnh lưới' });
  const previewBox = h('div.grid-preview');
  const shapeKey = ({ cols, rows }) => `${cols}x${rows}`;
  const titleEl = h('h2');
  const setTitle = () => {
    const n = Math.min(getItems().length, MAX_GRID);
    const s = gridShape(Math.max(1, n));
    titleEl.textContent = `Ảnh lưới — 1 ảnh cho ${n} mục (${s.cols} × ${s.rows} ô)`;
  };

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const items = getItems().slice(0, MAX_GRID);
    if (!items.length) return toast('Chưa chọn mục nào.');
    const expected = gridShape(items.length);
    previewBox.replaceChildren(h('p.muted', { text: 'Đang đọc ảnh…' }));
    let image;
    try {
      image = await loadGridImage(file, expected);
    } catch (err) {
      previewBox.replaceChildren(notice('error', imageErrorMessage(err)));
      return;
    }
    const options = [...GRID_OPTIONS];
    if (image.detected && !options.some((o) => shapeKey(o) === shapeKey(image.detected))) options.push(image.detected);
    const shapeSel = h('select', { 'aria-label': 'Kiểu lưới' }, ...options.map((o) => h('option', {
      value: shapeKey(o),
      text: `${o.cols} cột × ${o.rows} hàng${image.detected && shapeKey(o) === shapeKey(image.detected) ? ' (app đoán)' : ''}`,
    })));
    shapeSel.value = shapeKey(image.detected ?? expected);
    const cellsBox = h('div.grid-cells');
    let tiles = [];
    let pickers = [];

    const render = async () => {
      const [cols, rows] = shapeSel.value.split('x').map(Number);
      cellsBox.replaceChildren(h('p.muted', { text: 'Đang cắt ảnh…' }));
      try {
        tiles = await sliceGrid(image, { cols, rows });
      } catch (err) {
        cellsBox.replaceChildren(notice('error', imageErrorMessage(err)));
        return;
      }
      cellsBox.style.setProperty('--cols', String(cols));
      pickers = tiles.map((_, i) => {
        const sel = h('select', { 'aria-label': `Mục cho ô ${i + 1}` },
          h('option', { value: SKIP, text: '— bỏ qua —' }),
          ...items.map((it) => h('option', { value: it.key, text: it.en })));
        sel.value = items[i]?.key ?? SKIP; // mặc định theo thứ tự; ô thừa thì bỏ qua
        return sel;
      });
      cellsBox.replaceChildren(...tiles.map((t, i) => {
        const url = URL.createObjectURL(t.blob);
        urls.push(url);
        return h('figure.grid-cell', {}, h('img', { src: url, alt: `Ô ${i + 1}` }), pickers[i]);
      }));
    };
    shapeSel.addEventListener('change', render);

    const save = async () => {
      const chosen = pickers.map((p, i) => [p.value, tiles[i]]).filter(([k]) => k !== SKIP);
      const dup = chosen.map(([k]) => k).find((k, i, all) => all.indexOf(k) !== i);
      if (dup) return toast(`"${items.find((it) => it.key === dup)?.en}" đang được chọn cho 2 ô. Hãy chọn lại.`, 4000);
      if (!chosen.length) return toast('Chưa chọn mục cho ô nào.');
      try {
        for (const [key, t] of chosen) await setLibraryImage(app.db, key, t);
        toast(`Đã lưu ${chosen.length} ảnh.`);
        previewBox.replaceChildren();
        onSaved();
      } catch (err) {
        toast(imageErrorMessage(err), 4000);
      }
    };

    previewBox.replaceChildren(
      notice('info', 'Kiểm tra từng ô: ảnh bị cắt lệch thì đổi "Kiểu lưới". Mỗi ô chọn đúng mục; ô thừa / vẽ trùng chọn "— bỏ qua —".'),
      h('label.field', {}, h('span.field-label', { text: 'Kiểu lưới' }), shapeSel),
      cellsBox,
      h('div.lesson-actions', {},
        h('button.btn.primary', { type: 'button', text: '💾 Lưu các ảnh này', onclick: save }),
        h('button.btn', { type: 'button', text: 'Hủy', onclick: () => previewBox.replaceChildren() })));
    await render();
  });

  setTitle();
  const panel = h('section.panel.grid-panel', {},
    titleEl,
    h('p.field-hint', { text: 'Bấm "Chép prompt ảnh lưới", dán vào ChatGPT / Gemini để AI vẽ 1 ảnh, lưu ảnh về máy, rồi bấm "Chọn ảnh lưới" — app tự cắt từng ô, bố mẹ kiểm tra rồi lưu.' }),
    h('div.lesson-actions', {},
      h('button.btn', {
        type: 'button',
        text: '📋 Chép prompt ảnh lưới',
        onclick: () => {
          const items = getItems().slice(0, MAX_GRID);
          if (!items.length) return toast('Chưa chọn mục nào.');
          copyText(gridImagePrompt(items, gridShape(items.length))).then((ok) => toast(ok ? `Đã chép prompt ảnh lưới (${items.length} mục).` : 'Không chép được — hãy thử lại.'));
        },
      }),
      h('button.btn.primary', { type: 'button', text: '🖼️ Chọn ảnh lưới', onclick: () => input.click() })),
    input,
    previewBox);
  panel.refreshTitle = setTitle;
  return panel;
}

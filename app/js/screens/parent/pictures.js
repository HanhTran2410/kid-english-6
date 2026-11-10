// Góc bố mẹ → Bài học → 🖼️ Ảnh của bài (SPEC 5.6): ảnh thay cho emoji của từng từ. Gắn theo (bài, id của từ), nên bài có
// sẵn của app cũng thêm được ảnh. Hai cách: ẢNH LƯỚI (1 ảnh AI vẽ cho cả bài → app cắt từng ô → bố mẹ chọn từ cho
// từng ô, như kid-english) hoặc chọn / chụp ảnh lẻ cho từng từ. Ảnh lưu trong máy (IndexedDB), xem được offline.

import { h, toast, copyText, confirmDialog } from '../../ui.js';
import { resizeImage, sliceGrid, gridShape, loadGridImage, GRID_OPTIONS, ImageError } from '../../image.js';
import { setWordImage, removeWordImage, lessonImages, mediaBlob, isQuotaError } from '../../db.js';
import { gridImagePrompt } from '../../lesson-prompts.js';
import { BUILTIN_BY_ID } from '../../data/builtin-lessons.js';
import { parentLayout, goParent, section, notice } from './common.js';

const MAX_GRID = 16;
const SKIP = '';

export function imageErrorMessage(err) {
  if (err instanceof ImageError) return err.message;
  if (isQuotaError(err)) return 'Bộ nhớ đầy, không lưu được ảnh.';
  return 'Không đọc được ảnh này, hãy chọn ảnh khác.';
}

/** Từ cần hình: mọi từ trừ tricky words (từ nhận diện mặt chữ). */
export const pictureWords = (lesson) => lesson.words.filter((w) => !w.tags?.includes('tricky'));

export function picturesView(app, { lessonId }) {
  const body = parentLayout(app, { title: '🖼️ Ảnh của bài', back: () => goParent(app, 'lessons') });
  const urls = [];
  (async () => {
    const lesson = BUILTIN_BY_ID.get(lessonId) ?? await app.db.get('lessons', lessonId);
    if (!lesson) {
      goParent(app, 'lessons');
      return;
    }
    const words = pictureWords(lesson);
    const listBox = h('div.picture-list');
    const refresh = async () => {
      const images = await lessonImages(app.db, lesson.id);
      listBox.replaceChildren(...words.map((w) => wordRow(app, lesson, w, images.get(w.id), urls, refresh)));
    };
    body.append(
      h('p.muted', { text: `${lesson.title}${lesson.titleVi ? ` — ${lesson.titleVi}` : ''}` }),
      gridSection(app, lesson, words.slice(0, MAX_GRID), urls, refresh),
      section('Ảnh từng từ', h('p.field-hint', { text: 'Từ chưa có ảnh thì bé thấy emoji. Có thể chọn / chụp ảnh riêng cho từng từ.' }), listBox),
    );
    await refresh();
  })().catch((err) => {
    console.error(err);
    toast('Không mở được ảnh của bài.');
  });
  return () => urls.forEach((u) => URL.revokeObjectURL(u));
}

function wordRow(app, lesson, w, image, urls, refresh) {
  let pic;
  if (image) {
    const url = URL.createObjectURL(mediaBlob(image));
    urls.push(url);
    pic = h('img.picture-thumb', { src: url, alt: w.en });
  } else {
    pic = h('span.picture-thumb.emoji', { text: w.emoji || '—' });
  }
  const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const img = await resizeImage(file);
      await setWordImage(app.db, { lessonId: lesson.id, wordId: w.id, ...img });
      toast(`Đã lưu ảnh cho "${w.en}".`);
      refresh();
    } catch (err) {
      toast(imageErrorMessage(err), 4000);
    }
  });
  return h('div.picture-row', { dataset: { word: w.id } }, pic,
    h('div.lesson-info', {}, h('strong', { text: w.en }), w.vi ? h('span.field-hint', { text: ` ${w.vi}` }) : null),
    h('div.lesson-actions', {},
      h('button.btn.small', { type: 'button', text: image ? '🔄 Đổi ảnh' : '📷 Chọn ảnh', onclick: () => input.click() }),
      image ? h('button.btn.small.danger', {
        type: 'button', text: '✕', 'aria-label': `Xóa ảnh của ${w.en}`,
        onclick: async () => {
          if (!await confirmDialog(`Xóa ảnh của "${w.en}"? Bé sẽ thấy lại emoji.`, { okText: 'Xóa', danger: true })) return;
          await removeWordImage(app.db, lesson.id, w.id);
          refresh();
        },
      }) : null),
    input);
}

/** Ảnh lưới: chép prompt → chọn ảnh → app cắt từng ô → bố mẹ chọn từ cho từng ô → lưu (theo kid-english). */
function gridSection(app, lesson, words, urls, onSaved) {
  const expected = gridShape(words.length);
  const prompt = gridImagePrompt(words, expected);
  const input = h('input', { type: 'file', accept: 'image/*', hidden: true, 'aria-label': 'Ảnh lưới' });
  const previewBox = h('div.grid-preview');
  const shapeKey = ({ cols, rows }) => `${cols}x${rows}`;

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
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
        const sel = h('select', { 'aria-label': `Từ cho ô ${i + 1}` },
          h('option', { value: SKIP, text: '— bỏ qua —' }),
          ...words.map((w) => h('option', { value: w.id, text: w.en })));
        sel.value = words[i]?.id ?? SKIP; // mặc định theo thứ tự; ô thừa thì bỏ qua
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
      const chosen = pickers.map((p, i) => [p.value, tiles[i]]).filter(([id]) => id !== SKIP);
      const dup = chosen.map(([id]) => id).find((id, i, all) => all.indexOf(id) !== i);
      if (dup) {
        toast(`Từ "${words.find((w) => w.id === dup)?.en}" đang được chọn cho 2 ô. Hãy chọn lại.`, 4000);
        return;
      }
      if (!chosen.length) {
        toast('Chưa chọn từ cho ô nào.');
        return;
      }
      try {
        for (const [wordId, t] of chosen) await setWordImage(app.db, { lessonId: lesson.id, wordId, ...t });
        toast(`Đã lưu ${chosen.length} ảnh.`);
        previewBox.replaceChildren();
        onSaved();
      } catch (err) {
        toast(imageErrorMessage(err), 4000);
      }
    };

    previewBox.replaceChildren(
      notice('info', 'Kiểm tra từng ô: ảnh bị cắt lệch thì đổi "Kiểu lưới". Mỗi ô chọn đúng từ; ô thừa / vẽ trùng chọn "— bỏ qua —".'),
      h('label.field', {}, h('span.field-label', { text: 'Kiểu lưới' }), shapeSel),
      cellsBox,
      h('div.lesson-actions', {},
        h('button.btn.primary', { type: 'button', text: '💾 Lưu các ảnh này', onclick: save }),
        h('button.btn', { type: 'button', text: 'Hủy', onclick: () => previewBox.replaceChildren() })));
    await render();
  });

  return section(`Ảnh lưới — 1 ảnh cho cả bài (${expected.cols} × ${expected.rows} ô)`,
    h('p.field-hint', { text: 'Bấm "Chép prompt ảnh lưới", dán vào ChatGPT / Gemini để AI vẽ 1 ảnh, lưu ảnh về máy, rồi bấm "Chọn ảnh lưới" — app tự cắt từng ô, bố mẹ kiểm tra rồi lưu.' }),
    h('div.lesson-actions', {},
      h('button.btn', {
        type: 'button',
        text: '📋 Chép prompt ảnh lưới',
        onclick: () => copyText(prompt).then((ok) => toast(ok ? 'Đã chép prompt ảnh lưới.' : 'Không chép được — hãy thử lại.')),
      }),
      h('button.btn.primary', { type: 'button', text: '🖼️ Chọn ảnh lưới', onclick: () => input.click() })),
    input,
    previewBox);
}

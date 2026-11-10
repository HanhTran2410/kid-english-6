// Góc bố mẹ → 🖼️ Kho ảnh (SPEC 5.6, giống kid-english): MỘT chỗ để thay tranh của Tả tranh và hình của mọi bài.
// - Tranh Tả tranh: tranh có sẵn → "Thay tranh" (bản sao giữ câu, prompt vẽ tranh theo các câu, đặt lại mũi tên; tranh gốc ẩn,
//   hiện lại được); tranh của bố mẹ → sửa / đổi ảnh.
// - Từ / câu của mọi bài (gộp theo từ: "cat" ở 3 bài = 1 mục, ảnh dùng chung): tìm, lọc "chưa có ảnh", chọn mục → 1 prompt
//   ảnh lưới cho tối đa 16 mục → AI vẽ 1 ảnh → app cắt → lưu; hoặc ảnh lẻ từng mục.

import { h, toast } from '../../ui.js';
import { mediaBlob, lessonImages, SCENE_IMAGE } from '../../db.js';
import { pictureItems, allLessons, libraryImages } from '../../picture-library.js';
import { BUILTIN_SCENES } from '../../data/builtin-scenes.js';
import { parentLayout, goParent, section } from './common.js';
import { pictureRow, gridSection, MAX_GRID } from './pictures.js';

export function libraryView(app) {
  const body = parentLayout(app, { title: '🖼️ Kho ảnh', back: () => goParent(app) });
  const urls = [];
  (async () => {
    body.append(await scenesPanel(app, urls));
    const items = pictureItems(await allLessons(app.db));
    const selected = new Set();
    let images = await libraryImages(app.db);

    const search = h('input', { type: 'search', placeholder: 'Tìm từ / câu…', 'aria-label': 'Tìm' });
    const filter = h('select', { 'aria-label': 'Lọc' },
      h('option', { value: 'all', text: 'Tất cả' }), h('option', { value: 'missing', text: 'Chưa có ảnh' }), h('option', { value: 'has', text: 'Đã có ảnh' }));
    const kind = h('select', { 'aria-label': 'Loại' },
      h('option', { value: 'all', text: 'Từ + câu' }), h('option', { value: 'word', text: 'Chỉ từ' }), h('option', { value: 'sentence', text: 'Chỉ câu' }));
    const countEl = h('span.field-hint');
    const listBox = h('div.picture-list');
    const visible = () => {
      const q = search.value.trim().toLowerCase();
      return items.filter((it) => (filter.value === 'all' || (filter.value === 'missing') !== images.has(it.key))
        && (kind.value === 'all' || it.kind === kind.value)
        && (!q || it.en.toLowerCase().includes(q) || it.vi.toLowerCase().includes(q)));
    };
    const chosen = () => items.filter((it) => selected.has(it.key));
    const render = () => {
      urls.splice(0).forEach((u) => URL.revokeObjectURL(u));
      const shown = visible();
      listBox.replaceChildren(...shown.map((it) => {
        const box = h('input', { type: 'checkbox', checked: selected.has(it.key), 'aria-label': `Chọn ${it.en} để vẽ` });
        box.addEventListener('change', () => {
          if (box.checked && selected.size >= MAX_GRID) {
            box.checked = false;
            return toast(`Mỗi ảnh lưới tối đa ${MAX_GRID} mục.`);
          }
          if (box.checked) selected.add(it.key);
          else selected.delete(it.key);
          updateCount();
        });
        return pictureRow(app, it, images.get(it.key), urls, refresh, { select: box });
      }));
      updateCount();
    };
    const grid = gridSection(app, chosen, urls, () => {
      selected.clear();
      refresh();
    });
    const updateCount = () => {
      countEl.textContent = `${items.length} mục · ${items.filter((it) => images.has(it.key)).length} đã có ảnh · đang chọn ${selected.size}/${MAX_GRID} để vẽ`;
      grid.refreshTitle();
    };
    const refresh = async () => {
      images = await libraryImages(app.db);
      render();
    };
    for (const el of [search, filter, kind]) el.addEventListener('input', render);
    const pickMissing = h('button.btn', {
      type: 'button', text: `☑ Chọn ${12} mục chưa có ảnh`,
      onclick: () => {
        selected.clear();
        for (const it of visible().filter((x) => !images.has(x.key)).slice(0, 12)) selected.add(it.key);
        if (!selected.size) toast('Mục nào cũng đã có ảnh 🎉');
        render();
      },
    });
    const clearSel = h('button.btn', { type: 'button', text: 'Bỏ chọn', onclick: () => { selected.clear(); render(); } });

    body.append(
      section('Từ và câu của mọi bài',
        h('p.field-hint', { text: 'Ảnh dùng chung: đặt ảnh cho một từ / câu một lần, mọi bài có từ / câu đó đều dùng. Chưa có ảnh thì bé thấy emoji.' }),
        h('div.lesson-actions', {}, search, filter, kind),
        h('div.lesson-actions', {}, pickMissing, clearSel),
        countEl),
      grid,
      section('', listBox),
    );
    render();
  })().catch((err) => {
    console.error(err);
    toast('Không mở được Kho ảnh.');
  });
  return () => urls.splice(0).forEach((u) => URL.revokeObjectURL(u));
}

async function scenesPanel(app, urls) {
  const hidden = new Set(app.settings.hiddenScenes ?? []);
  const own = await app.db.getAll('scenes');
  const rows = [];
  for (const s of BUILTIN_SCENES) {
    const copy = own.find((x) => x.copyOf === s.id);
    rows.push(h('div.lesson-row', { dataset: { scene: s.id } },
      h('div.scene-thumb.small', { html: s.svg }),
      h('div.lesson-info', {}, h('strong', { text: s.title }), h('div.field-hint', { text: `Tranh có sẵn${hidden.has(s.id) ? ' · đang ẩn (đã thay bằng bản sao)' : ''}` })),
      h('div.lesson-actions', {},
        hidden.has(s.id)
          ? h('button.btn', {
            type: 'button', text: '👁 Hiện lại tranh gốc',
            onclick: async () => {
              await app.setSetting('hiddenScenes', [...hidden].filter((x) => x !== s.id));
              goParent(app, 'library');
            },
          })
          : h('button.btn.primary', {
            type: 'button', text: '🔄 Thay tranh', 'aria-label': `Thay tranh ${s.title}`,
            onclick: () => goParent(app, 'scene-edit', copy ? { sceneId: copy.id } : { copyOf: s.id }),
          }))));
  }
  for (const s of own) {
    const img = (await lessonImages(app.db, s.id)).get(SCENE_IMAGE);
    let thumb = h('div.scene-thumb.small', {}, h('span.lesson-emoji', { text: '🖼️' }));
    if (img) {
      const url = URL.createObjectURL(mediaBlob(img));
      urls.push(url);
      thumb = h('div.scene-thumb.small', {}, h('img', { src: url, alt: '' }));
    }
    rows.push(h('div.lesson-row', { dataset: { scene: s.id } }, thumb,
      h('div.lesson-info', {}, h('strong', { text: s.title }), h('div.field-hint', { text: `${s.sentences.length} câu${s.copyOf ? ' · thay cho tranh có sẵn' : ''}` })),
      h('div.lesson-actions', {}, h('button.btn', { type: 'button', text: '✏️ Sửa / đổi ảnh', 'aria-label': `Sửa tranh ${s.title}`, onclick: () => goParent(app, 'scene-edit', { sceneId: s.id }) }))));
  }
  return section('🖼️ Tranh của Tả tranh',
    h('p.field-hint', { text: 'Thay tranh có sẵn: app tạo bản sao giữ nguyên các câu, có prompt để AI vẽ tranh mới theo đúng các câu đó; bố mẹ chọn ảnh rồi chạm đặt lại mũi tên.' }),
    h('div.lesson-list', {}, ...rows),
    h('button.btn', { type: 'button', text: '+ Tạo tranh mới', onclick: () => goParent(app, 'scene-edit') }));
}

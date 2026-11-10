// Góc bố mẹ → Bài học → 🖼️ Soạn tranh (SPEC-ta-tranh mục 8): ảnh tranh, tên, cấp độ, các câu (thêm / sửa / nhân bản / xóa /
// đổi thứ tự / nghe thử), ĐẶT MŨI TÊN bằng cách chạm vào tranh (Không chỉ, hướng, cỡ vùng chạm), nhờ AI (prompt + dán JSON,
// mục 8.3). Thay ảnh hoặc dán câu từ AI → mọi mũi tên "cần kiểm tra": phải xác nhận mới lưu được (8.2).

import { h, toast, copyText, confirmDialog } from '../../ui.js';
import { resizeCover } from '../../image.js';
import { setWordImage, lessonImages, mediaBlob, saveScene, deleteScene, SCENE_IMAGE } from '../../db.js';
import { arrowGeometry, hitRadius, FROM_VALUES, HIT_MIN, HIT_MAX } from '../../scene.js';
import { validateScene, parseSceneText, scenePrompt, newSid, newSceneId } from '../../scene-data.js';
import { parentLayout, goParent, section, field, notice } from './common.js';
import { imageErrorMessage } from './pictures.js';

const ARROW_SVG = '<svg viewBox="0 0 100 36" preserveAspectRatio="none"><path d="M0 13 H70 V2 L100 18 L70 34 V23 H0 Z" fill="#e03131" stroke="#fff" stroke-width="3" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
const FROM_VI = { auto: 'Tự chọn', right: 'Từ phải', left: 'Từ trái', top: 'Từ trên', bottom: 'Từ dưới', 'top-right': 'Từ trên-phải', 'top-left': 'Từ trên-trái', 'bottom-right': 'Từ dưới-phải', 'bottom-left': 'Từ dưới-trái' };
const blankSentence = () => ({ sid: newSid(), en: '', vi: '', point: null, from: 'auto', hit: 0.08, keywords: [] });

export function sceneEditView(app, { sceneId } = {}) {
  const body = parentLayout(app, { title: '🖼️ Soạn tranh', back: () => goParent(app, 'lessons') });
  const urls = [];
  let offEditor = null;
  let left = false;
  (async () => {
    const old = sceneId ? await app.db.get('scenes', sceneId) : null;
    const oldImg = old ? (await lessonImages(app.db, old.id)).get(SCENE_IMAGE) : null;
    if (!left) offEditor = editor(app, body, old, oldImg, urls);
  })().catch((err) => {
    console.error(err);
    toast('Không mở được tranh.');
  });
  return () => {
    left = true;
    offEditor?.();
    urls.splice(0).forEach((u) => URL.revokeObjectURL(u));
  };
}

function editor(app, body, old, oldImg, urls) {
  const draft = old ? structuredClone(old) : { id: newSceneId(), title: '', titleVi: '', level: 2, track: 'phonics', sentences: [blankSentence()] };
  let image = oldImg ? { blob: mediaBlob(oldImg), mimeType: oldImg.mimeType, width: oldImg.width, height: oldImg.height, fresh: false } : null;
  let active = draft.sentences.findIndex((s) => s.point) >= 0 ? draft.sentences.findIndex((s) => s.point) : 0;
  let needsCheck = false;
  const checkNote = h('div');

  // ---------- Ảnh ----------
  const imgEl = h('img', { alt: '', draggable: false });
  const setImageUrl = () => {
    if (!image) return;
    const url = URL.createObjectURL(image.blob);
    urls.push(url);
    imgEl.src = url;
  };
  const fileInput = h('input', { type: 'file', accept: 'image/*', hidden: true, 'aria-label': 'Ảnh tranh' });
  const pickBtn = h('button.btn.primary', { type: 'button', text: image ? '🔄 Đổi ảnh' : '📷 Chọn / chụp ảnh', onclick: () => fileInput.click() });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    try {
      const out = await resizeCover(file, 4 / 3, 1200);
      image = { ...out, fresh: true };
      setImageUrl();
      pickBtn.textContent = '🔄 Đổi ảnh';
      if (draft.sentences.some((s) => s.point)) markCheck('Đã thay ảnh — hãy kiểm tra lại mũi tên của từng câu.');
      renderStage();
    } catch (err) {
      toast(imageErrorMessage(err), 4000);
    }
  });

  function markCheck(why) {
    needsCheck = true;
    checkNote.replaceChildren(notice('warn', h('div', { text: why }),
      h('button.btn.small', { type: 'button', text: '✓ Mũi tên đều đúng rồi', onclick: () => { needsCheck = false; checkNote.replaceChildren(); } })));
  }

  // ---------- Tên, cấp độ ----------
  const title = h('input', { type: 'text', value: draft.title, placeholder: 'Ví dụ: At the beach', 'aria-label': 'Tên tranh' });
  title.addEventListener('input', () => { draft.title = title.value; });
  const titleVi = h('input', { type: 'text', value: draft.titleVi ?? '', placeholder: 'Ví dụ: Ở bãi biển', 'aria-label': 'Tên tiếng Việt' });
  titleVi.addEventListener('input', () => { draft.titleVi = titleVi.value; });
  const level = h('select', { 'aria-label': 'Cấp độ' }, ...[[1, 'Cấp 1 — Dễ (3–6 từ)'], [2, 'Cấp 2 — Vừa (4–9 từ)'], [3, 'Cấp 3 — Khó (6–12 từ)']]
    .map(([v, t]) => h('option', { value: String(v), text: t, selected: v === draft.level })));
  level.addEventListener('change', () => { draft.level = Number(level.value); });

  // ---------- Khung đặt mũi tên ----------
  const arrow = h('div.scene-arrow', { 'aria-hidden': 'true' });
  arrow.innerHTML = ARROW_SVG;
  const ring = h('div.hit-ring', { 'aria-hidden': 'true' });
  const dots = h('div.edit-dots');
  const frame = h('div.scene-frame.edit-frame', { 'aria-label': 'Chạm vào tranh để đặt mũi tên' }, h('div.scene-art', {}, imgEl), dots, ring, arrow);
  const activeLabel = h('p.field-hint');
  const fromSel = h('select', { 'aria-label': 'Hướng mũi tên' }, ...FROM_VALUES.map((f) => h('option', { value: f, text: FROM_VI[f] })));
  const hitRange = h('input', { type: 'range', min: String(HIT_MIN), max: String(HIT_MAX), step: '0.01', 'aria-label': 'Cỡ vùng chạm' });
  const noPoint = h('button.btn.small', { type: 'button', text: '🚫 Không chỉ (câu tả chung)' });

  function renderStage() {
    const s = draft.sentences[active];
    activeLabel.textContent = s ? `Câu ${active + 1}: ${s.en || '(chưa có chữ)'} — ${s.point ? 'chạm chỗ khác để dời mũi tên' : 'chạm vào tranh để đặt mũi tên'}` : '';
    fromSel.value = s?.from ?? 'auto';
    hitRange.value = String(s?.hit ?? 0.08);
    const box = { w: frame.clientWidth, h: frame.clientHeight };
    dots.replaceChildren(...draft.sentences.map((x, i) => (x.point && i !== active
      ? h('span.edit-dot', { text: String(i + 1), style: { left: `${x.point.x * 100}%`, top: `${x.point.y * 100}%` } }) : null)).filter(Boolean));
    if (!s?.point || !box.w) {
      arrow.hidden = true;
      ring.hidden = true;
      return;
    }
    const g = arrowGeometry(s.point, s.from, box);
    arrow.hidden = false;
    Object.assign(arrow.style, { left: `${g.tail.x}px`, top: `${g.tail.y}px`, width: `${g.length}px`, transform: `rotate(${g.angle}deg)` });
    arrow.dataset.from = g.from;
    const r = hitRadius(s, box);
    ring.hidden = false;
    Object.assign(ring.style, { left: `${g.tip.x - r}px`, top: `${g.tip.y - r}px`, width: `${2 * r}px`, height: `${2 * r}px` });
  }
  frame.addEventListener('click', (e) => {
    const s = draft.sentences[active];
    if (!s) return;
    const r = frame.getBoundingClientRect();
    const round = (v) => Math.round(Math.min(1, Math.max(0, v)) * 1000) / 1000;
    s.point = { x: round((e.clientX - r.left) / r.width), y: round((e.clientY - r.top) / r.height) };
    renderStage();
    renderList();
  });
  fromSel.addEventListener('change', () => { draft.sentences[active].from = fromSel.value; renderStage(); });
  hitRange.addEventListener('input', () => { draft.sentences[active].hit = Number(hitRange.value); renderStage(); });
  noPoint.addEventListener('click', () => { draft.sentences[active].point = null; renderStage(); renderList(); });
  const onResize = () => renderStage();
  window.addEventListener('resize', onResize);

  // ---------- Danh sách câu ----------
  const list = h('div.scene-edit-list');
  function renderList() {
    list.replaceChildren(...draft.sentences.map((s, i) => {
      const en = h('input', { type: 'text', value: s.en, placeholder: i === 0 ? 'Câu tả chung, ví dụ: It is a sunny day.' : 'Ví dụ: A boy is flying a kite.', 'aria-label': `Câu ${i + 1} tiếng Anh` });
      en.addEventListener('input', () => { s.en = en.value; if (i === active) renderStage(); });
      const vi = h('input', { type: 'text', value: s.vi, placeholder: 'Nghĩa tiếng Việt', 'aria-label': `Câu ${i + 1} tiếng Việt` });
      vi.addEventListener('input', () => { s.vi = vi.value; });
      const move = (d) => {
        const j = i + d;
        if (j < 0 || j >= draft.sentences.length) return;
        [draft.sentences[i], draft.sentences[j]] = [draft.sentences[j], draft.sentences[i]];
        if (active === i) active = j;
        else if (active === j) active = i;
        renderList();
        renderStage();
      };
      const btn = (text, label, onclick, cls = '') => h(`button.btn.small${cls}`, { type: 'button', text, 'aria-label': label, title: label, onclick });
      return h(`div.scene-edit-row${i === active ? '.active' : ''}`, { dataset: { sid: s.sid } },
        h('div.scene-edit-num', {}, h('strong', { text: String(i + 1) }), h('span', { text: s.point ? '🎯' : '—', title: s.point ? 'Có mũi tên' : 'Không chỉ' })),
        h('div.scene-edit-fields', {}, en, vi),
        h('div.lesson-actions', {},
          btn('🎯', `Đặt mũi tên câu ${i + 1}`, () => { active = i; renderList(); renderStage(); frame.scrollIntoView({ behavior: 'smooth', block: 'center' }); }),
          btn('▶', `Nghe thử câu ${i + 1}`, () => app.speaker.speak(s.en).catch(() => {})),
          btn('↑', `Đưa câu ${i + 1} lên`, () => move(-1)),
          btn('↓', `Đưa câu ${i + 1} xuống`, () => move(1)),
          btn('⧉', `Nhân bản câu ${i + 1}`, () => {
            draft.sentences.splice(i + 1, 0, { ...structuredClone(s), sid: newSid() });
            renderList();
          }),
          btn('🗑', `Xóa câu ${i + 1}`, async () => {
            if (draft.sentences.length === 1) return toast('Tranh cần ít nhất 1 câu.');
            if (s.en && !await confirmDialog(`Xóa câu "${s.en}"?`, { okText: 'Xóa', danger: true })) return;
            draft.sentences.splice(i, 1);
            active = Math.min(active, draft.sentences.length - 1);
            renderList();
            renderStage();
          }, '.danger')));
    }));
  }

  // ---------- Nhờ AI ----------
  const aiArea = h('textarea.lesson-json.ai-json', { rows: 6, placeholder: 'Dán JSON AI trả về vào đây (kể cả khối ```json).', 'aria-label': 'JSON từ AI' });
  const aiResult = h('div.import-result');
  const useAi = () => {
    aiResult.replaceChildren();
    const parsed = parseSceneText(aiArea.value);
    if (parsed.error) return aiResult.append(notice('error', parsed.error));
    const r = validateScene({ ...parsed.data, id: draft.id });
    if (!r.ok) return aiResult.append(notice('error', h('strong', { text: 'Chưa dùng được:' }), h('ul', {}, ...r.errors.map((e) => h('li', { text: e })))));
    draft.sentences = r.scene.sentences;
    if (!draft.title.trim()) draft.title = title.value = r.scene.title;
    if (!draft.titleVi?.trim()) draft.titleVi = titleVi.value = r.scene.titleVi;
    draft.level = r.scene.level;
    level.value = String(r.scene.level);
    active = Math.max(0, draft.sentences.findIndex((s) => s.point));
    aiArea.value = '';
    if (r.warnings.length) aiResult.append(notice('warn', h('strong', { text: 'Lưu ý:' }), h('ul', {}, ...r.warnings.map((w) => h('li', { text: w })))));
    markCheck(`Đã lấy ${draft.sentences.length} câu từ AI. Vị trí mũi tên AI đoán thường lệch — hãy bấm 🎯 từng câu và chạm lại cho đúng.`);
    renderList();
    renderStage();
  };

  // ---------- Lưu, xem thử, xóa ----------
  async function save() {
    if (!image) return toast('Chưa có ảnh tranh.'), false;
    if (needsCheck) return toast('Hãy kiểm tra lại mũi tên rồi bấm "✓ Mũi tên đều đúng rồi".', 4000), false;
    const r = validateScene(draft);
    if (!r.ok) {
      toast(r.errors[0], 5000);
      return false;
    }
    try {
      if (image.fresh) {
        await setWordImage(app.db, { lessonId: r.scene.id, wordId: SCENE_IMAGE, ...image });
        image.fresh = false;
      }
      Object.assign(draft, await saveScene(app.db, { ...r.scene, createdAt: old?.createdAt ?? null }));
      toast(r.warnings.length ? `Đã lưu tranh. Lưu ý: ${r.warnings[0]}` : 'Đã lưu tranh.', 4000);
      return true;
    } catch (err) {
      toast(imageErrorMessage(err), 4000);
      return false;
    }
  }

  setImageUrl();
  renderList();
  body.append(
    section('Ảnh tranh', h('p.field-hint', { text: 'Tranh nhiều người / vật đang làm các việc khác nhau, nét rõ, không có chữ. App cắt về khung 4:3.' }),
      h('div.lesson-actions', {}, pickBtn), fileInput),
    section('Tên và cấp độ', field('Tên tranh (tiếng Anh)', title), field('Tên tiếng Việt', titleVi), field('Cấp độ câu', level)),
    section('🎯 Đặt mũi tên', activeLabel, frame, h('div.lesson-actions', {}, noPoint, fromSel), field('Cỡ vùng chạm (vòng tròn mờ)', hitRange), checkNote),
    section('Các câu', list, h('button.btn', { type: 'button', text: '+ Thêm câu', onclick: () => { draft.sentences.push(blankSentence()); active = draft.sentences.length - 1; renderList(); renderStage(); } })),
    section('✨ Nhờ AI viết câu',
      h('p.field-hint', { text: 'Bấm "Chép prompt", dán vào ChatGPT / Claude / Gemini KÈM ẢNH tranh. Dán kết quả vào ô dưới rồi bấm "Dùng các câu này".' }),
      h('button.btn', { type: 'button', text: '📋 Chép prompt', onclick: () => copyText(scenePrompt({ level: draft.level })).then((ok) => toast(ok ? 'Đã chép prompt. Gửi cho AI kèm ảnh tranh.' : 'Không chép được.')) }),
      aiArea, h('button.btn.primary', { type: 'button', text: 'Dùng các câu này', onclick: useAi }), aiResult),
    h('div.lesson-actions.sticky-actions', {},
      h('button.btn.primary', { type: 'button', text: '💾 Lưu tranh', onclick: () => save() }),
      h('button.btn', { type: 'button', text: '👀 Xem thử', onclick: async () => { if (await save()) app.go('scene', { sceneId: draft.id }); } }),
      old ? h('button.btn.danger', {
        type: 'button', text: '🗑 Xóa tranh',
        onclick: async () => {
          if (!await confirmDialog(`Xóa tranh "${draft.title}"? Ảnh và kết quả nghe của tranh cũng bị xóa.`, { okText: 'Xóa', danger: true })) return;
          await deleteScene(app.db, draft.id);
          toast('Đã xóa tranh.');
          goParent(app, 'lessons');
        },
      }) : null),
  );
  requestAnimationFrame(renderStage);
  imgEl.addEventListener('load', renderStage);
  return () => window.removeEventListener('resize', onResize);
}

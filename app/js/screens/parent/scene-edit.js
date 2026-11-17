// Góc bố mẹ → Bài học → 🖼️ Soạn tranh (SPEC-ta-tranh mục 8): ảnh tranh, tên, cấp độ, các câu (thêm / sửa / nhân bản / xóa /
// đổi thứ tự / nghe thử), ĐẶT MŨI TÊN bằng cách chạm vào tranh (Không chỉ, hướng, cỡ vùng chạm), nhờ AI (prompt + dán JSON,
// mục 8.3). Thay ảnh hoặc dán câu từ AI → mọi mũi tên "cần kiểm tra": phải xác nhận TỪNG CÂU mới lưu được (8.2, 8.6).
// Mục 4.5: kéo trên tranh để khoanh khung đối tượng (vùng chạm phủ trọn người / vật); "👆 Thử chạm như bé" để thử vùng chạm.

import { h, toast, copyText, confirmDialog } from '../../ui.js';
import { resizeCover } from '../../image.js';
import { setWordImage, lessonImages, mediaBlob, saveScene, deleteScene, SCENE_IMAGE } from '../../db.js';
import {
  arrowGeometry, hitRadius, hitCenter, hitRect, hitRects, boxesOf, MAX_BOXES, pickSentence, normalizeBox, arrowForBox, FROM_VALUES, HIT_MIN, HIT_MAX,
} from '../../scene.js';
import {
  validateScene, parseSceneText, scenePrompt, scenePicturePrompt, newSid, newSceneId, SCENE_TOPICS, SCENE_TOPIC_BY_ID, sceneTopicPrompt, TOPIC_THINGS,
} from '../../scene-data.js';
import { SCENE_BY_ID } from '../../data/builtin-scenes.js';
import { parentLayout, goParent, section, field, notice } from './common.js';
import { imageErrorMessage } from './pictures.js';

const ARROW_SVG = '<svg viewBox="0 0 100 36" preserveAspectRatio="none"><path d="M0 13 H70 V2 L100 18 L70 34 V23 H0 Z" fill="#e03131" stroke="#fff" stroke-width="3" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
const FROM_VI = { auto: 'Tự chọn', right: 'Từ phải', left: 'Từ trái', top: 'Từ trên', bottom: 'Từ dưới', 'top-right': 'Từ trên-phải', 'top-left': 'Từ trên-trái', 'bottom-right': 'Từ dưới-phải', 'bottom-left': 'Từ dưới-trái' };
const blankSentence = () => ({ sid: newSid(), en: '', vi: '', point: null, from: 'auto', hit: 0.08, keywords: [] });

export function sceneEditView(app, { sceneId, copyOf } = {}) {
  const body = parentLayout(app, { title: '🖼️ Soạn tranh', back: () => goParent(app, 'lessons') });
  const urls = [];
  let offEditor = null;
  let left = false;
  (async () => {
    const old = sceneId ? await app.db.get('scenes', sceneId) : null;
    const oldImg = old ? (await lessonImages(app.db, old.id)).get(SCENE_IMAGE) : null;
    const base = !old && copyOf ? SCENE_BY_ID.get(copyOf) : null;
    if (!left) offEditor = editor(app, body, old, oldImg, urls, base);
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

function editor(app, body, old, oldImg, urls, base = null) {
  // `base`: tranh có sẵn đang được thay → bản sao giữ nguyên câu + mũi tên, chọn ảnh mới rồi đặt lại mũi tên.
  const draft = old ? structuredClone(old) : base
    ? { id: newSceneId(), title: base.title, titleVi: base.titleVi ?? '', level: base.level, track: base.track, copyOf: base.id, sentences: structuredClone(base.sentences) }
    : { id: newSceneId(), title: '', titleVi: '', level: 2, track: 'phonics', sentences: [blankSentence()] };
  let image = oldImg ? { blob: mediaBlob(oldImg), mimeType: oldImg.mimeType, width: oldImg.width, height: oldImg.height, fresh: false } : null;
  let active = draft.sentences.findIndex((s) => s.point) >= 0 ? draft.sentences.findIndex((s) => s.point) : 0;
  const unchecked = new Set(); // sid các câu có mũi tên chưa được bố mẹ kiểm tra (mục 8.6)
  let checkWhy = '';
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
      if (draft.sentences.some((s) => s.point)) markCheck('Đã thay ảnh — mũi tên / khung cũ có thể không còn đúng chỗ.');
      renderStage();
    } catch (err) {
      toast(imageErrorMessage(err), 4000);
    }
  });

  /** Mọi câu có mũi tên phải được kiểm tra lại TỪNG CÂU (không có nút "đúng hết"): bấm 🎯, chỉnh nếu lệch, bấm ✓. */
  function markCheck(why) {
    checkWhy = why;
    for (const x of draft.sentences) if (x.point) unchecked.add(x.sid);
    renderCheckNote();
  }
  function renderCheckNote() {
    for (const sid of [...unchecked]) if (!draft.sentences.some((x) => x.sid === sid && x.point)) unchecked.delete(sid);
    checkNote.replaceChildren(...(unchecked.size ? [notice('warn', h('div', {
      text: `${checkWhy} Còn ${unchecked.size} câu chưa kiểm tra (⚠️ trong danh sách): bấm 🎯 từng câu, kéo khoanh lại khung nếu lệch, rồi bấm "✓ Câu này đúng".`,
    }))] : []));
  }
  /** Bố mẹ vừa xem / chỉnh mũi tên của câu: câu đó đã kiểm tra. */
  function checked(x) {
    if (!unchecked.delete(x.sid)) return;
    renderCheckNote();
  }

  // ---------- Tên, cấp độ ----------
  const title = h('input', { type: 'text', value: draft.title, placeholder: 'Ví dụ: At the beach', 'aria-label': 'Tên tranh' });
  title.addEventListener('input', () => { draft.title = title.value; });
  const titleVi = h('input', { type: 'text', value: draft.titleVi ?? '', placeholder: 'Ví dụ: Ở bãi biển', 'aria-label': 'Tên tiếng Việt' });
  titleVi.addEventListener('input', () => { draft.titleVi = titleVi.value; });
  const level = h('select', { 'aria-label': 'Cấp độ' }, ...[[1, 'Cấp 1 — Dễ (3–6 từ)'], [2, 'Cấp 2 — Vừa (4–9 từ)'], [3, 'Cấp 3 — Khó (6–12 từ)']]
    .map(([v, t]) => h('option', { value: String(v), text: t, selected: v === draft.level })));
  level.addEventListener('change', () => { draft.level = Number(level.value); });

  // ---------- Tranh mới theo chủ đề (mục 8.5): chọn chủ đề → chép prompt vẽ tranh → chọn ảnh → chép prompt viết câu ----------
  let topicId = null;
  const topicSel = h('select', { 'aria-label': 'Chủ đề tranh' }, h('option', { value: '', text: '— Chọn chủ đề —' }),
    ...SCENE_TOPICS.map((t) => h('option', { value: t.id, text: `${t.titleVi} — ${t.title}` })));
  topicSel.addEventListener('change', () => {
    const prev = SCENE_TOPIC_BY_ID.get(topicId);
    topicId = topicSel.value || null;
    const t = SCENE_TOPIC_BY_ID.get(topicId);
    if (!t) return;
    // Tên còn trống (hoặc vẫn là tên của chủ đề chọn trước) → điền tên chủ đề.
    if (!draft.title.trim() || draft.title === prev?.title) title.value = draft.title = t.title;
    if (!draft.titleVi?.trim() || draft.titleVi === prev?.titleVi) titleVi.value = draft.titleVi = t.titleVi;
  });
  const drawTopicBtn = h('button.btn.primary', {
    type: 'button', text: '📋 Chép prompt vẽ tranh theo chủ đề',
    onclick: () => {
      if (!topicId) return toast('Chọn chủ đề trước nhé.');
      copyText(sceneTopicPrompt(topicId, draft.level)).then((ok) => toast(ok
        ? 'Đã chép prompt vẽ tranh. Dán vào ChatGPT / Gemini để AI vẽ, lưu ảnh về máy rồi bấm "Chọn / chụp ảnh".'
        : 'Không chép được.', 4500));
    },
  });

  // ---------- Khung đặt mũi tên ----------
  const arrow = h('div.scene-arrow', { 'aria-hidden': 'true' });
  arrow.innerHTML = ARROW_SVG;
  const ring = h('div.hit-ring', { 'aria-hidden': 'true' });
  const objBox = h('div.edit-box', { 'aria-hidden': 'true', hidden: true }); // khung đối tượng = vùng chạm (mục 4.5)
  const moreBoxes = h('div.more-boxes', { 'aria-hidden': 'true' }); // khung thêm của câu (mục 4.6)
  const moreArrows = h('div.more-arrows', { 'aria-hidden': 'true' });
  let addMode = false; // lần kéo tới: khoanh khung THÊM (không thay khung chính)
  // Hướng mũi tên bố mẹ tự chọn cho câu có khung (sid → hướng): kéo / dời khung vẫn giữ hướng đó.
  const manualSide = new Map(draft.sentences.filter((x) => x.box && x.from && x.from !== arrowForBox(x.box).from).map((x) => [x.sid, x.from]));
  const placeBoxArrow = (x) => Object.assign(x, arrowForBox(x.box, manualSide.get(x.sid)));
  const addBoxBtn = h('button.btn.small', { type: 'button', text: '+ Thêm khung' });
  const clearMoreBtn = h('button.btn.small', { type: 'button', text: '🗑 Bỏ khung thêm' });
  const dragBox = h('div.edit-box.drawing', { 'aria-hidden': 'true', hidden: true });
  const tryMark = h('div.try-mark', { 'aria-hidden': 'true', hidden: true });
  const dots = h('div.edit-dots');
  const frame = h('div.scene-frame.edit-frame', { 'aria-label': 'Kéo để khoanh người / vật, chạm để đặt mũi tên' }, h('div.scene-art', {}, imgEl), dots, ring, objBox, moreBoxes, dragBox, tryMark, arrow, moreArrows);
  let tryMode = false;
  const tryBtn = h('button.btn.small', { type: 'button', text: '👆 Thử chạm như bé', 'aria-pressed': 'false' });
  const checkBtn = h('button.btn.small.primary', { type: 'button', text: '✓ Câu này đúng' });
  const activeLabel = h('p.field-hint');
  const fromSel = h('select', { 'aria-label': 'Hướng mũi tên' }, ...FROM_VALUES.map((f) => h('option', { value: f, text: FROM_VI[f] })));
  const hitRange = h('input', { type: 'range', min: String(HIT_MIN), max: String(HIT_MAX), step: '0.01', 'aria-label': 'Cỡ vùng chạm' });
  const noPoint = h('button.btn.small', { type: 'button', text: '🚫 Không chỉ (câu tả chung)' });

  function renderStage() {
    const s = draft.sentences[active];
    activeLabel.textContent = tryMode ? '👆 Đang thử: chạm vào tranh như bé — app cho biết trúng câu nào. Bấm lại nút để thôi thử.'
      : s ? `Câu ${active + 1}: ${s.en || '(chưa có chữ)'} — ${addMode ? '➕ KÉO để khoanh khung thêm (chỗ thứ hai của nhóm đồ vật)' : s.box ? 'kéo để khoanh lại khung chính, chạm để dời khung chính' : 'KÉO để khoanh trọn người / vật (vùng chạm), hoặc chạm để đặt mũi tên'}${unchecked.has(s.sid) ? ' · ⚠️ chưa kiểm tra' : ''}` : '';
    addBoxBtn.hidden = !s?.box || boxesOf(s).length >= MAX_BOXES;
    addBoxBtn.classList.toggle('primary', addMode);
    clearMoreBtn.hidden = !s?.more?.length;
    fromSel.value = s?.from ?? 'auto';
    hitRange.value = String(s?.hit ?? 0.08);
    hitRange.disabled = Boolean(s?.box); // có khung: vùng chạm là khung, không dùng vòng tròn
    checkBtn.hidden = !s || !unchecked.has(s.sid);
    const box = { w: frame.clientWidth, h: frame.clientHeight };
    objBox.hidden = !s?.box || !box.w;
    if (s?.box && box.w) {
      const r = hitRect(s, box);
      Object.assign(objBox.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    }
    // Khung thêm: khung nét đứt + mũi tên cùng hướng mũi tên chính (bé thấy như vậy).
    const extra = box.w ? hitRects(s ?? {}, box).slice(1) : [];
    moreBoxes.replaceChildren(...extra.map((r) => h('div.edit-box.more', { style: { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` } })));
    moreArrows.replaceChildren(...(box.w && s?.point ? (s.more ?? []) : []).map((b) => {
      const a = arrowForBox(b, s.from);
      const e = arrowGeometry(a.point, a.from, box);
      const el = h('div.scene-arrow.more', { html: ARROW_SVG });
      Object.assign(el.style, { left: `${e.tail.x}px`, top: `${e.tail.y}px`, width: `${e.length}px`, transform: `rotate(${e.angle}deg)` });
      return el;
    }));
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
    ring.hidden = Boolean(s.box);
    if (s.box) return;
    const r = hitRadius(s, box);
    const c = hitCenter(s);
    Object.assign(ring.style, { left: `${c.x * box.w - r}px`, top: `${c.y * box.h - r}px`, width: `${2 * r}px`, height: `${2 * r}px` });
  }
  // Chạm = đặt mũi tên (câu có khung: dời khung tới chỗ chạm); kéo = khoanh khung đối tượng; đang thử = chạm như bé.
  const DRAG_PX = 8;
  let press = null;
  const rel = (e) => {
    const r = frame.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)), r };
  };
  const round = (v) => Math.round(Math.min(1, Math.max(0, v)) * 1000) / 1000;
  frame.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    press = { start: rel(e), x0: e.clientX, y0: e.clientY, dragging: false, id: e.pointerId };
    frame.setPointerCapture?.(e.pointerId);
  });
  frame.addEventListener('pointermove', (e) => {
    if (!press || tryMode || e.pointerId !== press.id) return;
    if (!press.dragging && Math.hypot(e.clientX - press.x0, e.clientY - press.y0) < DRAG_PX) return;
    press.dragging = true;
    e.preventDefault();
    const a = press.start;
    const b = rel(e);
    Object.assign(dragBox.style, {
      left: `${Math.min(a.x, b.x) * 100}%`, top: `${Math.min(a.y, b.y) * 100}%`, width: `${Math.abs(b.x - a.x) * 100}%`, height: `${Math.abs(b.y - a.y) * 100}%`,
    });
    dragBox.hidden = false;
  });
  const endPress = (e) => {
    if (!press || e.pointerId !== press.id) return;
    const p = press;
    press = null;
    dragBox.hidden = true;
    const s = draft.sentences[active];
    const at = rel(e);
    if (tryMode) return tryTap(at);
    if (!s) return;
    if (p.dragging) {
      const b = normalizeBox({ x: Math.min(p.start.x, at.x), y: Math.min(p.start.y, at.y), w: Math.abs(at.x - p.start.x), h: Math.abs(at.y - p.start.y) });
      if (addMode && s.box) s.more = [...(s.more ?? []), b].slice(0, MAX_BOXES - 1); // khung thêm (mục 4.6)
      else {
        s.box = b;
        placeBoxArrow(s);
      }
      addMode = false;
    } else if (s.box) {
      // Chạm khi đã có khung: dời khung chính (giữ cỡ) cho tâm khung tới chỗ chạm.
      s.box = normalizeBox({ x: at.x - s.box.w / 2, y: at.y - s.box.h / 2, w: s.box.w, h: s.box.h });
      placeBoxArrow(s);
    } else s.point = { x: round(at.x), y: round(at.y) };
    delete s.at; // bố mẹ đặt thẳng vào đối tượng: vùng chạm theo chỗ vừa đặt
    checked(s);
    renderStage();
    renderList();
  };
  frame.addEventListener('pointerup', endPress);
  frame.addEventListener('pointercancel', () => { press = null; dragBox.hidden = true; });
  /** Thử chạm như bé (mục 8.6): chạm trúng câu nào thì sáng vùng câu đó + báo; trượt thì báo trượt. */
  function tryTap(at) {
    const box = { w: frame.clientWidth, h: frame.clientHeight };
    const i = pickSentence(draft.sentences, { x: at.x * box.w, y: at.y * box.h }, box, active);
    Object.assign(tryMark.style, { left: `${at.x * 100}%`, top: `${at.y * 100}%` });
    tryMark.hidden = false;
    tryMark.classList.toggle('miss', i < 0);
    if (i < 0) {
      toast('Không trúng câu nào — bé chạm chỗ này sẽ bị tính là chưa đúng.', 3000);
      return;
    }
    active = i;
    renderList();
    renderStage();
    toast(`Trúng câu ${i + 1}: ${draft.sentences[i].en}`, 3000);
  }
  tryBtn.addEventListener('click', () => {
    tryMode = !tryMode;
    tryBtn.setAttribute('aria-pressed', String(tryMode));
    tryBtn.classList.toggle('primary', tryMode);
    frame.classList.toggle('trying', tryMode);
    tryMark.hidden = true;
    renderStage();
  });
  checkBtn.addEventListener('click', () => {
    const s = draft.sentences[active];
    if (!s) return;
    checked(s);
    // Sang câu chưa kiểm tra kế tiếp.
    const next = draft.sentences.findIndex((x) => unchecked.has(x.sid));
    if (next >= 0) active = next;
    renderList();
    renderStage();
  });
  fromSel.addEventListener('change', () => {
    const s = draft.sentences[active];
    if (s.box) {
      // Câu có khung: đầu mũi tên chuyển sang đúng cạnh / góc khung phía đã chọn; "Tự chọn" = phía nhiều chỗ trống nhất.
      if (fromSel.value === 'auto') manualSide.delete(s.sid);
      else manualSide.set(s.sid, fromSel.value);
      placeBoxArrow(s);
    } else s.from = fromSel.value;
    renderStage();
  });
  addBoxBtn.addEventListener('click', () => {
    addMode = !addMode;
    renderStage();
  });
  clearMoreBtn.addEventListener('click', () => {
    delete draft.sentences[active].more;
    addMode = false;
    renderStage();
    renderList();
  });
  hitRange.addEventListener('input', () => { draft.sentences[active].hit = Number(hitRange.value); renderStage(); });
  noPoint.addEventListener('click', () => {
    const s = draft.sentences[active];
    s.point = null;
    delete s.box;
    delete s.more;
    checked(s);
    renderStage();
    renderList();
  });
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
        h('div.scene-edit-num', {}, h('strong', { text: String(i + 1) }), unchecked.has(s.sid)
          ? h('span.unchecked', { text: '⚠️', title: 'Chưa kiểm tra mũi tên / khung' })
          : h('span', { text: s.box ? (s.more?.length ? `🔲×${s.more.length + 1}` : '🔲') : s.point ? '🎯' : '—', title: s.box ? `Có ${s.more?.length ? `${s.more.length + 1} khung` : 'khung'}` : s.point ? 'Có mũi tên' : 'Không chỉ' })),
        h('div.scene-edit-fields', {}, en, vi),
        h('div.lesson-actions', {},
          btn('🎯', `Đặt mũi tên câu ${i + 1}`, () => { active = i; addMode = false; renderList(); renderStage(); frame.scrollIntoView({ behavior: 'smooth', block: 'center' }); }),
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
    markCheck(`Đã lấy ${draft.sentences.length} câu từ AI. Khung AI khoanh có thể lệch.`);
    renderList();
    renderStage();
  };

  // ---------- Lưu, xem thử, xóa ----------
  async function save() {
    if (!image) return toast('Chưa có ảnh tranh.'), false;
    if (unchecked.size) {
      active = draft.sentences.findIndex((x) => unchecked.has(x.sid));
      renderList();
      renderStage();
      return toast(`Còn ${unchecked.size} câu chưa kiểm tra mũi tên / khung (⚠️). Bấm 🎯 từng câu rồi "✓ Câu này đúng".`, 4500), false;
    }
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
      Object.assign(draft, await saveScene(app.db, { ...r.scene, copyOf: draft.copyOf ?? null, createdAt: old?.createdAt ?? null }));
      // Bản sao thay cho tranh có sẵn: ẩn tranh gốc ở danh sách của bé (Kho ảnh → Hiện lại).
      if (draft.copyOf && !(app.settings.hiddenScenes ?? []).includes(draft.copyOf)) {
        await app.setSetting('hiddenScenes', [...(app.settings.hiddenScenes ?? []), draft.copyOf]);
      }
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
    section('🎨 Tranh mới theo chủ đề',
      h('p.field-hint', { text: `1. Chọn chủ đề và cấp độ câu → bấm "Chép prompt vẽ tranh theo chủ đề", dán vào ChatGPT / Gemini để AI vẽ, lưu ảnh về máy. 2. Bấm "Chọn / chụp ảnh" ở mục Ảnh tranh. 3. Ở mục "Nhờ AI viết câu" bấm "Chép prompt", dán vào AI kèm ảnh, dán kết quả lại. Cấp 1 vẽ ${TOPIC_THINGS[1]} người / vật, cấp 2 vẽ ${TOPIC_THINGS[2]}, cấp 3 vẽ ${TOPIC_THINGS[3]}.` }),
      field('Chủ đề', topicSel), field('Cấp độ câu', level), drawTopicBtn),
    section('Ảnh tranh', h('p.field-hint', { text: 'Tranh nhiều người / vật đang làm các việc khác nhau, nét rõ, không có chữ. App cắt về khung 4:3.' }),
      base ? notice('info', `Đang thay tranh có sẵn "${base.title}": giữ nguyên ${base.sentences.length} câu. Bấm "Chép prompt vẽ tranh" để AI vẽ tranh mới đúng các câu này, lưu ảnh rồi chọn ảnh, sau đó đặt lại mũi tên.`) : null,
      h('div.lesson-actions', {}, pickBtn,
        h('button.btn', { type: 'button', text: '📋 Chép prompt vẽ tranh theo các câu', onclick: () => {
          const ok = draft.sentences.some((s) => s.en.trim());
          if (!ok) return toast('Chưa có câu nào để vẽ.');
          copyText(scenePicturePrompt(draft)).then((done) => toast(done ? 'Đã chép prompt vẽ tranh. Dán vào ChatGPT / Gemini để AI vẽ.' : 'Không chép được.'));
        } })), fileInput),
    section('Tên tranh', field('Tên tranh (tiếng Anh)', title), field('Tên tiếng Việt', titleVi)),
    section('🎯 Đặt mũi tên', checkNote, activeLabel, frame, h('div.lesson-actions', {}, checkBtn, addBoxBtn, clearMoreBtn, noPoint, fromSel, tryBtn),
      field('Cỡ vùng chạm (vòng tròn mờ — chỉ khi chưa khoanh khung)', hitRange)),
    section('Các câu', list, h('button.btn', { type: 'button', text: '+ Thêm câu', onclick: () => { draft.sentences.push(blankSentence()); active = draft.sentences.length - 1; renderList(); renderStage(); } })),
    section('✨ Nhờ AI viết câu',
      h('p.field-hint', { text: 'Bấm "Chép prompt", dán vào ChatGPT / Claude / Gemini KÈM ẢNH tranh. Dán kết quả vào ô dưới rồi bấm "Dùng các câu này".' }),
      h('button.btn', { type: 'button', text: '📋 Chép prompt', onclick: () => copyText(scenePrompt({ level: draft.level, topic: topicId })).then((ok) => toast(ok ? 'Đã chép prompt. Gửi cho AI kèm ảnh tranh.' : 'Không chép được.')) }),
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

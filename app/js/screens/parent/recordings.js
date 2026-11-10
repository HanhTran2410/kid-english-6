// Góc bố mẹ → 🎙️ Ghi âm (SPEC 6.2): nghe lại giọng bé theo ngày (mới trước), câu bé cần nói + tên bài; xóa từng bản,
// xóa toàn bộ; tổng dung lượng / 150 MB. Ghi âm chỉ ở trên máy này.

import { h, toast, confirmDialog, formatBytes, formatDateTime } from '../../ui.js';
import { mediaBlob, mediaSize, RECORDINGS_MAX_BYTES } from '../../db.js';
import { dayKey } from '../../text.js';
import { BUILTIN_BY_ID } from '../../data/builtin-lessons.js';
import { parentLayout, goParent, section, notice } from './common.js';

export function recordingsView(app) {
  const body = parentLayout(app, { title: '🎙️ Ghi âm', back: () => goParent(app) });
  const urls = [];
  let audio = null;
  const stop = () => {
    audio?.pause();
    audio = null;
  };
  (async () => {
    const list = (await app.db.getAll('recordings')).sort((a, b) => b.date - a.date);
    const own = new Map((await app.db.getAll('lessons')).map((l) => [l.id, l]));
    const titleOf = (id) => (BUILTIN_BY_ID.get(id) ?? own.get(id))?.title ?? '';
    const total = list.reduce((n, r) => n + (r.size ?? mediaSize(r)), 0);

    body.append(
      notice('info', 'Giọng bé chỉ lưu trên máy này, không gửi đi đâu. Mỗi câu ghi tối đa 1 bản / ngày; quá 150 MB thì app tự xóa bản cũ (giữ bản đầu tiên của mỗi câu để so tiến bộ).'),
      app.settings.recordVoice ? null : notice('warn', 'Đang tắt ghi âm (Cài đặt → 🎤).'),
      h('p.field-hint.rec-total', { text: `${list.length} bản ghi · ${formatBytes(total)} / ${formatBytes(RECORDINGS_MAX_BYTES)}` }),
    );
    if (!list.length) {
      body.append(h('p.muted', { text: 'Chưa có ghi âm. Khi bé chơi khu 💬 Nói chuyện, câu bé nói sẽ được ghi lại ở đây.' }));
      return;
    }
    const days = new Map();
    for (const r of list) {
      const k = dayKey(new Date(r.date));
      if (!days.has(k)) days.set(k, []);
      days.get(k).push(r);
    }
    for (const [day, recs] of days) {
      const [y, m, d] = day.split('-');
      body.append(section(`📅 ${d}/${m}/${y}`, ...recs.map((r) => {
        const row = h('div.lesson-row.rec-row', { dataset: { id: r.id } },
          h('button.btn.small', {
            type: 'button', text: '▶', 'aria-label': `Nghe ${r.text || r.word}`,
            onclick: () => {
              stop();
              const url = URL.createObjectURL(mediaBlob(r));
              urls.push(url);
              audio = new Audio(url);
              audio.play().catch(() => toast('Máy không phát được bản ghi này.'));
            },
          }),
          h('div.lesson-info', {},
            h('strong', { text: r.text || r.word }),
            h('div.field-hint', { text: [titleOf(r.lessonId), formatDateTime(r.date).slice(-5), r.durationMs ? `${Math.round(r.durationMs / 1000)} giây` : ''].filter(Boolean).join(' · ') })),
          h('button.btn.small.danger', {
            type: 'button', text: '✕', 'aria-label': `Xóa ghi âm ${r.text || r.word}`,
            onclick: async () => {
              if (!await confirmDialog('Xóa bản ghi âm này?', { okText: 'Xóa', danger: true })) return;
              await app.db.delete('recordings', r.id);
              goParent(app, 'recordings');
            },
          }));
        return row;
      })));
    }
    body.append(h('button.btn.danger', {
      type: 'button', text: '🗑 Xóa toàn bộ ghi âm',
      onclick: async () => {
        if (!await confirmDialog(`Xóa toàn bộ ${list.length} bản ghi âm? Không lấy lại được.`, { okText: 'Xóa hết', danger: true })) return;
        await app.db.write(['recordings'], (tx) => tx.objectStore('recordings').clear());
        toast('Đã xóa toàn bộ ghi âm.');
        goParent(app, 'recordings');
      },
    }));
  })().catch((err) => {
    console.error(err);
    toast('Không mở được ghi âm.');
  });
  return () => {
    stop();
    urls.forEach((u) => URL.revokeObjectURL(u));
  };
}

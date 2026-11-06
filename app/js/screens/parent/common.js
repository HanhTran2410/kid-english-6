// Khung chung cho các trang của Góc bố mẹ (lấy từ kid-english), có chuông thông báo (SPEC 6.3).

import { h } from '../../ui.js';
import { noticeBell } from '../notice-bell.js';

/**
 * @param {{ title: string, back?: () => void }} options back = null ở trang menu
 * @returns {HTMLElement} vùng nội dung
 */
export function parentLayout(app, { title, back }) {
  app.root.className = 'parent-screen';
  const body = h('div.parent-body');
  app.root.append(
    h('header.parent-top', {},
      back ? h('button.btn.back', { type: 'button', text: '← Quay lại', onclick: back }) : null,
      h('h1', { text: title }),
      noticeBell(app)),
    body,
  );
  return body;
}

export const goParent = (app, view = 'menu', params = {}) => app.go('parent', { view, ...params });

export function section(title, ...children) {
  return h('section.panel', {}, title ? h('h2', { text: title }) : null, ...children);
}

export function notice(kind, ...children) {
  return h(`div.notice.${kind}`, {}, ...children);
}

export function field(label, control, hint) {
  return h('label.field', {}, h('span.field-label', { text: label }), control, hint ? h('span.field-hint', { text: hint }) : null);
}

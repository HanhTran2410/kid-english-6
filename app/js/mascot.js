// Nhân vật của app: cú Olly (vẽ SVG). Olly "nói" (nhún) khi giọng đọc đang đọc — lớp .talking do app gắn.

import { h } from './ui.js';

export const MASCOT_SVG = `
<svg viewBox="0 0 200 200" aria-hidden="true">
  <ellipse class="olly-shadow" cx="100" cy="188" rx="54" ry="8" fill="rgba(30,40,80,0.15)"/>
  <path d="M46 70 L40 34 L72 54 Z" fill="#5b6bd6"/>
  <path d="M154 70 L160 34 L128 54 Z" fill="#5b6bd6"/>
  <ellipse cx="100" cy="112" rx="64" ry="72" fill="#6c7ce8"/>
  <ellipse cx="100" cy="132" rx="40" ry="46" fill="#dfe4ff"/>
  <path d="M74 132 q8 6 16 0 M110 132 q8 6 16 0 M86 150 q8 6 16 0 M98 166 q4 3 8 0" stroke="#b9c1f2" stroke-width="3" fill="none" stroke-linecap="round"/>
  <g class="olly-wing-left"><path d="M38 110 Q20 140 44 168 Q52 140 52 112 Z" fill="#5b6bd6"/></g>
  <g class="olly-wing-right"><path d="M162 110 Q180 140 156 168 Q148 140 148 112 Z" fill="#5b6bd6"/></g>
  <circle cx="74" cy="84" r="25" fill="#fff"/><circle cx="126" cy="84" r="25" fill="#fff"/>
  <circle cx="74" cy="84" r="25" fill="none" stroke="#ffb703" stroke-width="5"/><circle cx="126" cy="84" r="25" fill="none" stroke="#ffb703" stroke-width="5"/>
  <path d="M99 84 h2" stroke="#ffb703" stroke-width="5"/>
  <g class="olly-eyes"><circle cx="78" cy="86" r="10" fill="#26215c"/><circle cx="122" cy="86" r="10" fill="#26215c"/>
  <circle cx="81" cy="82" r="3.5" fill="#fff"/><circle cx="125" cy="82" r="3.5" fill="#fff"/></g>
  <path class="olly-beak" d="M92 104 L108 104 L100 118 Z" fill="#ff9f1c"/>
  <path d="M78 184 v-10 M88 184 v-10 M112 184 v-10 M122 184 v-10" stroke="#ff9f1c" stroke-width="6" stroke-linecap="round"/>
</svg>`;

/** Phần tử Olly (dùng ở màn Bắt đầu, màn chính, màn nghỉ). */
export function mascotElement(className = '') {
  const el = h(`div.olly${className ? `.${className}` : ''}`);
  el.innerHTML = MASCOT_SVG;
  return el;
}

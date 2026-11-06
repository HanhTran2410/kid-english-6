// Các màn hình của bé: Bắt đầu, màn hình chính (4 khu học), khu chưa làm, Olly đi ngủ.

import { h, holdButton, toast } from '../ui.js';
import { APP_VERSION } from '../app.js';
import { play } from '../speech/sfx.js';
import { mascotElement } from '../mascot.js';
import { ZONES, ZONE_BY_ID, greeting } from '../zones.js';
import { noticeBell } from './notice-bell.js';

export const PARENT_HOLD_MS = 3000;

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

const say = (app, text) => app.speaker.speak(text).catch(() => {});

function parentButton(app) {
  const btn = holdButton({
    label: '⚙️',
    title: 'Góc bố mẹ — nhấn giữ 3 giây',
    ms: PARENT_HOLD_MS,
    className: 'parent-hold',
    onHold: () => app.go('parent'),
    onShortTap: () => toast('Bố mẹ nhấn giữ ⚙️ 3 giây (đến khi vòng vàng đầy) để mở Góc bố mẹ.', 3500),
  });
  return h('div.parent-entry', {}, btn, h('span.parent-caption', { text: 'Bố mẹ (giữ 3 giây)' }));
}

export function homeButton(app) {
  return h('button.home-btn-small', {
    type: 'button',
    'aria-label': 'Về màn hình chính',
    text: '🏠',
    onclick: () => {
      play('tap');
      app.go('home');
    },
  });
}

// ---------- Bắt đầu ----------

export function startScreen(app) {
  app.root.className = 'child-screen start';
  const notes = [];
  if (isIOS() && !isStandalone()) {
    notes.push('Hãy mở app từ biểu tượng trên Màn hình chính. Mở trong Safari thì dữ liệu lưu riêng và có thể bị xóa sau 7 ngày không dùng.');
  }
  if (!app.speaker.hasEnglish) {
    notes.push('Máy chưa có giọng đọc tiếng Anh. Vào Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Anh để tải giọng.');
  }
  app.root.append(
    h('button.start-btn', {
      type: 'button',
      'aria-label': 'Bắt đầu',
      onclick: async () => {
        await app.unlock();
        app.go(app.timeUp ? 'sleep' : 'home');
      },
    }, mascotElement('start-olly'), h('span.start-label', { text: '▶' })),
    h('p.start-title', { text: `${app.settings.characterName} English` }),
    ...notes.map((t) => h('p.start-note', { text: t })),
    h('p.version', { text: `v${APP_VERSION}` }),
  );
}

// ---------- Màn hình chính ----------

export function homeScreen(app) {
  app.root.className = 'child-screen home';
  const cards = ZONES.map((zone) => h(`button.zone-card.zone-${zone.color}`, {
    type: 'button',
    'aria-label': zone.vi,
    dataset: { zone: zone.id },
    onclick: () => {
      play('tap');
      app.go(zone.ready ? zone.id : 'zone-soon', { zone: zone.id });
    },
  }, h('span.zone-emoji', { text: zone.emoji }), h('span.zone-en', { text: zone.en }), h('span.zone-vi', { text: zone.vi })));

  app.root.append(
    h('header.home-top', {}, mascotElement('home-olly'), h('p.home-hello', { text: greeting(app.settings.childName) }), noticeBell(app), parentButton(app)),
    h('div.zone-grid', {}, ...cards),
  );
  say(app, greeting(app.settings.childName));
}

// ---------- Khu chưa làm ----------

export function zoneSoonScreen(app, { zone: id } = {}) {
  const zone = ZONE_BY_ID.get(id) ?? ZONES[0];
  app.root.className = `child-screen zone-soon zone-${zone.color}`;
  app.root.append(
    h('header.child-top', {}, homeButton(app)),
    h('div.soon-body', {}, mascotElement('soon-olly'),
      h('p.soon-title', { text: `${zone.emoji} ${zone.en}` }),
      h('p.soon-text', { text: 'Coming soon!' }),
      h('p.soon-vi', { text: `Khu "${zone.vi}" đang được làm.` })),
  );
  say(app, `${zone.intro} Coming soon!`);
}

// ---------- Hết giờ: Olly đi ngủ ----------

export function sleepScreen(app) {
  app.root.className = 'child-screen sleep';
  const moon = holdButton({
    label: '🌙',
    title: 'Bố mẹ nhấn giữ 3 giây để cho học thêm 15 phút',
    ms: PARENT_HOLD_MS,
    className: 'parent-hold',
    onHold: () => {
      app.extendTime();
      app.go('home');
    },
    onShortTap: () => toast('Bố mẹ nhấn giữ 🌙 3 giây để cho học thêm 15 phút.', 3500),
  });
  app.root.append(
    h('div.sleep-body', {}, mascotElement('sleep-olly'), h('p.sleep-text', { text: 'Time to rest. See you tomorrow!' })),
    h('div.parent-entry', {}, moon, h('span.parent-caption', { text: 'Bố mẹ (giữ 3 giây)' })),
  );
  say(app, 'Great job today! Time to rest. See you tomorrow!');
}

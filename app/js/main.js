// Khởi động app: mở dữ liệu, giọng đọc, đăng ký màn hình, service worker.

import { App } from './app.js';
import { openDatabase } from './db.js';
import { loadSettings } from './settings.js';
import { startScreen, homeScreen, sleepScreen } from './screens/child.js';
import { readScreen, spellScreen, talkScreen, lessonScreen } from './screens/read.js';
import { sceneScreen } from './screens/scene.js';
import { mathScreen, mathLessonScreen } from './screens/math.js';
import { parentScreen } from './screens/parent/index.js';
import { startNotices } from './notices.js';
import { migrateLessonPictures } from './picture-library.js';

async function registerServiceWorker(app) {
  if (!('serviceWorker' in navigator) || new URLSearchParams(location.search).has('nosw')) return;
  try {
    // Lần đầu cài, service worker nhận quyền điều khiển trang: không cần tải lại. Chỉ tải lại khi một bản mới thay bản cũ.
    const hadController = Boolean(navigator.serviceWorker.controller);
    const reg = await navigator.serviceWorker.register('sw.js');
    app.swRegistration = reg;
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading || !hadController) return;
      reloading = true;
      location.reload();
    });
    if (reg.waiting && navigator.serviceWorker.controller) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
  } catch (err) {
    console.warn('Không đăng ký được service worker', err);
  }
}

function fatal(message) {
  const root = document.getElementById('app');
  root.replaceChildren();
  const p = document.createElement('p');
  p.className = 'fatal';
  p.textContent = message;
  root.append(p);
}

async function boot() {
  const app = new App(document.getElementById('app'));
  window.kidEnglish6 = app; // để soi lỗi qua Safari Web Inspector / test

  try {
    app.db = await openDatabase();
  } catch (err) {
    console.error(err);
    fatal('Không mở được bộ nhớ của app. Nếu đang dùng chế độ Duyệt web riêng tư, hãy tắt đi rồi mở lại.');
    return;
  }
  app.settings = await loadSettings(app.db);
  await migrateLessonPictures(app.db).catch((err) => console.warn(err)); // ảnh theo bài (0.3.3) → Kho ảnh dùng chung
  if (app.settings.firstUseAt == null) await app.setSetting('firstUseAt', Date.now());

  navigator.storage?.persist?.().catch(() => {});
  await app.speaker.init({ voiceURI: app.settings.voiceURI, voiceURI2: app.settings.voiceURI2, rate: app.settings.rate });
  app.recognizer.setAllowed(app.settings.useRecognition);
  app.startSessionClock();

  app.register('start', startScreen);
  app.register('home', homeScreen);
  app.register('read', readScreen);
  app.register('spell', spellScreen);
  app.register('talk', talkScreen);
  app.register('lesson', lessonScreen);
  app.register('scene', sceneScreen);
  app.register('math', mathScreen);
  app.register('math-lesson', mathLessonScreen);
  app.register('sleep', sleepScreen);
  app.register('parent', parentScreen);

  app.go('start');
  registerServiceWorker(app);
  startNotices(app);
}

boot();

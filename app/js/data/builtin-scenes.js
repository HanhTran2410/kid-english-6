// Tranh có sẵn cho Tả tranh (SPEC-ta-tranh mục 8.4): tranh tự vẽ (SVG + emoji), câu tự viết — không lấy của video mẫu.
// Tọa độ `point` = ĐẦU mũi tên, tỉ lệ 0–1 theo khung 800 × 600 (4:3); đặt ở CẠNH đối tượng, phía `from` (thân mũi tên
// nằm phía đó, không đè lên hình). `at` = TÂM đối tượng (tâm emoji trong SVG): vùng chạm và vòng sáng bao quanh đối tượng,
// không quanh đầu mũi tên. `hit` = bán kính vùng chạm (tỉ lệ cạnh ngắn).

const PARK_SVG = `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="In the park">
  <rect width="800" height="600" fill="#bfe6ff"/>
  <ellipse cx="150" cy="70" rx="70" ry="26" fill="#fff"/><ellipse cx="200" cy="60" rx="50" ry="22" fill="#fff"/>
  <ellipse cx="360" cy="52" rx="56" ry="20" fill="#fff"/>
  <g stroke="#fab005" stroke-width="6" stroke-linecap="round">
    <line x1="700" y1="20" x2="700" y2="34"/><line x1="700" y1="146" x2="700" y2="160"/><line x1="630" y1="90" x2="644" y2="90"/>
    <line x1="756" y1="90" x2="770" y2="90"/><line x1="651" y1="41" x2="661" y2="51"/><line x1="739" y1="129" x2="749" y2="139"/>
    <line x1="749" y1="41" x2="739" y2="51"/><line x1="661" y1="129" x2="651" y2="139"/>
  </g>
  <circle cx="700" cy="90" r="46" fill="#ffd43b"/>
  <rect y="300" width="800" height="300" fill="#8ce99a"/>
  <path d="M0 300 Q200 270 400 300 T800 300 V330 H0 Z" fill="#69db7c"/>
  <path d="M250 600 Q330 470 470 440 T800 420 V470 Q560 470 470 520 T380 600 Z" fill="#f1e3c6"/>
  <ellipse cx="640" cy="505" rx="120" ry="55" fill="#74c0fc"/>
  <ellipse cx="640" cy="505" rx="96" ry="40" fill="#a5d8ff"/>
  <rect x="95" y="200" width="30" height="150" rx="8" fill="#8d5524"/>
  <circle cx="110" cy="185" r="70" fill="#51cf66"/><circle cx="62" cy="228" r="48" fill="#40c057"/><circle cx="158" cy="228" r="48" fill="#40c057"/>
  <line x1="399" y1="331" x2="458" y2="168" stroke="#495057" stroke-width="2"/>
  <!-- Cậu bé thả diều: vẽ cả người (emoji 🧒 chỉ có cái đầu); tay phải giơ cao cầm dây diều. -->
  <g class="scene-boy" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M346 438 V466 M366 438 V466" stroke="#2b2b2b" stroke-width="14" fill="none"/>
    <path d="M346 438 V466 M366 438 V466" stroke="#f9c89b" stroke-width="8" fill="none"/>
    <ellipse cx="344" cy="470" rx="12" ry="6" fill="#e8590c"/><ellipse cx="368" cy="470" rx="12" ry="6" fill="#e8590c"/>
    <path d="M335 414 H377 L379 444 H359 L356 432 L353 444 H333 Z" fill="#4dabf7"/>
    <path d="M338 376 q18 -8 36 0 l4 42 H334 Z" fill="#ffd43b"/>
    <path d="M338 380 L324 414" stroke="#2b2b2b" stroke-width="14" fill="none"/><path d="M338 380 L324 414" stroke="#f9c89b" stroke-width="8" fill="none"/>
    <path d="M374 380 L398 334" stroke="#2b2b2b" stroke-width="14" fill="none"/><path d="M374 380 L398 334" stroke="#f9c89b" stroke-width="8" fill="none"/>
    <circle cx="323" cy="417" r="6" fill="#f9c89b" stroke-width="3"/><circle cx="399" cy="331" r="6" fill="#f9c89b" stroke-width="3"/>
    <circle cx="356" cy="344" r="27" fill="#f9c89b"/>
    <path d="M330 340 q0 -30 26 -31 q27 1 27 31 q-6 -12 -14 -14 q-4 8 -13 6 q-9 -2 -12 -8 q-8 6 -14 16 Z" fill="#8d5524"/>
    <circle cx="347" cy="347" r="3.2" fill="#2b2b2b" stroke="none"/><circle cx="365" cy="347" r="3.2" fill="#2b2b2b" stroke="none"/>
    <path d="M347 357 q9 8 18 0" fill="none" stroke-width="3"/>
    <circle cx="341" cy="355" r="4" fill="#ff8fab" stroke="none" opacity="0.7"/><circle cx="371" cy="355" r="4" fill="#ff8fab" stroke="none" opacity="0.7"/>
  </g>
  <g class="scene-emoji" text-anchor="middle" dominant-baseline="central">
    <text x="470" y="130" font-size="90">🪁</text>
    <text x="540" y="330" font-size="90">🚴‍♀️</text>
    <text x="190" y="480" font-size="80">🐕</text>
    <text x="600" y="495" font-size="56">🦆</text>
    <text x="676" y="505" font-size="56">🦆</text>
  </g>
</svg>`;

export const BUILTIN_SCENES = [
  {
    id: 'scene-park',
    title: 'In the park',
    titleVi: 'Ở công viên',
    track: 'phonics',
    level: 2,
    svg: PARK_SVG,
    builtIn: true,
    sentences: [
      { sid: 'p1', en: 'It is a sunny day in the park.', vi: 'Hôm nay trời nắng đẹp ở công viên.', point: null, from: 'auto', hit: 0.08 },
      { sid: 'p2', en: 'A boy is flying a kite.', vi: 'Một bạn trai đang thả diều.', point: { x: 0.39, y: 0.675 }, at: { x: 0.45, y: 0.655 }, from: 'left', hit: 0.12 },
      { sid: 'p3', en: 'The kite is in the sky.', vi: 'Con diều ở trên bầu trời.', point: { x: 0.64, y: 0.217 }, at: { x: 0.5875, y: 0.217 }, from: 'right', hit: 0.08 },
      { sid: 'p4', en: 'A girl is riding a bike.', vi: 'Một bạn gái đang đạp xe đạp.', point: { x: 0.731, y: 0.5 }, at: { x: 0.675, y: 0.55 }, from: 'top-right', hit: 0.09 },
      { sid: 'p5', en: 'A dog is on the grass.', vi: 'Một chú chó ở trên bãi cỏ.', point: { x: 0.29, y: 0.797 }, at: { x: 0.2375, y: 0.8 }, from: 'right', hit: 0.08 },
      { sid: 'p6', en: 'Two ducks are in the pond.', vi: 'Hai con vịt đang bơi trong ao.', point: { x: 0.75, y: 0.762 }, at: { x: 0.7975, y: 0.833 }, from: 'top', hit: 0.11 },
      { sid: 'p7', en: 'The sun is hot.', vi: 'Mặt trời nóng.', point: { x: 0.8125, y: 0.158 }, at: { x: 0.875, y: 0.15 }, from: 'left', hit: 0.1 },
    ],
  },
];

export const SCENE_BY_ID = new Map(BUILTIN_SCENES.map((s) => [s.id, s]));

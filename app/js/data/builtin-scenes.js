// Tranh có sẵn cho Tả tranh (SPEC-ta-tranh mục 8.4): tranh tự vẽ (SVG + emoji), câu tự viết — không lấy của video mẫu.
// Tọa độ `point` = ĐẦU mũi tên, tỉ lệ 0–1 theo khung 800 × 600 (4:3); đặt ở CẠNH đối tượng, phía `from` (thân mũi tên
// nằm phía đó, không đè lên hình). `hit` = bán kính vùng chạm (tỉ lệ cạnh ngắn).

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
  <line x1="392" y1="372" x2="458" y2="168" stroke="#495057" stroke-width="2"/>
  <g class="scene-emoji" text-anchor="middle" dominant-baseline="central">
    <text x="470" y="130" font-size="90">🪁</text>
    <text x="360" y="400" font-size="90">🧒</text>
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
      { sid: 'p2', en: 'A boy is flying a kite.', vi: 'Một bạn trai đang thả diều.', point: { x: 0.396, y: 0.675 }, from: 'left', hit: 0.08 },
      { sid: 'p3', en: 'The kite is in the sky.', vi: 'Con diều ở trên bầu trời.', point: { x: 0.64, y: 0.217 }, from: 'right', hit: 0.08 },
      { sid: 'p4', en: 'A girl is riding a bike.', vi: 'Một bạn gái đang đạp xe đạp.', point: { x: 0.731, y: 0.5 }, from: 'top-right', hit: 0.12 },
      { sid: 'p5', en: 'A dog is on the grass.', vi: 'Một chú chó ở trên bãi cỏ.', point: { x: 0.29, y: 0.797 }, from: 'right', hit: 0.08 },
      { sid: 'p6', en: 'Two ducks are in the pond.', vi: 'Hai con vịt đang bơi trong ao.', point: { x: 0.75, y: 0.762 }, from: 'top', hit: 0.12 },
      { sid: 'p7', en: 'The sun is hot.', vi: 'Mặt trời nóng.', point: { x: 0.8125, y: 0.158 }, from: 'left', hit: 0.12 },
    ],
  },
];

export const SCENE_BY_ID = new Map(BUILTIN_SCENES.map((s) => [s.id, s]));

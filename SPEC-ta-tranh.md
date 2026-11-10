# SPEC — 🖼️ Tả tranh (Picture Talk) — draft2.1

Chức năng mới của Olly English (bé **6 tuổi**, lớp 1 — xem SPEC.md mục 1), lấy ý tưởng từ một video mẫu trên mạng. App chỉ **lấy cách trình bày** của video; **không** dùng lại tranh hay câu của video trong bài mẫu, prompt mặc định hay bất kỳ nội dung phát hành nào (bản quyền, giống SPEC mục 5.1). Tranh và câu để nghiệm thu đều tự tạo mới.

**Draft2 sửa theo review draft1:** cấp độ câu (mục 2.2), quy tắc mũi tên và vùng chạm (mục 4), luồng âm thanh / hẹn giờ / tương tác (mục 5), karaoke (mục 5.4), tiếng Việt (mục 6), dữ liệu + kiểm tra dữ liệu (mục 7), quản lý tranh và tiến độ (mục 8–9), bố cục các cỡ màn (mục 3.2), offline (mục 10), danh sách test (mục 12).

## 1. Video mẫu làm gì (chỉ để phân tích)

Video dài 47 giây: một bức tranh công viên đứng yên, 8 câu tả lần lượt, mỗi câu 4–8 giây.
- Câu đầu tả chung cả tranh (trời đẹp, ở công viên) — **không có** mũi tên.
- 7 câu sau, mỗi câu tả **một** người / vật (bạn trai thả diều, bạn gái áo hồng chạy tới, bạn trai cạnh xe đạp, con diều mắc trên cây, quả bóng tennis, bạn gái ngồi ghế, máy tính bảng). Mũi tên đỏ **trượt tới** chỗ đó; hướng mũi tên đổi theo chỗ chỉ. Có hai câu liền nhau cùng nói về một bạn (câu sau dùng *he / she*).
- Thanh chữ dưới tranh, chữ to 1–2 dòng, **từ đang đọc đổi màu** (karaoke).
- Không có tiếng Việt — app **thêm** dòng dịch, bật / tắt được.

Câu trong video dài 8–15 từ, nhiều câu ghép (*…, but it gets stuck in a tree*) — quá khó cho bé mới học; app dùng câu ngắn hơn và chia cấp độ (mục 2.2).

## 2. Vị trí trong app và nội dung

### 2.1. Vị trí
- Thuộc khu **📖 Read / Tập đọc** (SPEC 3.1), là một kiểu bài cạnh "Đọc câu" và "Truyện ngắn" — không làm khu thứ 5. Chế độ "Bé tả" sau này nối sang khu Talk.
- Màn chọn bài của khu Read có thẻ **🖼️ Tả tranh** → danh sách tranh (ảnh nhỏ, tên, cấp độ, số câu, sao).
- Có ở cả hai mạch: tranh theo Unit sách lớp 1 (bố mẹ tạo) và tranh có sẵn.

### 2.2. Cấp độ câu
Mỗi tranh có một `level`. Cấp độ áp cho **mọi câu** trong tranh; từ vựng theo cấp độ / Unit đang học, không theo "tuổi" chung chung.

| Cấp | Độ dài câu | Ngữ pháp được dùng | Ví dụ |
|---|---|---|---|
| 1 — Dễ | 3–6 từ | *This is…, It is…, a/the + màu + danh từ, is + V-ing* | *A boy is flying a kite.* · *The kite is red.* |
| 2 — Vừa | 4–9 từ | thêm giới từ vị trí (*in, on, next to, near, under*), quần áo + màu | *The kite is in the tree.* · *A girl in a pink T-shirt is running.* |
| 3 — Khó | 6–12 từ | thêm *and / but*, đại từ *he / she / it / they* | *The boy is pointing at the kite in the tree.* |

- Câu đầu (tả chung) luôn ≤ 7 từ, ở mọi cấp.
- Số câu: cấp 1: 4–6 câu; cấp 2–3: 5–8 câu.
- Đại từ (*he, she, it, they*) chỉ dùng ở cấp 3, và chỉ khi câu **ngay trước** đã nói về đúng người / vật đó.

## 3. Màn Tả tranh — chế độ Nghe xem (làm trước)

### 3.1. Bố cục

```
┌─────────────────────────────────────────────┐
│ ←  Ở công viên            🇻🇳 VI   ⏸   2/6 │  thanh trên
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │          TRANH (luôn 4:3)        ◀━━━   │ │  mũi tên đỏ
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │   A boy is flying a kite.               │ │  dòng tiếng Anh, từ đang đọc sáng màu
│ │   Một bạn trai đang thả diều.           │ │  dòng tiếng Việt (ẩn / hiện)
│ └─────────────────────────────────────────┘ │
│        ⏮        🔁         ⏭                │
└─────────────────────────────────────────────┘
```

- Chữ tiếng Anh: Nunito 800, cỡ cơ bản 28px (iPad) / 22px (điện thoại). Tiếng Việt: ~70% cỡ tiếng Anh, màu khác, in nghiêng. Chữ **không bao giờ đè lên tranh**.

### 3.2. Các cỡ màn
- **Khung tranh luôn đúng 4:3** (`aspect-ratio: 4/3`), co giãn trong chỗ trống: rộng = min(rộng khả dụng, cao khả dụng × 4/3). Ảnh lấp kín khung, không có viền đen / khoảng trắng — nên tọa độ mũi tên và vùng chạm tính theo đúng khung ảnh (mục 4.1).
- iPad ngang / dọc, điện thoại dọc: tranh trên, thanh chữ dưới, nút cuối cùng.
- Điện thoại ngang (chiều cao < 500px): tranh bên trái, thanh chữ + nút bên phải.
- **Chiều cao thanh chữ** của một tranh = chiều cao câu dài nhất của tranh đó (tiếng Anh + tiếng Việt) ở bề rộng hiện tại, tính lại khi mở tranh và khi xoay / đổi cỡ màn. Nhờ vậy thanh chữ không nhảy giữa các câu và khi bật / tắt VI. Giới hạn trên: 40% chiều cao màn; câu vẫn không vừa thì thu nhỏ chữ (thấp nhất 75% cỡ cơ bản), vẫn không vừa thì cho cuộn trong thanh chữ.

### 3.3. Một câu chạy thế nào
1. **Mũi tên tới nơi** (~400 ms, mục 4.3). Câu không có điểm chỉ → mũi tên mờ dần và **ẩn hẳn**.
2. Chờ 300 ms để bé nhìn theo mũi tên.
3. **Olly đọc câu tiếng Anh** (giọng chính, tốc độ trong Cài đặt), từ sáng theo nhịp đọc (mục 5.4).
4. Nếu bật *Đọc tiếng Việt*: đọc tiếp câu tiếng Việt (giọng vi-VN; máy không có giọng Việt thì bỏ qua bước này).
5. **Nghỉ 1,2 giây tính từ lúc đọc xong toàn bộ âm thanh của câu** (bước 3, và bước 4 nếu có), rồi sang câu sau.
6. Hết câu cuối: Olly khen, hiện **Nghe lại từ đầu** / **Tìm trong tranh** (khi đã có chế độ này) / **Về**.

## 4. Mũi tên và vùng chạm

### 4.1. Tọa độ
- `point = {x, y}`: vị trí **đầu nhọn** mũi tên, tỉ lệ 0–1 theo **khung ảnh 4:3** (0,0 = góc trên trái ảnh; 1,1 = góc dưới phải ảnh). Đổi ra pixel: `px = rectẢnh.left + x × rectẢnh.width` (tương tự cho y). Không tính phần ngoài ảnh.
- Đặt điểm ở **cạnh** người / vật (thân, tay, mép đồ vật), không đặt giữa mặt người — vì thân mũi tên nằm ở phía mũi tên đi vào, đầu nhọn chạm đúng điểm. Màn đặt mũi tên và prompt AI đều ghi rõ điều này.

### 4.2. Hình và hướng mũi tên
- `from` là phía thân mũi tên nằm (mũi tên đi **từ** phía đó **vào** điểm). Danh sách đầy đủ:
  `'auto' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'`.
- Chiều dài mong muốn L = 18% cạnh ngắn của ảnh (tối thiểu 48px). Đầu mũi tên rộng ~ 0,35 L.
- Mũi tên **luôn nằm trọn trong ảnh**: nếu phía `from` không đủ chỗ cho L thì thu ngắn thân, nhưng không ngắn hơn 0,5 L; vẫn không đủ thì đổi sang hướng `auto`.
- `auto`: thử 8 hướng theo thứ tự ưu tiên `right, left, top-right, top-left, bottom-right, bottom-left, top, bottom`, lấy hướng **đầu tiên** đủ chỗ cho L; không hướng nào đủ thì lấy hướng có nhiều chỗ nhất.
- Màu: đỏ đậm có viền trắng 3px và bóng mờ — nhìn rõ trên cả nền sáng lẫn nền tối.

### 4.3. Chuyển động
- Từ câu có điểm sang câu có điểm: mũi tên **trượt** từ vị trí cũ tới vị trí mới (400 ms, ease-out), hơi mờ khi đang trượt, rõ hẳn khi tới nơi.
- Từ câu không có điểm sang câu có điểm: mũi tên hiện ra ngay ở hướng `from` của điểm mới và trượt vào 400 ms.
- Tới nơi: **nhún 1 lần** biên độ nhỏ (6px theo hướng mũi tên) + vòng sáng mờ quanh đầu mũi tên, bán kính ≤ 4% cạnh ngắn, tắt sau 600 ms.
- Đang trượt mà chuyển câu tiếp (bé bấm ⏭ liên tục): mũi tên đổi đích **từ vị trí đang đứng**, không nhảy về chỗ cũ.
- Máy bật "giảm chuyển động" (`prefers-reduced-motion`): không trượt, không nhún — mũi tên hiện thẳng ở chỗ mới.

### 4.4. Vùng chạm (`hit`)
- `hit`: bán kính vùng chạm quanh `point`, tính theo tỉ lệ **cạnh ngắn của ảnh** (ảnh hiển thị cạnh ngắn 600px, `hit = 0.08` → bán kính 48px). Mặc định 0,08; giới hạn 0,04–0,2; bán kính thực tế không nhỏ hơn 24px (vùng chạm ≥ 48px cho ngón tay bé).
- Câu có `point: null` thì không có vùng chạm (`hit` bị bỏ qua).
- **Chạm rơi vào nhiều vùng** (chồng nhau, hoặc nhiều câu cùng chỉ một vật): chọn câu có `khoảng cách / bán kính` nhỏ nhất. Bằng nhau (chênh < 0,05) → ưu tiên **câu đang hiện**; không có thì câu **đứng trước** trong bài. Không bao giờ chọn ngẫu nhiên.
- Chạm ngoài mọi vùng: không làm gì (không chuyển câu, không dừng đọc).

## 5. Âm thanh, hẹn giờ và tương tác

### 5.1. Nguyên tắc
- Tại mỗi lúc chỉ có **một** luồng chạy (đọc câu / đọc từ / nghỉ / chờ). Bắt đầu luồng mới thì **hủy** luồng cũ: dừng giọng đọc (`speechSynthesis.cancel`), hủy mọi hẹn giờ và chờ (dùng `AbortSignal` như `timing.js`). Nhờ vậy bấm ⏭ liên tục chỉ đọc câu cuối cùng được chọn.
- Không dùng `speechSynthesis.pause()` (iOS không ổn định): **Dừng** luôn là hủy, **Chạy** luôn là đọc lại từ đầu câu.

### 5.2. Bảng xử lý thao tác

| Thao tác | Xử lý |
|---|---|
| ⏭ / ⏮ | Hủy luồng cũ, chuyển câu, mũi tên tới nơi rồi đọc ngay (không chờ 1,2 giây). Câu đầu bấm ⏮ / câu cuối bấm ⏭: không làm gì |
| 🔁 hoặc chạm thanh chữ (ngoài các từ) | Hủy luồng cũ, đọc lại câu hiện tại từ đầu, sau đó chạy tiếp bình thường |
| Chạm một từ | Hủy luồng cũ, đọc riêng từ đó (tốc độ × 0,8), từ nháy màu. Sau đó vào **chờ**: 3 giây không chạm gì thì — nếu câu đang đọc dở → đọc lại câu từ đầu rồi chạy tiếp; nếu câu đã đọc xong → sang câu sau. Chạm thêm từ khác thì đếm lại 3 giây. Trong lúc đọc từ và chờ, **không tự chuyển câu** |
| Chạm tranh trúng vùng của một câu (mục 4.4) | Hủy luồng cũ, chuyển tới câu đó (mũi tên trượt tới), đọc, rồi chạy tiếp từ câu đó |
| Chạm tranh ngoài mọi vùng | Không làm gì |
| ⏸ | Hủy giọng đọc và hẹn giờ; mũi tên **nhảy ngay về vị trí cuối** của câu hiện tại (không đóng băng giữa chừng); nút đổi thành ▶ |
| ▶ (sau ⏸, hoặc sau khi app quay lại) | Đọc lại câu hiện tại từ đầu, rồi chạy tiếp |
| 🇻🇳 VI | Chỉ ẩn / hiện dòng tiếng Việt; **không** ngắt âm thanh đang đọc (kể cả đang đọc tiếng Việt) |
| ← Về | Hủy mọi luồng, về danh sách tranh |

### 5.3. Ra nền, xoay màn
| Tình huống | Xử lý |
|---|---|
| App ra nền / tắt màn hình | Hủy giọng đọc và hẹn giờ, chuyển sang trạng thái **Dừng** |
| App quay lại | Giữ câu hiện tại, vẫn **Dừng**, nút ▶ to nhấp nháy nhẹ; không tự đọc |
| Xoay màn / đổi cỡ cửa sổ | Tính lại vị trí mũi tên và vùng chạm theo khung ảnh mới, tính lại chiều cao thanh chữ; **không** ngắt giọng đọc |

### 5.4. Karaoke (từ sáng theo nhịp đọc)
Máy không báo trước thời lượng câu, và sự kiện `boundary` (vị trí từ đang đọc) trên iOS không ổn định, nên ước lượng:
- **Trọng số mỗi từ** = số âm tiết ước lượng (đếm cụm nguyên âm, tối thiểu 1). Thêm khoảng nghỉ: dấu phẩy +1, dấu chấm / hỏi / than ở giữa câu +2.
- **Thời gian mỗi từ** = trọng số × `msPerUnit`, mỗi từ sáng tối thiểu 250 ms.
- `msPerUnit` ban đầu = 280 ms ÷ tốc độ đọc trong Cài đặt. Sau mỗi câu đọc trọn (không bị hủy), app đo thời lượng thật (từ `onstart` tới `onend`) chia cho tổng trọng số, rồi cập nhật `msPerUnit` (trung bình động 70% cũ / 30% mới) — các câu sau khớp dần với giọng của máy. Đổi tốc độ trong Cài đặt thì làm lại từ giá trị ban đầu.
- Bắt đầu tô từ khi `onstart`. Nếu ước lượng chạy **nhanh hơn** giọng đọc: từ cuối giữ sáng tới khi `onend`. Nếu **chậm hơn**: khi `onend` thì bỏ sáng ngay — không từ nào còn sáng sau khi đọc xong.
- Đọc tiếng Việt không tô từng từ; dòng tiếng Việt chỉ sáng nhẹ cả dòng khi đang đọc.
- Phần tính trọng số và thời gian là hàm thuần (dễ viết unit test), chép / sửa từ cách tính nhịp của kid-english.

## 6. Tiếng Việt
- Hai cài đặt **độc lập** (Góc bố mẹ → Cài đặt → 🖼️ Tả tranh):
  - **Hiện tiếng Việt** (`showVi` — dùng chung cho đọc câu, truyện, tả tranh; SPEC 6.1; mặc định **bật**).
  - **Đọc tiếng Việt thành tiếng** (`readVietnamese`, dùng chung; mặc định **tắt**).
  Đủ cả 4 tổ hợp: hiện + đọc, hiện + không đọc, ẩn + đọc, ẩn + không đọc.
- Nút **🇻🇳 VI** trên màn Tả tranh đổi **chính** `showVi` (cùng một giá trị với Cài đặt, không có bản sao riêng) → lần đổi sau cùng, dù ở Cài đặt hay ở nút, là giá trị dùng cho mọi tranh về sau. Nút VI không đổi `readVietnamese`.
- Lời tiếng Việt là **dịch nghĩa tự nhiên** cả câu, không dịch từng chữ.
- Khác với cài đặt "Giải thích tiếng Việt khi sai" (SPEC 4.1); hai cài đặt độc lập.

## 7. Dữ liệu

### 7.1. Lưu ở đâu
- IndexedDB `kid-english-6` hiện có. **Không** tạo database mới: thêm một bước vào mảng `MIGRATIONS` trong `db.js` (bước 2) tạo kho **`scenes`** (`keyPath: 'id'`). Bước này chỉ thêm kho, không đụng dữ liệu các kho cũ; nâng cấp lỗi thì IndexedDB tự hủy cả lần nâng cấp, dữ liệu cũ giữ nguyên.
- Ảnh tranh lưu trong kho `images` sẵn có (dạng ArrayBuffer + mimeType như các ảnh khác), trường `lessonId` = id của tranh. **Mỗi ảnh thuộc đúng một tranh** (không dùng chung), nên xóa tranh thì xóa luôn ảnh của nó.

### 7.2. Kiểu dữ liệu (bản ghi trong kho `scenes`)

```ts
type Direction = 'auto' | 'left' | 'right' | 'top' | 'bottom'
               | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface Scene {
  id: string;                 // app tự tạo, không trùng
  title: string;              // không rỗng
  track: 'phonics' | 'book';  // mạch nội dung (SPEC 5)
  unit: string | null;        // tên Unit nếu track = 'book'
  level: 1 | 2 | 3;           // mục 2.2
  imageId: string;            // ảnh trong kho images
  sentences: Sentence[];      // ít nhất 1 câu
  builtIn: boolean;           // tranh có sẵn: không sửa / xóa được
  createdAt: number;
  updatedAt: number;
}

interface Sentence {
  sid: string;                // id ngắn của câu, app tự tạo, không đổi khi đổi thứ tự (dùng làm khóa tiến độ)
  en: string;                 // bắt buộc
  vi: string;                 // bắt buộc (có thể rỗng nếu bố mẹ chưa viết; khi đó dòng VI để trống)
  point: { x: number; y: number } | null;
  from: Direction;            // mặc định 'auto'
  hit: number;                // 0.04–0.2, mặc định 0.08; bỏ qua khi point = null
  keywords: string[];         // từ nhấn khi đọc lại ở chế độ Tìm; có thể rỗng
}
```

### 7.3. JSON bố mẹ dán vào (từ AI)
AI **không** quản lý `id`, `sid`, `imageId`, `track`, `unit`, ngày giờ — app tự điền. JSON dán vào chỉ gồm:

```json
{
  "title": "Ở công viên",
  "level": 2,
  "sentences": [
    {
      "en": "It is a sunny day in the park.",
      "vi": "Hôm nay trời nắng đẹp ở công viên.",
      "point": null
    },
    {
      "en": "A boy is flying a kite.",
      "vi": "Một bạn trai đang thả diều.",
      "point": { "x": 0.31, "y": 0.18 },
      "from": "right",
      "keywords": ["boy", "kite"]
    },
    {
      "en": "The kite is in the tree.",
      "vi": "Con diều mắc trên cây.",
      "point": { "x": 0.52, "y": 0.1 },
      "keywords": ["kite", "tree"]
    }
  ]
}
```
*(Ví dụ minh họa định dạng; tranh mẫu thật của app có bộ câu riêng.)*

### 7.4. Kiểm tra khi dán / lưu
App chấp nhận JSON có bọc trong khối ```` ```json ```` (AI hay làm vậy) — bỏ phần bọc rồi mới đọc. Lỗi thì **từ chối lưu** và chỉ rõ câu số mấy, sai gì (bằng tiếng Việt):

| Trường | Quy tắc | Sai thì |
|---|---|---|
| (toàn bộ) | JSON hợp lệ, là object | Từ chối: "Không đọc được JSON" |
| `title` | chuỗi, không rỗng sau khi bỏ khoảng trắng | Từ chối |
| `level` | 1, 2 hoặc 3 | Thiếu → 2; sai giá trị → từ chối |
| `sentences` | mảng, 1–12 câu | Từ chối |
| `en` | chuỗi không rỗng, ≤ 20 từ | Từ chối |
| `vi` | chuỗi | Thiếu → để rỗng, cảnh báo (vẫn cho lưu) |
| `point` | `null` hoặc `{x, y}` với 0 ≤ x, y ≤ 1 | Ngoài 0–1 / sai dạng → từ chối |
| `from` | trong danh sách mục 4.2 | Thiếu → `auto`; sai → từ chối |
| `hit` | số 0,04–0,2 | Thiếu → 0,08; ngoài khoảng → kẹp về 0,04 / 0,2, cảnh báo |
| `hit` khi `point: null` | — | Bỏ qua, không báo lỗi |
| `keywords` | mảng chuỗi | Thiếu → `[]`; sai dạng → từ chối |
| Trường lạ | — | Bỏ qua |

Cảnh báo thêm (không chặn lưu): câu dài hơn mức của `level` (mục 2.2); câu dùng *he / she / it / they* ở cấp 1–2; không câu nào có `point` (chế độ Tìm sẽ không chơi được).

## 8. Tạo và quản lý tranh (Góc bố mẹ → Quản lý bài → Tả tranh)

### 8.1. Soạn tranh
1. Chọn / chụp ảnh → app cắt về 4:3, tối đa 1200px (`resizeCover` trong `image.js`).
2. Chọn tên, mạch, Unit, cấp độ.
3. Danh sách câu: **thêm** (cuối hoặc chèn giữa), **sửa** tiếng Anh / tiếng Việt, **nhân bản**, **xóa**, **kéo đổi thứ tự**, ▶ **nghe thử** từng câu.
4. **Đặt mũi tên** cho từng câu: chạm vào tranh → mũi tên hiện ngay ở đó; kéo để chỉnh; nút **Không chỉ** (câu tả chung); nút đổi hướng (`auto` + 8 hướng); thanh trượt cỡ vùng chạm (vùng chạm hiện thành vòng tròn mờ khi đang sửa).
5. **Xem trước** cả bài như bé thấy, trước khi lưu.
6. Xóa câu đã có tiến độ học → hỏi lại: "Câu này bé đã học, xóa sẽ mất kết quả của câu. Xóa?"

### 8.2. Ảnh
- **Thay ảnh**: giữ câu và tọa độ, nhưng mọi câu có điểm chỉ bị đánh dấu "cần kiểm tra"; app mở thẳng màn Đặt mũi tên, phải bấm xác nhận từng câu (hoặc "Giữ nguyên tất cả") mới lưu được.
- **Ảnh bị mất / hỏng** (không đọc được trong kho): danh sách tranh hiện dấu ⚠️; bé mở tranh đó thì thấy khung xám "Tranh này đang bị lỗi — nhờ bố mẹ sửa nhé" và nút Về, không đọc gì. Góc bố mẹ cho chọn lại ảnh.
- Xóa tranh → xóa ảnh của tranh (mỗi ảnh chỉ thuộc một tranh, mục 7.1) và tiến độ của tranh.

### 8.3. Tạo bằng prompt AI
- App có sẵn prompt (nút **Chép prompt**); bố mẹ gửi tranh + prompt cho AI (ChatGPT / Claude / Gemini…), dán kết quả vào app → kiểm tra (mục 7.4) → mở màn Đặt mũi tên để bố mẹ **xác nhận từng điểm** (tọa độ AI đưa thường lệch) → lưu.
- Prompt yêu cầu AI:
  - Chỉ trả về **một JSON** đúng định dạng mục 7.3, không Markdown, không giải thích.
  - Đúng cấp độ được chọn (mục 2.2), dùng các từ của Unit nếu bố mẹ dán danh sách từ.
  - Câu đầu tả chung, `point: null`. Mỗi câu sau tả **một** người / vật chính nhìn thấy rõ, có `point`.
  - Chỉ tả những gì **có trong tranh và nhìn rõ**; không bịa người, vật, câu chuyện hay tình huống.
  - Đại từ chỉ dùng ở cấp 3 và khi câu ngay trước đã nói về đúng đối tượng đó.
  - `point` đặt ở cạnh / thân đối tượng, không giữa mặt người; đây chỉ là ước lượng.
  - `vi` dịch tự nhiên, kiểu bố mẹ nói với con.
- Tranh có thể do bố mẹ tạo bằng AI vẽ ảnh (prompt mẫu: "tranh hoạt hình, nhiều người đang làm các việc khác nhau ở công viên / lớp học / bãi biển, nét rõ, màu tươi, không có chữ").

### 8.4. Tranh có sẵn
- 3–5 tranh theo chủ đề quen thuộc (công viên, lớp học, nhà bếp, bãi biển, sinh nhật), đủ 3 cấp độ, tranh và câu tự tạo. Đi kèm app (service worker cache), `builtIn: true`, không sửa / xóa được.

## 9. Tiến độ và sao
- Khóa trong kho `progress`:
  - `lesson:<id>` (bài, SPEC 4.3) — `{ listened: số lần nghe hết bài, bestStars: 0–3, lastAt }`.
  - `<id>/find/<sid>` — kết quả từng câu ở chế độ Tìm, cùng dạng bản ghi mục của SPEC 4.3 (`seen, independent, helped, missed, streak, lastAt`); sao theo SPEC 4.4 nhưng dùng bảng sao riêng bên dưới.
- **Nghe xem**: nghe tới hết câu cuối thì `listened + 1`; không tính sao. Thoát giữa chừng không ghi.
- **Tìm trong tranh** (làm sau), sao theo lượt chơi:

  | Kết quả lượt chơi | Sao |
  |---|---|
  | Mọi câu đúng ngay lần chạm đầu | 3 |
  | Có câu phải chạm lại, nhưng tự tìm ra hết | 2 |
  | Có câu phải hiện đáp án | 1 |

  Lưu `bestStars` = cao nhất từ trước tới nay (chơi lại không làm giảm sao). Thoát giữa chừng: không tính sao, nhưng kết quả từng câu đã chơi vẫn ghi.
- Sửa **chữ** của một câu (`en`) → xóa tiến độ của câu đó (`<id>/find/<sid>`). Đổi thứ tự / sửa mũi tên / sửa `vi` → giữ tiến độ. Xóa câu → xóa tiến độ câu đó (đã hỏi lại ở 8.1). `bestStars` của tranh giữ nguyên.

## 10. Offline và giọng đọc
- **App** chạy offline sau lần mở đầu (service worker có các file mới + ảnh tranh có sẵn). Tranh bố mẹ tạo nằm trong IndexedDB nên cũng xem được offline.
- **Giọng đọc** là giọng của máy, không phải của app: iPad / iPhone giọng có sẵn trong máy, đọc được offline; một số máy Android / giọng "online" cần mạng. App không hứa giọng đọc chạy offline.
- Máy không có giọng tiếng Anh (hoặc giọng không phát được): màn Tả tranh vẫn hiện tranh, mũi tên, chữ; mỗi câu hiện đủ một khoảng thời gian ước lượng thay cho lúc đọc (karaoke vẫn chạy theo `msPerUnit` ban đầu); Góc bố mẹ hiện cảnh báo như phần giọng đọc sẵn có.
- Xóa dữ liệu trình duyệt / gỡ app → mất tranh bố mẹ tạo. Nhắc sao lưu (SPEC mục 6, `BACKUP_REMIND_DAYS`); khi làm sao lưu thì gồm cả kho `scenes` và ảnh.

## 11. Chế độ sau (cùng dữ liệu)
- **Tìm trong tranh**: Olly đọc câu, không có mũi tên; bé chạm vào tranh. Đúng (trúng vùng `hit` của câu đó) → mũi tên hiện chỉ đúng chỗ + khen. Sai → chỗ bé chạm rung nhẹ, Olly đọc lại câu, nhấn các `keywords`. Sai 2 lần liên tiếp → giải thích tiếng Việt một lần (SPEC 4.1, dùng `vi` của câu), rồi hiện mũi tên chỉ đáp án. Câu `point: null` bỏ qua. Tranh không có câu nào có `point` → nút Tìm bị mờ, bấm vào thì báo "Bố mẹ cần đặt mũi tên cho tranh này". Chỉ cần ≥ 1 câu có `point` là chơi được.
- **Bé đọc**: mũi tên chỉ, câu hiện, bé đọc to; từ nào app nghe được thì sáng xanh (như "Đọc câu", SPEC 3.1); ghi âm cho bố mẹ nghe lại.
- **Bé tả** (khu Talk): mũi tên chỉ, Olly hỏi (*"What is the girl doing?"*), bé trả lời câu ngắn; có câu gợi ý mờ nếu bé im lặng.

## 12. Kiểm tra

### 12.1. Unit (`npm test`)
- Vị trí / hướng / chiều dài mũi tên: mọi `from`, `auto` ở 4 góc và 4 mép tranh, thân luôn trong ảnh, thu ngắn rồi đổi hướng khi thiếu chỗ.
- Đổi tỉ lệ → pixel theo khung ảnh (có lệch trái / trên của khung).
- Chọn câu khi chạm: một vùng, vùng chồng nhau, hai câu cùng điểm, bằng nhau ưu tiên câu đang hiện / câu trước, ngoài vùng.
- Karaoke: trọng số theo âm tiết + dấu câu, tối thiểu 250 ms, cập nhật `msPerUnit`, đổi tốc độ thì đặt lại.
- Kiểm tra JSON (bảng 7.4): từng dòng của bảng có ít nhất một test.
- Migration: mở database phiên bản cũ có dữ liệu → nâng cấp → có kho `scenes`, dữ liệu cũ còn nguyên.

### 12.2. Giao diện (Playwright, `?fast`, giọng đọc giả)

| ID | Tình huống | Kết quả mong đợi |
|---|---|---|
| PT-01 | Mở tranh 1 câu có điểm | Đúng ảnh, câu, mũi tên; hết câu hiện màn kết thúc |
| PT-02 | Mở tranh 6 câu | Đọc đủ 6 câu đúng thứ tự, mỗi câu mũi tên đúng chỗ (lệch < 2% cạnh tranh) |
| PT-03 | Câu `point: null` (đứng đầu, và đứng giữa hai câu có điểm) | Không còn mũi tên nào trên tranh |
| PT-04 | Hai câu cùng chỉ một vật, chạm vào vật đó | Chọn theo quy tắc 4.4 |
| PT-05 | Hai vùng chồng nhau, chạm vùng giao | Chọn câu gần hơn; chạy 10 lần cùng kết quả |
| PT-06 | Chạm một từ khi đang đọc câu | Giọng đọc câu dừng, đọc từ; không chuyển câu; 3 giây sau đọc lại câu |
| PT-07 | Bấm ⏭ 4 lần liên tục | Chỉ câu cuối cùng được đọc |
| PT-08 | ⏸ khi đang đọc / khi mũi tên đang trượt | Giọng đọc và hẹn giờ dừng; mũi tên ở vị trí cuối của câu hiện tại |
| PT-09 | ▶ sau ⏸ | Đọc lại câu hiện tại từ đầu |
| PT-10 | App ra nền khi đang đọc | Giọng đọc dừng, hẹn giờ hủy |
| PT-11 | App quay lại | Vẫn Dừng, không tự đọc |
| PT-12 | Bật / tắt VI khi đang đọc tiếng Anh | Dòng VI hiện / ẩn, câu đọc tiếp không gián đoạn, thanh chữ không đổi chiều cao |
| PT-13 | Tắt VI khi đang đọc tiếng Việt (`readVietnamese` bật) | Dòng VI ẩn, giọng tiếng Việt vẫn đọc hết |
| PT-14 | Không có giọng tiếng Việt, `readVietnamese` bật | Bỏ qua đọc tiếng Việt, không lỗi, vẫn sang câu sau |
| PT-15 | Ảnh của tranh bị xóa khỏi kho | Màn "Tranh này đang bị lỗi", không đọc gì, không lỗi JS |
| PT-16 | Dán JSON có `x = 1.3` ở câu 2 | Từ chối, báo "Câu 2: vị trí mũi tên phải từ 0 đến 1" |
| PT-17 | Dán JSON câu 3 thiếu `en` | Từ chối, chỉ rõ câu 3 |
| PT-18 | Dán JSON `point: null` + `hit: 0.5` | Lưu được, không báo lỗi `hit` |
| PT-19 | Xoay màn khi đang đọc | Mũi tên và vùng chạm đúng chỗ ở khung mới; không ngắt đọc |
| PT-20 | Đổi tốc độ đọc 0,7 ↔ 1,1 | Mỗi từ vẫn được sáng, đúng thứ tự, không từ nào sáng sau khi đọc xong |
| PT-21 | Đổi VI bằng nút, mở Cài đặt | Cài đặt hiện đúng giá trị vừa đổi; đổi lại ở Cài đặt → tranh sau theo giá trị mới |
| PT-22 | Các cỡ: iPad ngang / dọc, điện thoại dọc / ngang; câu dài 3 dòng | Không cuộn ngang trang, chữ không đè tranh, tranh đúng 4:3 |
| PT-23 | Offline sau lần mở đầu | Tranh có sẵn và tranh đã tạo đều mở được |

## 13. Thứ tự làm (đề xuất)
Làm sau khi "Đọc câu" (0.4) xong, vì dùng chung phần karaoke và thanh chữ.

| Mốc | Phạm vi |
|---|---|
| 0.4.1 *(xong 2026-11-10)* | Nghe xem: mũi tên, karaoke, tiếng Việt, điều khiển âm thanh (mục 3–6), 1 tranh có sẵn ("In the park"), kho `scenes` |
| 0.4.2 | Soạn tranh tay: câu, mũi tên, ảnh, xem trước (mục 8.1–8.2) |
| 0.4.3 | Prompt AI, dán JSON, kiểm tra dữ liệu (mục 7.4, 8.3); đủ 3–5 tranh có sẵn |
| 0.4.4 | Tìm trong tranh, sao, tiến độ (mục 9, 11) |
| sau 0.4 | Bé đọc, Bé tả |

## 14. Đã chốt (2026-11-06)
| Nội dung | Quyết định |
|---|---|
| Vị trí | Trong khu Read |
| Tự chạy | Mặc định chạy liền; Cài đặt có "bé tự bấm ⏭" (`sceneAutoNext`); bé tương tác thì tạm ngừng tự chuyển (mục 5.2) |
| Nghỉ giữa câu | 1,2 giây sau khi đọc xong toàn bộ âm thanh của câu |
| Hiện tiếng Việt | Mặc định bật |
| Đọc tiếng Việt | Mặc định tắt |
| Phiên bản | 0.4.1–0.4.4 như mục 13 |

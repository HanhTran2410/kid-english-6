# SPEC — 📚 Truyện ngắn (Story) — draft2

Chi tiết cho SPEC.md mục 3.1.6. Bé **6 tuổi**, lớp 1 (SPEC.md mục 1). Truyện là bước sau "Đọc câu" (3.1.5): Phonics (nhận biết, ghép âm) → Đọc câu (từng câu rời) → **Truyện ngắn** (nhiều câu nối thành chuyện, hiểu nội dung và trình tự).

**Nguyên tắc:** dùng lại tối đa phần đã có — thanh chữ karaoke + điều khiển âm thanh của Tả tranh (SPEC-ta-tranh 3–6, luồng hủy `newRun` trong `screens/scene.js`), bé đọc câu của Đọc câu (`readSentences`, 3.1.5), kiểm tra đọc được của Quest (`learnedPhonics` / `canRead`, SPEC-quest 2.3), bộ cắt ảnh lưới (`image.js`, 5.6), khung chấm sai 1 / sai 2 (SPEC 4.1), gói chia sẻ (6.4). Phần mới chủ yếu là **lật trang**, **câu hỏi cuối truyện** và **ảnh cùng nhân vật cho cả truyện**.

**Draft2 sửa theo review draft1 (2026-11-19):** ví dụ nhóm 3 ghi rõ danh sách tricky cộng dồn + kiểm bằng hàm của app (3.2, 9); thuật toán chuẩn hóa / phân loại từ (3.2); state machine + quy tắc hủy đọc / hẹn giờ (4.4); bậc độ khó giữa các nhóm (3.1); chiều cao thanh chữ theo trang (4.1); nghe / tự đọc / bỏ qua (1, 5); schema riêng từng kiểu câu hỏi + nguyên tắc soạn (6.1); chấm `order` (6.2); kiểu dữ liệu tiến độ (7.1); sửa / thay truyện, dọn ảnh, trùng id (7.2, 8.3, 8.5); prompt ảnh + xem trước khi cắt + thiếu ảnh (8.4); test ST-15 → ST-32 (11); đổi thứ tự làm (12); 5 câu hỏi của draft1 đã chốt (13).

## 1. Bé làm gì trong một truyện

```
📚 chọn truyện → ① Nghe truyện (Olly đọc, lật trang)
               → ② Bé đọc (tùy chọn, từng trang)
               → ③ Câu hỏi (3 câu) → sao
```

- **Mở truyện luôn vào ① Nghe truyện** (đã chốt: nghe trước, tự đọc sau). Ở thanh trên có nút **📖 Con tự đọc** — bé vào ② lúc nào cũng được, **không bắt buộc** phải nghe hết trước.
- **① Nghe truyện** không chấm. Nghe hết trang cuối → màn cuối truyện có 3 nút: **❓ Trả lời câu hỏi** (sáng, nhún), **📖 Con tự đọc**, **🔁 Nghe lại**. Không tự chuyển sang câu hỏi — bé chọn.
- **② Bé đọc** không chấm, không bắt buộc, bỏ qua được (mục 5). Xong ② → sang ③.
- **③ Câu hỏi** là phần duy nhất có chấm → sao. Bé **không** phải trả lời bằng lời (SPEC 3.1.6). Vào ③ được từ màn cuối truyện hoặc cuối ②; chưa nghe hết truyện thì vẫn vào được qua nút ❓ ở màn cuối của ② (không chặn).

## 2. Vị trí trong app
- Khu **📖 Read** có thêm tab **📚 Truyện** (cạnh 🔤 Phonics · 📘 Theo sách · 🖼️ Tả tranh).
- Danh sách: thẻ truyện = ảnh trang 1 (hoặc emoji bìa) + tên + nhãn (`Nhóm 3` / `Unit 4`) + số trang + sao. Xếp: truyện Phonics theo nhóm âm, rồi truyện Theo sách theo Unit; ⭐ "Tiếp theo" ở truyện đầu tiên chưa có sao **mà bé đọc được ≥ 90% từ** (mục 3.2).
- **Không khóa truyện** (SPEC 3.1.2). Truyện bé đọc được < 70% từ vẫn mở; thẻ có dòng nhạt *"Nhiều từ mới — nghe trước nhé"* (giọng gợi ý, giống thẻ T10 của Toán).
- **Cuối bài Unit** (bài Theo sách có truyện gắn `lessonId`): sau màn sao, thêm thẻ *"📚 Có truyện của Unit này — nghe nhé?"* với hai nút **Nghe truyện** / **Để sau**. **Không tự mở** truyện. Hiện tối đa một lần mỗi lượt học bài đó.

## 3. Nội dung truyện

### 3.1. Độ dài, câu và bậc độ khó
| | Mặc định | Giới hạn |
|---|---|---|
| Số trang | 5 | 4–6 |
| Câu mỗi trang | 1–2 | ≤ 2 |
| Câu hỏi cuối truyện | 3 | 3 (thiếu ảnh trang → 2, mục 6.1) |

Độ khó **tăng theo nhóm âm** của truyện (truyện Theo sách dùng bậc theo nhóm âm bé đã học lúc tạo truyện). Truyện nhóm sau phải khác nhóm trước ở cả **câu** và **chuyện**, không chỉ ở từ vựng:

| Bậc | Nhóm | Từ / câu | Câu | Đại từ | Từ mới (chưa đọc được) | Chuyện |
|---|---|---|---|---|---|---|
| A | 1–2 | 3–5 | câu đơn rất ngắn, một mẫu lặp lại (*Sam has a…*, *It is…*) | không *he / she / they* (*it* được) | 0 | một chuỗi việc đơn giản |
| B | 3–4 | 3–6 | câu đơn đa dạng, có giới từ *on / in* | *he / she / it* | 0 | có một chuyện xảy ra (mất đồ, gặp bạn) + kết thúc |
| C | 5–7 | 4–7 (≤ 9, câu > 6 từ có `chunks` như 3.1.5) | thêm *and*, câu cảm *!*, câu hỏi trong lời thoại | thêm *they* | truyện có sẵn: 0; bố mẹ tạo: ≤ 10% | có vấn đề → cách giải quyết |

- Có **một nhân vật chính** có tên ngắn, đọc được ở nhóm của truyện (*Sam, Tom, Pip, Meg…*); có mở đầu – chuyện xảy ra – kết thúc vui.
- Thì hiện tại đơn / tiếp diễn. Đại từ chỉ khi câu **ngay trước** đã nói về đúng người / vật đó (giống Tả tranh cấp 3).
- Test kiểm bậc của truyện có sẵn: số từ / câu theo bảng, không đại từ ở bậc A, không *they* trước bậc C.

### 3.2. Phân loại từ (bé đọc được bao nhiêu)
**Một hàm duy nhất** `classifyWord(word, lp)` trong `js/story/words.js`, dùng `learnedPhonics(completedGroups)` và `NOT_PHONETIC` của Quest (`js/quest/content.js`), `NOT_DECODABLE` của bảng câu đố (`js/quest/riddles.js` — từ tách được theo chữ nhưng đọc sai âm: *old, ball, like, have…*) và `TRICKY_BY_GROUP` / `SIGHT_BY_GROUP` của app — **Story không có danh sách tricky riêng**; gặp từ mới kiểu này thì thêm vào `NOT_DECODABLE` (dùng chung với Quest). Truyện có sẵn, màn chơi, Góc bố mẹ, prompt AI và test đều gọi hàm này.

**Chuẩn hóa** (cho từng lần xuất hiện của từ):
1. Tách câu theo khoảng trắng; từ có gạch nối (*ice-cream*) tách thành hai phần, mỗi phần phân loại riêng.
2. Bỏ dấu câu ở hai đầu (`normalizeWord` của `text.js`): `hat,` → `hat`, `dog!` → `dog`, `"Look` → `look`.
3. Chữ thường: `The` = `the`, `I` = `i`.
4. Đuôi sở hữu `'s` / `s'`: bỏ đuôi rồi phân loại phần gốc (*Sam's* → *Sam*). Truyện Phonics có sẵn **không dùng** sở hữu cách và từ rút gọn (*it's, don't*).
5. Số nhiều / chia động từ (*cats, gets, runs*): **không** bỏ đuôi — phân loại nguyên từ (đuôi *s* là grapheme *s* bé đã học; *s* đọc /z/ như *is, has* giống bảng QUEST-RIDDLES).

**Thứ tự phân loại** (dừng ở bước đầu tiên khớp):

| Bước | Điều kiện | Loại | Hiển thị |
|---|---|---|---|
| 1 | từ thuộc tricky / từ nhận diện **đã học** (`lp.tricky`: `TRICKY_BY_GROUP` + `SIGHT_BY_GROUP` của các nhóm đã xong) | `tricky` | **gạch chân** (SPEC 5.3) |
| 2 | từ thuộc `NOT_PHONETIC` (tricky chưa học, *what, of, two…*) hoặc `NOT_DECODABLE` (*old, ball, like…*) | `new` | chữ nhạt khác màu |
| 2b | cách viết **chưa dạy** ở nhóm 1–7 (`UNTAUGHT_SPELLING`): *ea ay ey oy ow ew aw au igh ir ur wh ph kn wr gh tch dge*, c mềm (*ce ci cy*), e câm cuối (*bike, cake* — split digraph học sau nhóm 7), y cuối đọc là nguyên âm (*happy*). Không có bước này, *eat* bị tách e-a-t, *cow* c-o-w và tính là đọc được | `new` | chữ nhạt khác màu |
| 3 | `canRead` đúng: tách theo **bảng grapheme đầy đủ** (ưu tiên grapheme dài: *see* = s-**ee**) và mọi grapheme đã học | `decodable` | chữ thường |
| 4 | còn lại | `new` | chữ nhạt khác màu |

- Tricky xét **trước** `canRead`: một từ có trong danh sách tricky thì luôn là tricky (gạch chân), kể cả khi tách được theo chữ (*he, we, be*) — bé học từ đó như từ nhận diện. Tricky **chưa học** không bao giờ là `decodable` (bước 2) — không đánh dấu đọc được chỉ vì các chữ cái đã học.
- **Tên riêng** phân loại như mọi từ (bước 3–4). Truyện có sẵn: tên phải `decodable`. Truyện bố mẹ tạo: tên không đọc được → `new`, chạm để nghe.
- Bé chạm từ `new` → Olly đọc từ; từ `decodable` → đọc từ (chạm giữ: ghép âm, mục 4.3).
- **Đếm:** tỉ lệ đọc được = (lần xuất hiện `decodable` + `tricky`) / mọi lần xuất hiện. Góc bố mẹ liệt kê **từ mới duy nhất** (mỗi từ một lần, kèm số lần gặp): *"Bé đọc được 34 / 40 từ (85%). Từ mới: wind (2), what (1)."*
- Phân loại tính **lúc mở truyện** theo nhóm bé đã học (học thêm nhóm → truyện tự "dễ" hơn).

### 3.3. Hai mạch (SPEC 5.3)
| | Phonics | Theo sách |
|---|---|---|
| Từ | chỉ từ `decodable` / `tricky` ở nhóm N | từ của Unit + từ đã học + từ chức năng (*the, is, a*) |
| Gắn với | `group` | `lessonId` của bài Unit |
| Ai soạn | có sẵn trong app (mục 9) | bố mẹ, bằng prompt AI (mục 8.4) |

## 4. ① Nghe truyện

### 4.1. Bố cục
```
┌─────────────────────────────────────────────┐
│ ←  The Red Hat     📖  🇻🇳 VI   ⏸    2 / 5  │  thanh trên (📖 = Con tự đọc)
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │          HÌNH TRANG (4:3)               │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │  Sam is sad. He sits on the log.        │ │  câu đang đọc đậm + karaoke, câu kia nhạt
│ │  Sam buồn. Bạn ấy ngồi trên khúc gỗ.    │ │  tiếng Việt (ẩn / hiện)
│ └─────────────────────────────────────────┘ │
│     ◀ Trang trước    🔁    Trang sau ▶     │
│              ● ● ○ ○ ○                      │  chấm trang
└─────────────────────────────────────────────┘
```
- Khung hình 4:3, các cỡ màn (điện thoại ngang: hình trái, chữ phải): **giống Tả tranh** (SPEC-ta-tranh 3.1–3.2).
- **Trang hai câu** hiện liền nhau như một đoạn (không xuống dòng riêng từng câu nếu vừa); câu đang đọc đậm + karaoke, câu kia nhạt 60%. Tiếng Việt cũng gộp thành một đoạn.
- **Chiều cao thanh chữ** = chiều cao **trang** cao nhất của truyện (cả hai câu EN + VI khi `showVi` bật) ở bề rộng hiện tại — không phải câu dài nhất. Tính lại khi mở truyện, xoay / đổi cỡ màn, bật / tắt VI. Nhờ vậy thanh chữ không nhảy giữa các trang.
- Không vừa thì theo thứ tự: (1) thu nhỏ chữ tới **75%** cỡ cơ bản (EN tối thiểu 20px iPad / 17px điện thoại); (2) thu khung hình (4:3 giữ nguyên tỉ lệ) tới **45%** chiều cao màn; (3) vẫn không vừa → thanh chữ cuộn bên trong, **màn không cuộn**. Mục tiêu soạn truyện: trang dài nhất ≤ 4 dòng EN + 4 dòng VI trên iPhone 375 × 667 (test ST-21, ST-14).
- Không có mũi tên.

### 4.2. Một trang chạy thế nào
1. Lật sang trang (trượt ngang ~300 ms; *giảm chuyển động* → đổi thẳng).
2. Olly đọc lần lượt từng câu của trang (karaoke, `karaoke.js`); bật *Đọc tiếng Việt* thì đọc câu tiếng Việt sau mỗi câu.
3. Đọc xong trang → nghỉ 1,2 giây → tự lật (cài đặt tự chạy dùng chung với Tả tranh, đổi nhãn thành "Tả tranh & Truyện tự chuyển"). Tắt tự chạy → bé bấm **Trang sau ▶**, nút nhún nhẹ sau 3 giây.
4. Hết trang cuối: Olly *"The end!"*, `listened + 1` (7.1) → màn cuối truyện (mục 1).

### 4.3. Thao tác
| Bé làm | Kết quả |
|---|---|
| Chạm một từ | Ngừng đọc câu, Olly đọc riêng từ đó (chạm giữ từ `decodable`: ô ghép âm của 3.1.5); xong + 3 giây không chạm gì → đọc lại **từ đầu câu đang đọc** (đang tạm dừng thì không đọc tiếp) |
| ◀ / ▶ | Ngừng mọi âm thanh, sang trang, đọc trang mới từ câu đầu |
| ⏸ | Dừng ngay; ▶ → đọc lại từ đầu câu đang đọc |
| 🔁 | Đọc lại trang này từ câu đầu |
| 🇻🇳 VI | Đổi `showVi` (dùng chung, SPEC-ta-tranh 6); chỉ ẩn / hiện chữ, **không ngắt** âm thanh; tính lại chiều cao thanh chữ |
| 📖 | Sang ② ở **trang đang xem** |
| Ra nền / xoay màn | Ra nền: dừng, giữ trang; quay lại: **đang dừng**, không tự đọc. Xoay: không ngắt (như SPEC-ta-tranh 5.3) |

### 4.4. Trạng thái và hủy đọc (bắt buộc)
```
            ▶ / mở trang            đọc xong trang
  PAUSED ───────────────► PLAYING ───────────────► PAGE_DONE ──1,2 s (tự chạy)──► PLAYING (trang sau)
    ▲  ⏸ / ra nền            │  chạm từ                 │ chạm từ
    └────────────────────────┤                          ▼
                             └──────────────► WORD ──3 s không chạm──► PLAYING (đầu câu đang đọc)
                                               │ (nếu trước đó PAUSED → về PAUSED, không đọc tiếp)
```
- Trạng thái: `PLAYING` (đang đọc một câu của trang), `WORD` (đọc riêng một từ), `PAGE_DONE` (đọc xong trang, đang chờ tự lật), `PAUSED`. Màn cuối truyện là `END`.
- **Một luồng duy nhất:** mọi thao tác (chạm từ, ◀ ▶, ⏸, 🔁, 📖, ra nền, rời màn) gọi `newRun()` — hủy `AbortController` của luồng cũ (dừng TTS, karaoke) **và** `clearTimeout` mọi hẹn giờ (tự lật, 3 giây sau chạm từ, nhún nút) — rồi mới bắt đầu việc mới. Giống `screens/scene.js`.
- Mỗi hẹn giờ khi chạy kiểm tra lại `run.signal.aborted` và trạng thái `PAUSED` trước khi làm gì — hẹn giờ cũ không bao giờ tự lật trang sau khi bé đã thao tác.
- **Ưu tiên:** ⏸ và chạm từ thắng tự chạy. Bấm ◀ ▶ liên tục → chỉ trang cuối cùng được đọc.
- `PAUSED` nhớ `pageIndex` + `sentenceIndex`; ▶ đọc lại từ đầu câu đó.

## 5. ② Bé đọc
- Mỗi trang: hình + câu (phân loại từ như 3.2), nút 🔊 nghe mẫu từng câu.
- **Đọc mẫu tự động:** đã nghe hết truyện trong lượt mở này (`listenedThisVisit`) → **không** đọc mẫu, bé tự đọc ngay. Chưa nghe hết (vào ② giữa chừng, hoặc mở lại truyện) → Olly đọc mẫu câu trước, rồi mới tới lượt bé.
- Bé bấm **🎤** rồi đọc từng câu (máy chỉ nghe sau khi bé bấm — trước đó bé bấm ⏭ được) → cách chấm như Đọc câu: từ nghe được xanh, chưa nghe được xám, Olly đọc lại từ xám rồi cả câu. Không mic → **✅ Con đọc xong**.
- **Ghi nhận theo từng câu** (`<storyId>/read/<sid>`, 7.1):
  - Bé đọc xong câu (có kết quả nghe, hoặc bấm ✅) → `practiced + 1`, cập nhật `bestLevel` (mức đọc SPEC 3.1.5: `word` nhận từ → `chunk` đọc cụm → `sentence` cả câu ≥ 80% từ nghe được → `fluent` cả câu một lần, không ngắt quá 2 giây; không mic thì không có mức).
  - **⏭ Bỏ qua** câu / trang → `skipped + 1`, **không** tăng `practiced`.
  - Không có cờ "đọc xong cả truyện" — Góc bố mẹ tính *"đã đọc 7 / 9 câu"* từ các bản ghi câu.
- Có ghi âm thì ghi như Talk / Đọc câu (1 bản / câu / ngày, SPEC 6.2).
- Trang cuối → **Xong** → màn cuối của ②: **❓ Trả lời câu hỏi** / **Về**. ② không ảnh hưởng sao.

## 6. ③ Câu hỏi cuối truyện

### 6.1. Ba kiểu câu hỏi
Olly đọc câu hỏi (karaoke) + dòng tiếng Việt. Bé không cần đọc câu hỏi; **lựa chọn dạng chữ** phải là từ bé đọc được (`decodable` / `tricky`).

| Kiểu | Hỏi về | Bé làm | Ví dụ | Dùng lại |
|---|---|---|---|---|
| `pick` | nhân vật, đồ vật, hành động | chạm 1 trong 3 hình | *What gets the hat?* 🐶 / 🐱 / 🐷 | khay chọn hình 3.1.5 |
| `word` | cảm xúc, trạng thái, kết quả | chạm 1 trong 2–3 thẻ chữ | *Is Sam sad or glad at the end?* **sad** / **glad** | thẻ từ Quest 2 |
| `order` | trình tự trước – sau – cuối | xếp 3 hình **trang** vào ô *first / next / last* | trang 1, 3, 5 xáo trộn | khay + ô Toán T4 |

- Mỗi truyện **3 câu hỏi, đủ 3 kiểu**, thứ tự `pick` → `word` → `order`. Ba câu hỏi phải hỏi **ba chi tiết khác nhau** (không hai câu cùng `page` cho `pick` / `word`, đáp án khác nhau).
- Thẻ của `order` là **hình trang**: ảnh trang, không có thì emoji của trang (`emoji`). Một trong 3 trang không có hình riêng (không ảnh, không emoji trang — chỉ còn emoji bìa) hoặc hai trang trùng hình → bỏ câu `order`, còn 2 câu (ST-11): bé không phân biệt được hai thẻ giống nhau. 7 truyện có sẵn có emoji khác nhau ở mỗi trang nên luôn đủ 3 câu.
- Vị trí đáp án / thứ tự thẻ xáo khi chơi; `order` không bao giờ hiện sẵn đúng thứ tự.

**Trường của từng kiểu** (✓ bắt buộc, — không có):

| Trường | `pick` | `word` | `order` | Ghi chú |
|---|---|---|---|---|
| `id`, `type` | ✓ | ✓ | ✓ | |
| `en`, `vi` | ✓ | ✓ | ✓ | câu hỏi |
| `options` | ✓ 3 từ | ✓ 2–3 từ ngắn bé đọc được | — | |
| `emoji` | ✓ `{ từ: emoji }` cho mọi lựa chọn (truyện có sẵn); bố mẹ tạo: thiếu thì dùng ảnh Kho ảnh của từ, không có cả hai → cảnh báo | — | — | hình của lựa chọn |
| `answer` | ✓ thuộc `options` | ✓ thuộc `options` | — | |
| `pages` | — | — | ✓ đúng 3 id trang khác nhau | **thứ tự trong mảng = đáp án** |
| `page` | ✓ | ✓ | — | trang chứa đáp án, hiện lại khi sai lần 1 |
| `say` | ✓ | ✓ | không bắt buộc | câu trả lời đầy đủ Olly đọc khi đúng |
| `explainVi` | ✓ | ✓ | ✓ | giải thích khi sai lần 2 |

### 6.2. Chấm và gợi ý (SPEC 4.1)
Chấm **theo câu hỏi** (một câu hỏi = một mục), không theo từng thao tác.

**`pick`, `word`:**
- **Sai lần 1:** lựa chọn sai mờ tại chỗ (không chạm lại); Olly *"Let's look again!"* + hiện trang `page` thu nhỏ trên câu hỏi, đọc lại câu của trang đó.
- **Sai lần 2:** giải thích tiếng Việt một lần (`explainVi`) + đáp án sáng → `missed`.
- Đúng lần đầu → `independent`; đúng sau sai 1 → `helped`. Đúng → câu `say` hiện + Olly đọc.

**`order`:**
- Bé chạm thẻ trang trong khay → thẻ vào ô trống kế tiếp (*first → next → last*); chạm thẻ đã đặt (chưa chấm) → về khay. Đặt đủ 3 ô → **tự chấm** (không có nút kiểm tra).
- **Lần chấm 1 sai:** thẻ ở **đúng ô** giữ lại + viền xanh, thẻ sai về khay; Olly *"Let's look again!"* + đọc lại câu đầu của từng trang **còn trong khay** (bé nghe để biết chuyện nào trước). Bé đặt lại vào các ô trống.
- **Lần chấm 2 sai:** giải thích tiếng Việt (`explainVi`) + Olly xếp nốt đúng thứ tự, đọc lần lượt 3 trang → `missed`.
- Đúng ở lần chấm 1 → `independent`; đúng ở lần chấm 2 → `helped`. (Mỗi lần chấm là một "lần trả lời" — đặt sai một thẻ hay cả ba đều chỉ tính một lần sai.)

### 6.3. Sao
Theo bảng sao kiểu Tả tranh (ít mục nên không dùng % của SPEC 4.4):

| Kết quả các câu hỏi của lượt | Sao |
|---|---|
| Mọi câu `independent` | 3 |
| Không câu nào `missed` (có câu `helped`) | 2 |
| Có câu `missed` | 1 |

- `bestStars` giữ cao nhất; chơi lại không giảm sao.
- Thoát giữa ③: không tính sao, `plays` không tăng; kết quả các câu đã chấm vẫn ghi.

## 7. Tiến độ (kho `progress`, SPEC 4.3)

### 7.1. Khóa và kiểu dữ liệu
**`lesson:<storyId>`** — tạo khi có sự kiện đầu tiên:

| Trường | Kiểu | Ý nghĩa / khi nào đổi |
|---|---|---|
| `listened` | number | số lần **nghe tới hết trang cuối** ở ①. Nghe lại truyện đã xong → tăng. Thoát giữa chừng → không tăng. |
| `plays` | number | số lần **làm xong cả 3 (hoặc 2) câu hỏi**. Thoát giữa ③ / nghe mà không làm câu hỏi → không tăng. |
| `bestStars` | number 0–3 | sao cao nhất; 0 = chưa làm xong câu hỏi lần nào |
| `lastStars` | number \| null | sao lần làm xong câu hỏi gần nhất |
| `completedAt` | number \| null | lần đầu làm xong câu hỏi (dùng cho ⭐ Tiếp theo, giống bài học) |
| `lastAt` | number \| null | lần cuối có hoạt động (nghe, đọc hoặc câu hỏi) |
| `contentHash` | string | dấu nội dung lúc ghi sao (7.2) |

**`<storyId>/quiz/<qid>`** — bản ghi mục thường: `seen, independent, helped, missed, streak, lastAt` (number); thêm `hash` (string) = dấu của câu hỏi lúc ghi.

**`<storyId>/read/<sid>`** — `{ practiced: number, skipped: number, bestLevel: 'word'|'chunk'|'sentence'|'fluent'|null, en: string, lastAt: number }` (`en` = chữ câu lúc ghi, để biết câu đã bị sửa).

### 7.2. Sửa hoặc thay truyện
Mỗi câu hỏi có **dấu** `hash` = băm của: trường của câu hỏi + chữ `en` của mọi câu thuộc trang nó tham chiếu (`page` hoặc `pages`). Dấu truyện `contentHash` = băm các dấu câu hỏi.

| Thay đổi | Xử lý |
|---|---|
| Tiêu đề, `titleVi`, `vi` của câu, `cover`, `characters`, `setting`, `imagePrompt` | giữ mọi tiến độ |
| Ảnh trang (thay / xóa) | giữ tiến độ; `order` thiếu ảnh thì chỉ bị bỏ lúc chơi (6.1) |
| Chữ `en` của một câu | xóa `<storyId>/read/<sid>` của câu đó; câu hỏi tham chiếu trang chứa câu đó **đổi dấu** → xóa `<storyId>/quiz/<qid>` của câu hỏi đó |
| Sửa câu hỏi (bất kỳ trường nào trừ `vi`, `explainVi`) | đổi dấu → xóa `<storyId>/quiz/<qid>` |
| Xóa câu hỏi | xóa `<storyId>/quiz/<qid>` |
| Xóa trang | xóa ảnh trang, xóa `read/<sid>` các câu của trang; câu hỏi tham chiếu trang đó **không còn hợp lệ** → kiểm tra 8.3 báo lỗi, bố mẹ phải sửa / bỏ câu hỏi trước khi lưu |
| Thay cả truyện (nhập trùng id, chọn "Thay") | so từng câu / câu hỏi theo `id` + dấu như các dòng trên; giữ phần còn nguyên |

- **Sao sau khi sửa:** `contentHash` mới khác `contentHash` lúc ghi sao → `bestStars` giữ nguyên trên thẻ nhưng hiện **mờ** + dòng nhỏ *"Truyện đã sửa"*; lần làm xong câu hỏi kế tiếp ghi `bestStars` = sao lần đó (có thể thấp hơn), cập nhật `contentHash`. Sửa không đổi dấu (bảng trên, dòng 1–2) → sao giữ nguyên, không mờ.
- Hỏi lại trước khi lưu nếu thay đổi làm mất tiến độ: *"Sửa sẽ xóa kết quả của 2 câu hỏi và 1 câu đọc. Lưu?"*

### 7.3. Góc bố mẹ → 📚 Truyện
Mỗi truyện: số lần nghe hết (`listened`), số lần làm câu hỏi (`plays`), sao, câu hỏi hay sai (theo kiểu `pick / word / order`), *"đã đọc 7 / 9 câu"* + mức đọc cao nhất từng câu, tỉ lệ từ đọc được + từ mới (3.2).

## 8. Dữ liệu

### 8.1. Lưu ở đâu
- Kho mới **`stories`** (bước `MIGRATIONS` mới, `keyPath: 'id'`) — tách khỏi `lessons` như `scenes` (SPEC 5.4: truyện là bản ghi riêng `kind: 'story'`).
- **Ảnh trang:** kho `images` sẵn có, `lessonId = <storyId>`, `word = <pageId>` — quản lý theo **(storyId, pageId)**, không theo thứ tự trang hay số ô. Bản ghi thêm `source: 'grid' | 'single'` và `gridCell` (số ô 0–5 trong ảnh lưới gốc, chỉ khi `source = 'grid'`) để màn ảnh biết ảnh trang lấy từ đâu. `id` bản ghi ảnh là UUID nên **không trùng** giữa các truyện; truyện phân biệt bằng `lessonId` (`id` truyện duy nhất, có chỉ mục `lessonId`).
- **Ảnh lưới gốc:** lưu thêm một bản ghi `lessonId = <storyId>`, `word = '_grid'` (cạnh dài ≤ 1536 px, kèm `cols`, `rows`, `cells` = bảng ô → `pageId` / `null`) để **cắt lại / đổi ô / gửi kèm khi vẽ lại một ô** mà không phải nhờ AI vẽ lại cả truyện. Lưu ảnh lưới mới thì thay bản cũ. Bố mẹ xóa được ảnh lưới gốc (các ảnh trang vẫn giữ); xóa truyện thì xóa luôn.
  - Thay ảnh trang: `setWordImage` đã **xóa bản cũ cùng (lessonId, word)** trong cùng giao dịch → không có ảnh rác.
  - Xóa trang: `removeWordImage(storyId, pageId)` cùng giao dịch với lưu truyện.
  - Xóa truyện: xóa mọi ảnh `lessonId = storyId` + mọi khóa tiến độ `lesson:<storyId>`, `<storyId>/…` (dùng chỉ mục `lessonId` như `deleteLesson`) — **một giao dịch**.
  - Lưu truyện: sau khi lưu, xóa ảnh có `lessonId = storyId` mà `word` không còn là `pageId` nào và không phải `_grid` (dọn ảnh mồ côi).
- Ảnh trang **không** vào Kho ảnh dùng chung; **lựa chọn hình** của `pick` dùng Kho ảnh theo từ (`lib`) + emoji như mọi chỗ khác.

### 8.2. Kiểu dữ liệu
```json
{
  "version": 1,
  "kind": "story",
  "id": "story-g3-red-hat",
  "track": "phonics",
  "group": 3,
  "lessonId": null,
  "title": "The Red Hat",
  "titleVi": "Cái mũ đỏ",
  "cover": "👒",
  "characters": "Sam: a small boy, short brown hair, blue T-shirt, red hat. A big brown dog with floppy ears.",
  "setting": "a sunny garden with green grass, a fallen log and a white fence",
  "pages": [
    { "id": "p1", "sentences": [ { "id": "s1", "en": "Sam has a red hat.", "vi": "Sam có một cái mũ đỏ." } ],
      "emoji": "👦👒", "imagePrompt": "Sam smiles and holds up his red hat in a sunny garden." }
  ],
  "questions": [
    { "id": "q1", "type": "pick", "en": "What gets the hat?", "vi": "Con gì lấy cái mũ?",
      "options": ["dog", "cat", "pig"], "answer": "dog", "page": "p3",
      "say": "The dog gets the hat.", "explainVi": "Con chó lấy cái mũ của Sam đấy." },
    { "id": "q2", "type": "word", "en": "Is Sam sad or glad at the end?", "vi": "Cuối truyện Sam buồn hay vui?",
      "options": ["sad", "glad"], "answer": "glad", "page": "p5",
      "say": "Sam is glad!", "explainVi": "Con chó trả lại mũ nên Sam vui." },
    { "id": "q3", "type": "order", "en": "What happens first, next and last?", "vi": "Chuyện gì xảy ra trước, sau, cuối cùng?",
      "pages": ["p1", "p3", "p5"], "explainVi": "Đầu tiên Sam có mũ, rồi con chó lấy mũ, cuối cùng chó trả mũ." }
  ],
  "builtIn": true,
  "createdAt": 0,
  "updatedAt": 0
}
```
- `emoji` của trang (không bắt buộc): hình thay thế khi trang chưa có ảnh (8.4); thiếu thì dùng `cover`.
- `characters` (bắt buộc), `setting` (không bắt buộc — bối cảnh chung, ví dụ *"a sunny garden with a fallen log and a white fence"*), `imagePrompt` (không bắt buộc — thiếu thì prompt ảnh dùng câu tiếng Anh của trang, 8.4): chỉ cho prompt ảnh, không hiện cho bé.

### 8.3. Kiểm tra khi nhập / lưu
**Lỗi → từ chối cả truyện, chỉ rõ chỗ (tiếng Việt), dữ liệu cũ giữ nguyên:**
- `kind = "story"`, `version` hỗ trợ, `id` hợp lệ (`[a-z0-9-]`) hoặc `"auto"`, `title` không rỗng, `track` ∈ `phonics / book`; `phonics` có `group` 1–7.
- 4–6 trang; mỗi trang 1–2 câu, `en` không rỗng; `id` trang / câu / câu hỏi không trùng trong truyện.
- 2–3 câu hỏi; mỗi câu hỏi đủ trường theo bảng 6.1; `answer` ∈ `options`; `page` / `pages` trỏ tới trang có thật; `order.pages` đúng 3 trang khác nhau.

**Cảnh báo, không chặn** (hiện ở màn xem lại): câu sai bậc 3.1 (dài quá, đại từ sớm); thiếu `vi`; tỉ lệ đọc được < 70%; lựa chọn `pick` chưa có emoji / ảnh; lựa chọn `word` bé chưa đọc được; hai câu hỏi cùng `page`; thiếu ảnh trang.

### 8.4. Ảnh truyện và trang thiếu ảnh
- **Một ảnh lưới cho cả truyện** (đã chốt): 4 trang → 2 × 2, ảnh **vuông 1:1**; 5–6 trang → 3 × 2 (3 cột, 2 hàng), ảnh **ngang 3:2**. Hai tỉ lệ này app vẽ ảnh nào cũng hỗ trợ (ChatGPT chỉ có 1:1 / 3:2 / 2:3), và cả hai cho **ô vuông**.
- **Ô vuông trong khung trang 4:3:** khung hình của màn truyện vẫn 4:3 (giống Tả tranh, 4.1) nhưng ảnh trang hiện **trọn** (`object-fit: contain`) giữa khung, hai bên là nền nhạt lấy theo màu viền ảnh — không cắt mất đầu / chân nhân vật. Ảnh lẻ bố mẹ chọn (tỉ lệ bất kỳ) cũng hiện trọn như vậy. Truyện không có vùng chạm theo tọa độ nên không cần ảnh lấp kín khung.
- **Bốn lớp giữ hình đồng nhất giữa các trang** (AI vẽ nên không bảo đảm 100%; bố mẹ thấy lệch ở màn xem trước):
  1. **một ảnh lưới** cho cả truyện — AI vẽ mọi cảnh trong một lần nên dùng chung nhân vật, nét, màu (vẽ từng trang riêng thì mỗi lần AI vẽ lại nhân vật từ đầu);
  2. **mô tả nhân vật cố định** (`characters`) ở đầu prompt, đặc điểm dễ thấy (màu tóc, màu áo, phụ kiện), nhắc lại cho mọi ô;
  3. **khóa bối cảnh + nét vẽ:** `setting` (bối cảnh chung của truyện) + **một dòng nét vẽ dùng chung cho mọi truyện** `STORY_ART_STYLE` (*flat cartoon for young children, thick dark outlines, soft bright colours, simple background, same art style and same setting in every panel*) — hai cảnh cùng một chỗ không bị vẽ thành hai phông khác nhau;
  4. **vẽ lại một ô** khi chỉ một trang lệch (mục dưới) — gửi kèm ảnh lưới cũ làm ảnh mẫu.
- **Prompt ảnh lưới** (tiếng Anh, app dựng từ `STORY_ART_STYLE` + `characters` + `setting` + `imagePrompt` từng trang):
  - dòng nét vẽ `STORY_ART_STYLE`, rồi mô tả nhân vật (`characters`) ở **đầu** prompt và nhắc lại: *same face, same hair colour, same clothes in every panel*; rồi bối cảnh: *All panels take place in: {setting}* (truyện không có `setting` thì bỏ dòng này);
  - *no extra main characters* — chỉ nhân vật trong `characters` + đồ vật / con vật truyện nhắc tới;
  - *no text, no letters, no speech bubbles, no page numbers*;
  - mỗi ô **một cảnh**, đánh thứ tự **trái → phải, trên → dưới**, liệt kê *Panel 1: …, Panel 2: …*; mô tả cảnh của ô = `imagePrompt` của trang, **trang không có `imagePrompt` thì dùng chính câu tiếng Anh của trang** (*Panel 3: A big dog gets the hat!*) — 7 truyện có sẵn đi theo cách này, không cần viết thêm mô tả cảnh;
  - **bố cục cứng:** *One {1:1 square / 3:2 landscape} image divided into exactly {cols} columns × {rows} rows of EQUAL square panels, separated by straight thin white lines. Each panel is a separate, complete picture — not part of one wide panorama. Nothing crosses from one panel into another. No outer border, no decorative frames.*;
  - nhân vật **trọn người**, đặt giữa ô, không bị cắt đầu / chân, chừa khoảng trống quanh mép ô (app cắt bỏ ~4% mép mỗi ô);
  - 5 trang trên lưới 3 × 2: *Only Panels 1–5 contain story scenes. Panel 6 is reserved: it must be completely empty pure white (#FFFFFF), with absolutely no characters, objects, decorations, shadows, textures or scene elements.* — app **vẫn** mặc định không dùng ô 6, dù AI có làm theo hay không.
- **Cắt ảnh** (`loadGridImage` / `sliceGrid` của `image.js`, đang dùng cho Kho ảnh — **không dùng AI**, đọc điểm ảnh):
  - app **biết trước** kiểu lưới (2 × 2 / 3 × 2 theo số trang), dò **đường kẻ trắng** theo điểm ảnh để cắt đúng chỗ AI thực sự kẻ (AI hay vẽ khoảng cách giữa các ô không đều); dò không ra hoặc không khớp kiểu lưới → **chia đều** theo số cột / hàng. Mỗi ô bỏ ~4% mép để không dính đường kẻ — vì vậy không có "pixel lẻ" bị sót hay đường trắng thừa ở ảnh trang.
  - **Kiểm tra trước khi cắt:** ảnh giải mã được (không → *"Không đọc được ảnh này, hãy chọn ảnh khác."*); mỗi ô sau khi cắt ≥ **300 × 300 px** (ảnh lưới quá nhỏ → *"Ảnh nhỏ quá, trang sẽ bị mờ — hãy tải ảnh gốc từ app AI."*, không cắt, không lưu gì). Tỉ lệ ảnh lệch nhiều so với 1:1 / 3:2 (> 15%) → cảnh báo *"Ảnh không đúng khổ, có thể bị cắt lệch — xem kỹ từng ô."*, vẫn cho cắt. Ảnh xoay: `createImageBitmap` (giải mã dùng chung với Kho ảnh) theo mặc định của trình duyệt tự xoay theo EXIF (`imageOrientation: 'from-image'`); ảnh tải từ app AI thường không có EXIF xoay — còn lệch thì bố mẹ thấy ngay ở màn xem trước.
  - Ảnh lưới gốc **không bị sửa** khi cắt hay đổi ô.
- **Màn xem trước** (chưa ghi gì vào kho cho tới khi bấm **Lưu ảnh**):
  - Hiện **ảnh lưới thu nhỏ** (đánh số ô 1–6) và danh sách **trang 1 → N**, mỗi trang: câu của trang + ô đang gán cho trang đó. Mặc định ô k → trang k; ô 6 của truyện 5 trang: **không dùng**, không tự gán cho trang nào.
  - **Đổi ô:** chạm ô của một trang → ô đó được chọn (viền cam); chạm ô của trang khác → **hoán đổi** hai trang; chạm lại ô đang chọn → bỏ chọn. Chỉ đổi bảng gán ô → trang (`cells`), không sửa ảnh. Ảnh cạnh câu đổi ngay.
  - **Không dùng ô này:** trang đó chuyển sang emoji (8.4 thiếu ảnh). Ô bị bỏ hiện mờ trong hàng **"Ô chưa dùng"** (kể cả ô 6) — chạm ô chưa dùng rồi chạm một trang → gán ô đó cho trang (ô đang gán của trang đó về "chưa dùng"). Dữ liệu ô không bị xóa.
  - **Lưu ảnh:** ghi ảnh lưới gốc (`_grid` + `cells`) và ảnh từng trang được gán (`source: 'grid'`, `gridCell`) trong **một giao dịch**; trang không được gán ô thì giữ ảnh trang cũ (nếu có), không xóa.
- **🔁 Vẽ lại một ô** (khi chỉ một trang lệch — ở màn xem trước và màn ảnh của truyện, mỗi trang có nút **🔁 Prompt vẽ lại trang này**):
  1. App chép prompt (tiếng Anh): *"The attached image is a picture grid for a children's story. Draw ONLY the scene of Panel {n} again, as ONE single {tỉ lệ} picture: {mô tả cảnh}. Keep exactly the same characters as in the other panels ({characters}) — same faces, hair colour, clothes and accessories, and the same number of characters in this scene. Same setting ({setting}) and same art style and colours. Do not add any character or object that is not in the scene description. One single picture only: no grid, no panel lines, no text, no page numbers."* — **{tỉ lệ}** lấy từ **ảnh trang hiện tại** (chiều rộng / cao, làm tròn về *square 1:1*, *4:3 landscape* hoặc *3:2 landscape*; trang chưa có ảnh → *square 1:1* như ô lưới), không mặc định 4:3. Kèm dòng tiếng Việt: *"Gửi prompt này KÈM ảnh lưới (nút ⬇️ Tải ảnh lưới) cho ChatGPT / Gemini."* — có nút **⬇️ Tải ảnh lưới** lấy từ `_grid`; truyện không còn ảnh lưới gốc → gửi kèm ảnh một trang khác đẹp nhất (prompt đổi chữ *"picture grid"* thành *"page from the same story"*).
  2. Bố mẹ dán ảnh mới vào trang đó → app hiện **ảnh cũ và ảnh mới cạnh nhau** (cùng câu của trang) với hai nút **✓ Dùng ảnh mới** / **Giữ ảnh cũ**. Không tự thay khi vừa dán.
  3. **✓ Dùng ảnh mới** → chỉ thay ảnh của đúng `pageId` (`source: 'single'`); các trang khác và ảnh lưới gốc giữ nguyên.
- Ảnh lẻ từng trang (chọn / chụp) cũng được, cùng màn quản lý, cũng qua bước so sánh cũ / mới khi trang đã có ảnh.
- **Thiếu ảnh** — không bao giờ chặn việc đọc:
  - trang chưa có ảnh → `emoji` của trang cỡ lớn trên nền nhạt, thiếu thì `cover`;
  - có ảnh một số trang → trang thiếu dùng emoji như trên;
  - ảnh hỏng / không giải mã được → coi như thiếu ảnh của trang đó (ghi `console.warn`), truyện chạy tiếp.

### 8.5. Tạo truyện bằng AI (Góc bố mẹ → Bài học → 📚 Truyện)
Cùng tinh thần 5.7a: **gõ ít nhất, dùng AI nhiều nhất**.
1. Bố mẹ chọn **nguồn**: một bài Theo sách đã có (lấy từ + mẫu câu của Unit) **hoặc** một nhóm âm Phonics (mặc định = nhóm bé đã học xong, như 5.7a). Tùy chọn: ý tưởng một dòng (*"Bé đi sở thú với bố"*), số trang 4 / 5 / 6.
2. **📋 Chép prompt viết truyện** → AI trả JSON đúng 8.2. App đưa vào prompt: danh sách grapheme + tricky đã học (từ `learnedPhonics`, cùng nguồn với 3.2), từ của Unit, bậc 3.1 của nhóm, bảng trường câu hỏi 6.1, nguyên tắc 3 câu hỏi hỏi 3 chi tiết khác nhau, yêu cầu `characters` (đặc điểm dễ thấy, cố định: màu tóc, màu áo, phụ kiện) + `setting` + `imagePrompt` từng trang, `"id": "auto"`.
3. Dán vào **📥 Nhập** → kiểm tra 8.3 → màn **xem lại**: từng trang (câu + VI), từ `new` tô màu, tỉ lệ đọc được, cảnh báo; sửa chữ tại chỗ; ✕ bỏ câu hỏi (còn ≥ 2). **Lưu** mới ghi vào kho (thoát giữa chừng → không ghi gì).
4. **🖼️ Ảnh cho truyện** (8.4).

**Quy tắc `id`:**
- `"auto"` → app đặt **một lần, lúc Lưu**: `story-<lessonId hoặc gN>-<slug title>`; đã có → thêm `-2`, `-3`… (đọc lại danh sách truyện ngay trước khi đặt). Bản nháp trong màn xem lại giữ `auto`, chưa chiếm id.
- `id` cụ thể trùng truyện đã có → hỏi **Thay truyện cũ** (so tiến độ theo 7.2) / **Lưu thành truyện mới** (đặt id mới như `auto`). Hai truyện không bao giờ cùng `id`.
- Truyện có sẵn (`builtIn`) không bị thay / xóa bằng nhập; nhập trùng id truyện có sẵn → chỉ cho **Lưu thành truyện mới**.
- Lưu (truyện + ảnh + xóa tiến độ theo 7.2) là **một giao dịch IndexedDB**; lỗi giữa chừng → không đổi gì.

## 9. Truyện có sẵn
- **7 truyện Phonics**, mỗi nhóm âm 1–7 một truyện (5 trang, 3 câu hỏi, đúng bậc 3.1), vẽ bằng SVG + emoji như tranh "In the park" (chạy offline ngay, không cần ảnh AI). Bố mẹ có thể thay ảnh qua 8.4 (bản sao, như thay tranh có sẵn ở Kho ảnh).
- Dữ liệu: `js/story/builtin-stories.js`; test `tests/unit/read-story.test.js` (`stories.test.js` / `scripts/stories-sheet.mjs` là câu đố Toán T12 — khác).
- Bảng duyệt **STORIES.md** sinh bằng `scripts/read-stories-sheet.mjs` (như QUEST-RIDDLES.md) **gọi chính `classifyWord`**: mỗi trang EN / VI, mỗi từ kèm loại (`decodable` + tách grapheme / `tricky` + nhóm học / `new`), số từ mỗi câu, bậc, câu hỏi + đáp án. Từ `new` hoặc sai bậc in **⚠** đầu dòng. **Bố mẹ duyệt trước khi đưa vào app.**
- Ví dụ nhóm 3 — bậc B. Bé đã xong nhóm 1–3: grapheme *s a t i p n · c k ck e h r m d · g o u l f b*; tricky / từ nhận diện **cộng dồn** nhóm 1–3: *I, the* (1) · *a, an* (1, từ nhận diện) · *he, she, me, we* (2) · *be, was, to, do* (3).

  | Trang | EN | Phân loại (3.2) | VI |
  |---|---|---|---|
  | 1 | Sam has a red hat. | Sam has red hat: đọc được · ***a***: tricky | Sam có một cái mũ đỏ. |
  | 2 | The hat is on a log. | hat is on log: đọc được · ***The, a***: tricky | Cái mũ ở trên khúc gỗ. |
  | 3 | A big dog gets the hat! | big dog gets hat: đọc được · ***A, the***: tricky | Một con chó to lấy mất cái mũ! |
  | 4 | Sam is sad. He sits on the log. | Sam is sad sits on log: đọc được · ***He, the***: tricky | Sam buồn. Bạn ấy ngồi trên khúc gỗ. |
  | 5 | The dog drops the hat. Sam gets it and is glad! | dog drops hat Sam gets it and is glad: đọc được · ***The, the***: tricky | Con chó thả cái mũ ra. Sam nhặt lại mũ, vui quá! |

  Không có từ `new`. *He* (trang 4) đúng quy tắc đại từ: câu ngay trước nói về Sam. Câu hỏi: như 8.2 (`pick` trang 3 · `word` trang 5 · `order` trang 1 → 3 → 5).
  > Story-0 (2026-11-19): đã kiểm bằng `classifyWord` + test — mọi từ đọc được, đúng bậc B. Bảng đầy đủ + bản sửa theo review: STORIES.md.

## 10. Chia sẻ, sao lưu, offline
- Gói chia sẻ (6.4) thêm `stories` + ảnh trang; nhập: truyện trùng `id` → như "Thay truyện cũ" (7.2, 8.5), dọn ảnh trang cũ không còn dùng.
- Sao lưu (khi làm, SPEC 6.2) gồm kho `stories`.
- Truyện có sẵn + SVG được service worker cache; truyện bố mẹ tạo + ảnh nằm trong IndexedDB → đọc được offline sau khi mở. Giọng đọc: như SPEC-ta-tranh 10.

## 11. Kiểm tra

### 11.1. Unit (`npm test`)
- `classifyWord`: mỗi bước của bảng 3.2; dấu câu, chữ hoa, gạch nối, `'s`, số nhiều; tricky chưa học → `new`; tricky đã học dù tách được (*he*) → `tricky`; *see* với nhóm 1–3 → `new`.
- Truyện có sẵn: mọi từ `decodable` / `tricky` ở nhóm của truyện, đúng bậc 3.1, có `vi`, đủ 3 câu hỏi đúng bảng 6.1, ba câu hỏi khác chi tiết.
- Kiểm tra dữ liệu 8.3 (mọi lỗi / cảnh báo có ca test).
- `id`: `auto` → id duy nhất (`-2`, `-3`), "Lưu thành truyện mới", không thay được truyện có sẵn.
- Bảng sao 6.3; chấm `order` (giữ thẻ đúng, lần chấm 1 / 2); khóa và kiểu tiến độ 7.1; dấu + bảng sửa 7.2.
- Ảnh: thay ảnh không để bản cũ; xóa trang / truyện dọn ảnh; lưu dọn ảnh mồ côi.
- Gói chia sẻ có truyện + ảnh trang, nhập lại trên máy khác.

### 11.2. Giao diện (Playwright, `?fast`, giọng đọc giả)
| ID | Tình huống | Mong đợi |
|---|---|---|
| ST-01 | Tab 📚 Truyện | Thẻ truyện có sẵn, ⭐ Tiếp theo đúng truyện |
| ST-02 | Nghe hết truyện | Lật đủ trang, karaoke chạy, màn cuối có ❓ / 📖 / 🔁, `listened + 1` |
| ST-03 | Chạm từ giữa lúc đọc | Đọc riêng từ, 3 giây sau đọc lại từ đầu câu đang đọc |
| ST-04 | Tắt tự chạy | Không tự lật; bấm Trang sau mới lật |
| ST-05 | Ra nền ở trang 3 | Quay lại trang 3, đang dừng, không tự đọc |
| ST-06 | Bé đọc, không mic | Có ✅ Con đọc xong, `practiced + 1` |
| ST-07 | Câu hỏi đúng hết lần đầu | 3 sao, `plays + 1` |
| ST-08 | `pick` sai 1 lần rồi đúng | Lựa chọn mờ, hiện trang `page`; 2 sao |
| ST-09 | `word` sai 2 lần | Tiếng Việt + đáp án sáng → 1 sao |
| ST-10 | `order` đặt sai 1 thẻ | Thẻ đúng ở lại (viền xanh), thẻ sai về khay; đúng lần 2 → `helped` |
| ST-11 | Trang không có ảnh | Hiện emoji trang; 3 trang của `order` không có hình riêng / trùng hình → chỉ 2 câu hỏi |
| ST-12 | Nhập JSON lỗi | Từ chối, chỉ rõ chỗ, truyện cũ không đổi |
| ST-13 | Ảnh lưới 3 × 2, truyện 6 trang | Cắt đúng 6 trang theo thứ tự |
| ST-14 | iPhone dọc | Hình + trang 2 câu + nút vừa màn, không cuộn màn |
| ST-15 | Từ có dấu câu `hat,` `dog!` | Phân loại đúng như `hat`, `dog` |
| ST-16 | `The` và `the` | Cùng loại, cùng gạch chân |
| ST-17 | Tricky chưa học (*you* khi mới xong nhóm 3) | Hiện là từ mới |
| ST-18 | Chạm từ khi đang đọc rồi bấm ⏸ | Không tự đọc tiếp sau 3 giây |
| ST-19 | Bấm ▶ trang sau 3 lần liên tục khi đang đọc | Chỉ đọc trang cuối cùng được chọn, không hai giọng chồng nhau |
| ST-20 | ⏸ trong 1,2 giây chờ tự lật | Không lật trang |
| ST-21 | Trang 2 câu, bật VI, iPhone 375 × 667 | Không tràn, màn không cuộn; bật / tắt VI không ngắt giọng đọc |
| ST-22 | Thoát giữa ③ | Không tính sao, `plays` không đổi, câu đã chấm vẫn ghi |
| ST-23 | Sửa `en` câu trang 3 (có `pick` tham chiếu) | Xóa tiến độ `pick` + câu đọc đó; sao hiện mờ "Truyện đã sửa" |
| ST-24 | Thay ảnh trang, xóa trang | Không còn ảnh cũ trong kho `images` |
| ST-25 | Nhập cùng truyện `id: auto` 3 lần | 3 truyện, id khác nhau (`-2`, `-3`) |
| ST-26 | Nhập JSON thiếu trang mà câu hỏi tham chiếu | Từ chối, chỉ rõ câu hỏi + trang |
| ST-27 | Truyện 5 trang, ảnh lưới 3 × 2 | Ô 6 mặc định không dùng; đổi chỗ hai ô ở màn xem trước |
| ST-28 | Có ảnh 2 / 5 trang | 3 trang còn lại hiện emoji, đọc bình thường |
| ST-29 | Tắt mạng sau khi mở truyện | Lật trang, đọc, câu hỏi chạy bình thường |
| ST-30 | Nghe hết rồi 📖 Con tự đọc | Không đọc mẫu tự động; vào 📖 giữa chừng → có đọc mẫu |
| ST-31 | Đọc 2 câu rồi ⏭ bỏ qua phần còn lại | Chỉ 2 câu có `practiced`, câu bỏ qua có `skipped` |
| ST-32 | Cuối bài Unit có truyện | Thẻ gợi ý hiện, không tự mở; Để sau → về danh sách |
| ST-33 | Prompt ảnh lưới truyện có / không có `setting`, trang có / không có `imagePrompt` | Có dòng nét vẽ chung + nhân vật ở đầu; có / bỏ dòng bối cảnh; ô thiếu `imagePrompt` dùng câu tiếng Anh |
| ST-34 | 🔁 Vẽ lại trang 4 rồi dán ảnh mới | Prompt có tỉ lệ của ảnh trang 4 hiện tại + nhắc gửi kèm ảnh lưới; hiện ảnh cũ / mới cạnh nhau; "Giữ ảnh cũ" không đổi gì; "Dùng ảnh mới" chỉ đổi trang 4, ảnh lưới gốc giữ nguyên |
| ST-35 | Prompt ảnh lưới 4 / 5 / 6 trang | 1:1 + 2 × 2 / 3:2 + 3 × 2; có câu bố cục cứng; truyện 5 trang có câu Panel 6 trắng hoàn toàn |
| ST-36 | Ảnh lưới quá nhỏ (ô < 300 px) / không giải mã được | Báo lỗi dễ hiểu, không cắt, kho không đổi |
| ST-37 | Màn xem trước: đổi trang 2 ↔ 4, bỏ ô 3, gán lại ô 6 cho trang 3, Lưu | `cells` đúng; ảnh trang theo `pageId`, `gridCell` đúng; ảnh lưới gốc không đổi; thoát không Lưu → kho không đổi |
| ST-38 | Ảnh trang vuông trong khung 4:3 | Hiện trọn ảnh, không cắt đầu / chân, nền hai bên |

## 12. Thứ tự làm
| Mốc | Phạm vi |
|---|---|
| Story-0 *(xong, bố mẹ duyệt STORIES.md 2026-11-19)* | `classifyWord` + bậc độ khó + test (3.1, 3.2), `js/story/builtin-stories.js`, `scripts/read-stories-sheet.mjs`, **STORIES.md** 7 truyện → bố mẹ duyệt. Chưa có màn chơi. |
| Story-a *(xong 0.12.0)* | Kho `stories`, tab 📚 Truyện, ① Nghe truyện (state machine 4.4), ③ Câu hỏi (pick / word / order), sao, tiến độ 7, 7 truyện đã duyệt (SVG + emoji) |
| Story-b *(xong 0.12.0)* | ② Bé đọc + mức đọc; Góc bố mẹ → 📚 Truyện (7.3) |
| Story-c *(xong 0.12.0)* | Tạo truyện bằng AI (8.5), ảnh lưới (bố cục cứng, cắt + kiểm tra ảnh, xem trước đổi / bỏ / gán lại ô, lưu ảnh lưới gốc) + bốn lớp giữ hình đồng nhất + vẽ lại một trang có so sánh cũ / mới (8.1, 8.4), sửa / thay truyện (7.2), gói chia sẻ, gợi ý cuối bài Unit |

## 13. Đã chốt (2026-11-19, theo review draft1)
| Nội dung | Quyết định |
|---|---|
| Thứ tự | Mở truyện vào Nghe; 📖 Con tự đọc lúc nào cũng được, không bắt buộc nghe hết |
| Câu hỏi | 3 câu, đủ 3 kiểu `pick` → `word` → `order` (thiếu ảnh → 2 câu) |
| Truyện có sẵn | 7 truyện, mỗi nhóm âm một truyện |
| Ảnh | Một ảnh lưới cho cả truyện |
| Gợi ý cuối bài Unit | Có, không tự mở truyện |

## 14. Ghi chú khi làm (0.12.0, 2026-11-19)
- **Code:** `js/story/words.js` (phân loại từ, bậc), `story.js` (danh sách, câu hỏi chơi được, chấm xếp thứ tự, sao, ghi nghe / đọc), `validate.js` (kiểm tra 8.3, id auto, dấu nội dung, `storyResets` 7.2), `prompts.js` (prompt viết truyện, ảnh lưới, vẽ lại một trang), `store.js` (lưu / thay / xóa, ảnh trang, ảnh lưới gốc — mỗi thao tác một giao dịch); màn bé `screens/story.js`; Góc bố mẹ `screens/parent/stories.js` (Bài học → 📚 Mở Truyện ngắn). Kho IndexedDB `stories` (bước nâng cấp thứ 5).
- **Chưa làm:** chạm GIỮ một từ đọc được để mở ô ghép âm (4.3) — chạm từ vẫn nghe Olly đọc cả từ. Mức đọc `fluent` (5) cần đo khoảng ngắt giữa các từ — nhận dạng giọng nói của trình duyệt không cho thời gian từng từ, nên chỉ ghi `word` / `chunk` / `sentence`.
- **Làm khác spec:** ② Bé đọc có nút 🎤 (bé bấm rồi máy mới nghe) thay cho tự nghe ngay — để ⏭ bỏ qua dùng được và giống Đọc câu 3.1.5. Gói chia sẻ chỉ kèm ảnh từng trang, **không** kèm ảnh lưới gốc (file nhẹ hơn; máy kia muốn vẽ lại một trang thì gửi kèm ảnh một trang khác — prompt tự đổi lời). Cài đặt "tự chạy" đổi nhãn: *Tả tranh & Truyện: tự chạy sang câu / trang sau*.
- **Test:** unit `read-story.test.js`, `read-story-c.test.js`; UI `story.spec.js` (nghe, đọc, câu hỏi, ra nền, iPhone dọc), `story-parent.spec.js` (tạo truyện, trùng id, ảnh lưới + xem trước, ảnh lẻ so sánh cũ / mới, gợi ý cuối bài Unit, "Truyện đã sửa").

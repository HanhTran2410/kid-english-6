# Olly English (kid-english-6)

PWA học tiếng Anh cho bé 6 tuổi cùng cú Olly: tập đọc, đánh vần và viết, nói chuyện, thử thách. Chạy offline, dữ liệu chỉ lưu trên máy. App anh em của [kid-english](../kid-english) (bé 3 tuổi) — phần lõi (giọng đọc, mic, nhận dạng, kho dữ liệu, service worker) chép từ đó. Xem [SPEC.md](SPEC.md).

## Chạy thử

```sh
npm ci
npx playwright install chromium   # lần đầu, để chạy test giao diện / tạo icon
npm run icons                      # tạo icon PNG từ app/icons/icon.svg
npm run serve                      # mở http://localhost:8080/
```

## Test

```sh
npm test            # unit
npx playwright test # giao diện (Chromium, cỡ iPad)
```

## Mỗi lần sửa code

Tăng phiên bản ở 3 chỗ cho trùng nhau: `APP_VERSION` (app/js/app.js), `VERSION` (app/sw.js), `version` (package.json). Thêm / bớt file trong `app/` thì sửa danh sách `ASSETS` trong `app/sw.js` (test sẽ báo nếu thiếu).

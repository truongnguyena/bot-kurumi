# Triển khai Kurumi Bot lên Render (24/7)

## 1. Đẩy code lên GitHub

Repo: https://github.com/truongnguyena/bot-kurumi.git

```bash
cd BOT/000
git init
git remote add origin https://github.com/truongnguyena/bot-kurumi.git
git add .
git commit -m "Kurumi Bot: sing, anime GitHub, Render deploy"
git branch -M main
git push -u origin main
```

**Không commit:** `appstate.json`, `config.json`, `key.txt` (đã có trong `.gitignore`).

Sau push, file `data/anime.json` dùng cho lệnh `/anime`.

## 2. Tạo Web Service trên Render

1. Vào https://dashboard.render.com → **New** → **Blueprint** (hoặc **Background Worker**).
2. Kết nối repo `truongnguyena/bot-kurumi`.
3. Render đọc `render.yaml` → service type **worker** (chạy nền 24/7).

## 3. Biến môi trường (bắt buộc)

| Biến | Mô tả |
|------|--------|
| `APPSTATE_JSON` | Toàn bộ nội dung `appstate.json` (mảng cookie JSON, một dòng hoặc minify) |
| `BOT_ADMIN_KEY` | `2803` (hoặc key admin của bạn) |
| `GITHUB_ANIME_URL` | (tùy chọn) URL raw `data/anime.json` trên GitHub |

Copy `config.example.json` → tạo `config.json` trên máy local; trên Render có thể commit `config.json` **không chứa** token nhạy cảm, hoặc mount qua Secret File.

**Cách lấy APPSTATE_JSON:** mở `appstate.json`, copy hết, dán vào Render Environment (hoặc dùng [jsonformatter.org](https://jsonformatter.org) minify).

## 4. Lệnh mới

- `/sing thương thầm` — tìm YouTube, reply STT để tải audio
- `/sing https://youtu.be/...` — tải trực tiếp
- `/anime` — 1 ảnh random từ GitHub
- `/anime 3` — 3 ảnh
- `/anime refresh` — tải lại list từ GitHub

## 5. Cập nhật ảnh anime

Sửa `data/anime.json` trên GitHub (mảng URL ảnh), push `main` → bot dùng `/anime refresh`.

## 6. Lưu ý Render

- **Worker** không sleep như free web service cũ; vẫn cần plan phù hợp để 24/7 ổn định.
- Cookie Facebook hết hạn → cập nhật `APPSTATE_JSON` và **Manual Deploy**.
- `canvas` có thể không build trên Render; lệnh cần canvas vẫn chạy local.

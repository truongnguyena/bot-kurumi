# Triển khai Kurumi Bot trên Fly.io (free / gần free)

Bot chạy nền 24/7: process `npm start` + HTTP `/health` để Fly không tắt máy.

## Yêu cầu

1. Tài khoản [Fly.io](https://fly.io)
2. Cài CLI: https://fly.io/docs/hands-on/install-flyctl/
3. `appstate.json` hợp lệ (cookie Facebook bot)

## Bước 1 — Cài flyctl & đăng nhập

```powershell
# Windows (PowerShell)
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

fly auth login
```

## Bước 2 — Clone repo (nếu chưa có)

```bash
git clone https://github.com/truongnguyena/bot-kurumi.git
cd bot-kurumi
```

## Bước 3 — Tạo app Fly (lần đầu)

```bash
fly launch --no-deploy --copy-config --name kurumi-bot
```

- Chọn region **Singapore (sin)** gần VN.
- Không tạo Postgres/Redis nếu được hỏi.
- File `fly.toml` đã có sẵn trong repo.

Đổi tên app: sửa `app = 'bot-kurumi'` trong `fly.toml` và tên khi `fly launch`.

## Bước 4 — Appstate (cookie bot) — khuyến nghị: GitHub

### Cách nhanh nhất (không cần `fly secrets`)

1. Copy cookie vào repo:

```powershell
Copy-Item appstate.json data\appstate.json
git add data/appstate.json
git commit -m "Update appstate"
git push
```

2. Deploy:

```powershell
fly deploy -a bot-kurumi
```

Bot tự đọc `data/appstate.json` trong image (hoặc tải từ raw GitHub).

**Repo public = lộ cookie.** Nên đặt repo **Private**.

---

### Cách cũ — Fly secrets (nếu không muốn đưa appstate lên Git)

Log lỗi `Thiếu appstate.json` = chưa có cookie.

```powershell
.\scripts\set-fly-secrets.ps1 -App bot-kurumi
```

### Key admin bot

```bash
fly secrets set BOT_ADMIN_KEY=2803 -a bot-kurumi
```

### Appstate (cookie đăng nhập) — quan trọng

**Cách A — PowerShell thủ công:**

```powershell
$j = Get-Content appstate.json -Raw | ConvertFrom-Json | ConvertTo-Json -Compress -Depth 50
fly secrets set "APPSTATE_JSON=$j" -a bot-kurumi
fly apps restart bot-kurumi
```

**Cách A2 — Git Bash:**

```bash
fly secrets set APPSTATE_JSON="$(cat appstate.json | tr -d '\n')" -a bot-kurumi
```

**Cách B — deploy trước, upload sau qua SSH:**

```bash
fly deploy
fly ssh console
# trong máy Fly:
# nano appstate.json  (dán nội dung cookie)
# exit
fly apps restart kurumi-bot
```

Và set để không ghi đè:

```bash
fly secrets set SKIP_APPSTATE_FILE=1
```

### Groq AI (tùy chọn, lệnh /ai)

```bash
fly secrets set GROQ_API_KEY=gsk_xxxx
```

## Bước 5 — Deploy

```bash
fly deploy -a bot-kurumi
```

Xem log:

```bash
fly logs -a bot-kurumi
```

Kiểm tra health:

```bash
fly open /health
```

## Bước 6 — Giữ bot chạy 24/7

`fly.toml` đã cấu hình:

- `auto_stop_machines = 'off'`
- `min_machines_running = 1`
- Health check `/health`

**Free tier Fly:** giới hạn RAM/CPU; bot nặng có thể cần scale memory:

```bash
fly scale memory 512
```

## Cập nhật code

```bash
git pull
fly deploy
```

## Cookie hết hạn

1. Export `appstate.json` mới từ trình duyệt.
2. `fly secrets set APPSTATE_JSON="..."` (hoặc upload qua SSH).
3. `fly apps restart kurumi-bot`

## Lệnh hữu ích

| Lệnh | Mô tả |
|------|--------|
| `fly status` | Trạng thái máy |
| `fly logs` | Log realtime |
| `fly ssh console` | Vào shell container |
| `fly apps restart kurumi-bot` | Khởi động lại |
| `fly secrets list` | Xem secrets (không hiện giá trị) |

## So với Render

| | Fly.io | Render Worker |
|--|--------|----------------|
| Free 24/7 | Có giới hạn, cần health HTTP | Worker free **không** có |
| Setup | Docker + flyctl | `render.yaml` |
| Region | `sin` (Singapore) | Tùy chọn |

## Xử lý lỗi

- **Thiếu appstate:** log `[deploy] Thiếu appstate.json` → set `APPSTATE_JSON`.
- **Out of memory:** `fly scale memory 1024` (có thể tính phí).
- **Build chậm:** lần đầu `npm install` trong Docker ~5–10 phút.

# data/

## appstate.json

Cookie đăng nhập Facebook của **tài khoản bot**.

- Fly.io / Docker: tự copy sang `/app/appstate.json` khi khởi động.
- Cập nhật cookie: sửa file này → `git push` → `fly deploy -a bot-kurumi`.

**Cảnh báo:** Repo **public** = ai cũng có thể lấy cookie và chiếm bot. Nên để repo **Private** hoặc chỉ dùng Fly secrets thay vì commit file này.

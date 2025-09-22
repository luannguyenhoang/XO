# 🚀 Hướng dẫn Deploy Game XO Online

## 1. 🚂 Railway (Khuyến nghị - Dễ nhất)

### Bước 1: Tạo tài khoản
- Truy cập: https://railway.app/
- Đăng ký bằng GitHub

### Bước 2: Deploy
1. Click "New Project"
2. Chọn "Deploy from GitHub repo"
3. Chọn repository của bạn
4. Railway sẽ tự động detect và deploy
5. Chờ 2-3 phút để deploy xong

### Bước 3: Lấy URL
- Railway sẽ tạo URL dạng: `https://your-app-name.railway.app`
- Chia sẻ URL này với bạn bè!

---

## 2. 🎨 Render

### Bước 1: Tạo tài khoản
- Truy cập: https://render.com/
- Đăng ký bằng GitHub

### Bước 2: Deploy
1. Click "New +" → "Web Service"
2. Connect GitHub repository
3. Cấu hình:
   - **Name**: `xo-game-online`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Click "Create Web Service"

### Bước 3: Lấy URL
- Render sẽ tạo URL dạng: `https://your-app-name.onrender.com`

---

## 3. ⚡ Vercel

### Bước 1: Cài đặt Vercel CLI
```bash
npm install -g vercel
```

### Bước 2: Deploy
```bash
vercel
```
- Làm theo hướng dẫn trên terminal
- Vercel sẽ tự động detect cấu hình

### Bước 3: Lấy URL
- Vercel sẽ tạo URL dạng: `https://your-app-name.vercel.app`

---

## 4. 🟣 Heroku

### Bước 1: Cài đặt Heroku CLI
- Tải từ: https://devcenter.heroku.com/articles/heroku-cli

### Bước 2: Login và tạo app
```bash
heroku login
heroku create your-app-name
```

### Bước 3: Deploy
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Bước 4: Lấy URL
```bash
heroku open
```

---

## 5. 🌟 Glitch

### Bước 1: Tạo project
- Truy cập: https://glitch.com/
- Click "New Project" → "Import from GitHub"
- Paste URL repository của bạn

### Bước 2: Cấu hình
- Glitch sẽ tự động detect và chạy
- Chờ 1-2 phút để build

### Bước 3: Lấy URL
- Glitch sẽ tạo URL dạng: `https://your-app-name.glitch.me`

---

## 🔧 Cấu hình bổ sung

### Thêm biến môi trường (nếu cần)
```bash
# Railway
railway variables set PORT=3000

# Render
# Thêm trong dashboard: PORT = 3000

# Heroku
heroku config:set PORT=3000
```

### Kiểm tra logs
```bash
# Railway
railway logs

# Heroku
heroku logs --tail

# Vercel
vercel logs
```

---

## 🎯 So sánh các platform

| Platform | Miễn phí | Dễ deploy | Tốc độ | Ổn định |
|----------|----------|-----------|--------|---------|
| Railway  | ✅ 500h/tháng | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Render   | ✅ Giới hạn | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Vercel   | ✅ Không giới hạn | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Heroku   | ✅ Giới hạn | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Glitch   | ✅ Hoàn toàn | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |

---

## 🚨 Lưu ý quan trọng

1. **Railway** là lựa chọn tốt nhất cho game này
2. **Vercel** có thể cần chỉnh sửa code để tương thích serverless
3. **Heroku** có thể sleep sau 30 phút không hoạt động
4. **Glitch** có thể restart bất ngờ
5. **Render** ổn định nhưng chậm hơn

---

## 🎮 Test sau khi deploy

1. Mở URL game trên 2 tab trình duyệt khác nhau
2. Click "Tham gia game" trên cả 2 tab
3. Kiểm tra game hoạt động bình thường
4. Chia sẻ URL với bạn bè!

**Chúc bạn deploy thành công! 🎉**

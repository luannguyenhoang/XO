# 🎮 Game XO Online - Tic Tac Toe Multiplayer

Game XO (Tic-Tac-Toe) 2 người chơi online real-time sử dụng Socket.IO và Node.js.

## ✨ Tính năng

- 🎯 Game XO (Tic-Tac-Toe) 2 người chơi
- ⚡ Real-time multiplayer với Socket.IO
- 🎨 Giao diện đẹp, responsive
- 🔄 Tự động tìm đối thủ
- 🏆 Hiển thị người thắng cuộc
- 🔄 Chơi lại game
- 🌐 Hỗ trợ ngrok để public ra ngoài

## 🚀 Cài đặt và chạy

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Chạy server

```bash
npm start
```

Hoặc chạy với nodemon (tự động restart khi có thay đổi):

```bash
npm run dev
```

### 3. Mở game

Mở trình duyệt và truy cập: `http://localhost:3000`

## 🌐 Deploy lên online

### Phương pháp 1: Ngrok (Nhanh nhất)

#### 1. Cài đặt ngrok
Tải và cài đặt ngrok từ: https://ngrok.com/

#### 2. Chạy ngrok
```bash
ngrok http 3000
```

#### 3. Chia sẻ URL
Ngrok sẽ tạo ra một URL public (ví dụ: `https://abc123.ngrok.io`). Chia sẻ URL này với bạn bè để chơi cùng!

### Phương pháp 2: Railway (Khuyến nghị - Miễn phí)

#### 1. Tạo tài khoản Railway
- Truy cập: https://railway.app/
- Đăng ký bằng GitHub

#### 2. Deploy
1. Click "New Project" → "Deploy from GitHub repo"
2. Chọn repository của bạn
3. Railway sẽ tự động deploy
4. Lấy URL dạng: `https://your-app-name.railway.app`

### Phương pháp 3: Render (Miễn phí)

#### 1. Tạo tài khoản Render
- Truy cập: https://render.com/
- Đăng ký bằng GitHub

#### 2. Deploy
1. Click "New +" → "Web Service"
2. Connect GitHub repository
3. Cấu hình:
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Click "Create Web Service"

### Phương pháp 4: Vercel (Miễn phí)

#### 1. Cài đặt Vercel CLI
```bash
npm install -g vercel
```

#### 2. Deploy
```bash
vercel
```

### Phương pháp 5: Heroku (Miễn phí)

#### 1. Cài đặt Heroku CLI
- Tải từ: https://devcenter.heroku.com/articles/heroku-cli

#### 2. Deploy
```bash
heroku login
heroku create your-app-name
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Phương pháp 6: Glitch (Miễn phí)

#### 1. Tạo project
- Truy cập: https://glitch.com/
- Click "New Project" → "Import from GitHub"
- Paste URL repository của bạn

**Xem hướng dẫn chi tiết trong file `DEPLOY_GUIDE.md`**

## 🎮 Cách chơi

1. **Tham gia game**: Nhấn nút "Tham gia game"
2. **Chờ đối thủ**: Hệ thống sẽ tự động ghép cặp với người chơi khác
3. **Chơi**: Lần lượt đánh X hoặc O vào ô trống
4. **Thắng**: Người đầu tiên có 3 ký tự liên tiếp (ngang, dọc, chéo) sẽ thắng
5. **Chơi lại**: Nhấn "Chơi lại" để bắt đầu game mới

## 🛠️ Công nghệ sử dụng

- **Backend**: Node.js, Express.js, Socket.IO
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Real-time**: WebSocket communication

## 📁 Cấu trúc project

```
XO/
├── package.json          # Dependencies và scripts
├── server.js             # Server chính với Socket.IO
├── public/               # Frontend files
│   ├── index.html        # Trang chủ game
│   ├── style.css         # Styling
│   └── script.js         # Client-side JavaScript
└── README.md             # Hướng dẫn này
```

## 🔧 Cấu hình

### Thay đổi port

Mặc định server chạy trên port 3000. Để thay đổi:

```bash
PORT=8080 npm start
```

### Environment variables

- `PORT`: Port để chạy server (mặc định: 3000)

## 🐛 Troubleshooting

### Lỗi kết nối

- Kiểm tra firewall và antivirus
- Đảm bảo port 3000 không bị sử dụng bởi ứng dụng khác
- Kiểm tra kết nối internet

### Lỗi ngrok

- Đảm bảo đã đăng ký tài khoản ngrok
- Kiểm tra token ngrok đã được cấu hình đúng
- Thử restart ngrok nếu gặp lỗi

## 📝 Ghi chú

- Game tự động xóa sau 10 giây khi kết thúc
- Mỗi game chỉ cho phép 2 người chơi
- Khi một người rời game, game sẽ kết thúc
- Game hỗ trợ chơi lại ngay lập tức

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request.

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

---

**Chúc bạn chơi game vui vẻ! 🎉**

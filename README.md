# 🎒 EnglishAppHubXanh (KidSpeak)

EnglishAppHubXanh là một ứng dụng web học Tiếng Anh tương tác cao cấp dành cho trẻ em, được thiết kế theo tiêu chuẩn đánh giá chứng chỉ **Cambridge English (Starters, Movers, Flyers)**. Ứng dụng tích hợp các công cụ AI chấm điểm thông minh giúp các bé rèn luyện đầy đủ 4 kỹ năng chính: Nghe, Nói, Đọc, Viết một cách vui nhộn và trực quan.

---

## 🌟 Tính năng nổi bật

### 1. Phân cấp chuẩn Cambridge & Đa kỹ năng
*   **3 Cấp độ**: Lộ trình bài học phân cấp rõ ràng theo các linh vật đáng yêu:
    *   🦛 **Starters** (Hippo Dễ Thương)
    *   🐒 **Movers** (Monkey Thông Minh)
    *   🦁 **Flyers** (Lion Dũng Cảm)
*   **4 Kỹ năng tương tác**:
    *   🎤 **Luyện Nói (Speaking)**: Thu âm giọng nói của bé trực tiếp trên trình duyệt, chấm điểm phát âm và chỉ ra các từ đọc chưa chuẩn.
    *   🎧 **Luyện Nghe (Listening)**: Nghe câu hỏi phát âm từ giáo viên AI và lựa chọn đáp án trắc nghiệm phù hợp.
    *   📖 **Đọc Hiểu (Reading)**: Đọc đoạn văn ngắn và trả lời câu hỏi lựa chọn đáp án.
    *   ✍️ **Tập Viết (Writing)**: Ô tập viết câu mô tả tranh sinh động, sửa lỗi chính tả và cấu trúc ngữ pháp thông qua sửa bài từ giáo viên AI.

### 2. Công cụ Giọng đọc chuẩn Edge Neural TTS
*   **Chất lượng vượt trội**: Ứng dụng đã chuyển đổi từ giọng đọc máy thô sơ của Google sang công nghệ **Microsoft Edge Neural TTS**, mang đến giọng đọc cực kỳ tự nhiên, nhấn nhá và chuẩn bản xứ.
*   **Bộ chọn Accent tacticle (Mỹ, Anh, Úc)**: Tích hợp bộ chọn giọng đọc dễ thương với các lá cờ quốc gia (🇺🇸 Mỹ - Nam/Nữ, 🇬🇧 Anh - Nam/Nữ, 🇦🇺 Úc - Nữ). Lựa chọn này tự động đồng bộ hóa trên toàn hệ thống và lưu trữ trong `localStorage`.
*   **Đồng bộ phản hồi lỗi**: Khi bé nhấn vào các từ vựng phát âm sai trên bảng điểm, hệ thống sẽ phát âm mẫu chuẩn xác từ đó theo đúng Accent bé đã chọn.

### 3. Bảng điểm 3D trực quan & Lộ trình sửa lỗi
*   Hệ thống chấm điểm theo sao (1-5 sao) và huy chương danh giá chuẩn Cambridge (Kim Cương, Vàng, Bạc, Đồng).
*   Gợi ý nhận xét ấm áp từ Giáo viên AI và **Lộ trình tự luyện 3 bài tập nhỏ** được thiết kế riêng biệt để giúp con khắc phục những lỗi sai vừa mắc phải.

---

## 🛠️ Công nghệ sử dụng

*   **Core**: Next.js 16 (App Router, Turbopack) & React 19.
*   **Styling**: Tailwind CSS v4 & custom tactile utilities (nút bấm 3D phong cách Duolingo, bóng nổi deco sinh động).
*   **Database**: MongoDB & Mongoose.
*   **API**: Tích hợp luồng client WebSocket Edge TTS (`edge-tts-universal`).

---

## 🚀 Hướng dẫn cài đặt & Chạy cục bộ

### 1. Chuẩn bị biến môi trường
Tạo tệp `.env.local` ở thư mục gốc của dự án và khai báo các khóa API của bạn:

```env
GROQ_API_KEY=your_groq_api_key
MISTRAL_API_KEY=your_mistral_api_key
MONGODB_URI=your_mongodb_connection_string
```

### 2. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 3. Gieo dữ liệu mẫu (Seeding Database)
Ứng dụng cung cấp sẵn một tập lệnh gieo dữ liệu để tạo nhanh tài khoản học viên nhí mẫu, các câu hỏi mẫu và lịch sử bài tập làm mẫu vào database trực tuyến/cục bộ của bạn:

```bash
node seed.js
```

### 4. Khởi chạy máy chủ phát triển
```bash
npm run dev
```
Mở trình duyệt truy cập [http://localhost:3000](http://localhost:3000) để trải nghiệm ứng dụng.

---

## ☁️ Hướng dẫn Triển khai Trực tuyến (Deployment)

Dự án này đã được tối ưu hóa hoàn hảo để triển khai trên **Vercel** và kết nối cơ sở dữ liệu đám mây **MongoDB Atlas**. 

*   *Lưu ý an toàn*: Serverless API trên Vercel có giới hạn thời gian thực thi (timeout 10 giây). Luồng xử lý Edge TTS WebSocket client của chúng ta cực kỳ nhanh chóng (~0.6 giây) nên hoạt động trơn tru trên Vercel mà không cần cấu hình thêm bất kỳ máy chủ WebSocket riêng biệt nào.
*   Xem hướng dẫn cấu hình MongoDB Atlas và Vercel chi tiết từng bước tại [Cẩm nang Triển khai (deployment_guide.md)](file:///home/okarin/.gemini/antigravity-ide/brain/3d1efd0d-b9f6-4f16-b5cc-f45509fb25db/deployment_guide.md).

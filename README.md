# SmartAir Mobile App

Ứng dụng di động theo dõi chất lượng không khí và sức khỏe, được xây dựng với React Native và Expo.

## 📱 Tính năng

- **Bản đồ tương tác**: Hiển thị các trạm quan trắc chất lượng không khí trên bản đồ với WebView và Leaflet
- **Dự báo 7 ngày**: Xem dự báo chất lượng không khí và thời tiết cho 7 ngày tới
- **Phân tích phơi nhiễm**: Thống kê mức độ phơi nhiễm PM2.5 trong quá khứ và tương lai
- **Trốn bụi cuối tuần**: Gợi ý các địa điểm có chất lượng không khí tốt trong bán kính
- **Tin tức**: Cập nhật tin tức mới nhất về chất lượng không khí
- **AI Chat**: Trợ lý AI tư vấn về chất lượng không khí và sức khỏe

## 🛠️ Công nghệ

- **React Native** 0.81.5
- **Expo** ~54.0.25
- **React Navigation** (Stack & Bottom Tabs)
- **React Native WebView** (cho bản đồ Leaflet)
- **React Native SVG** (cho biểu đồ)
- **Expo Location** (GPS)
- **OpenStreetMap Nominatim API** (tìm kiếm địa điểm)

## 📦 Cài đặt

```bash
cd frontend
npm install
```

## 🚀 Chạy ứng dụng

### Cách 1: Chạy bằng Expo Go trên điện thoại (Khuyến nghị)

Đây là cách nhanh nhất để test ứng dụng trên thiết bị thật mà không cần build.

#### Bước 1: Cài đặt Expo Go trên điện thoại

- **Android**: Tải [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) từ Google Play Store
- **iOS**: Tải [Expo Go](https://apps.apple.com/app/expo-go/id982107779) từ App Store

#### Bước 2: Khởi động development server

```bash
cd frontend
npm start
```

Sau khi chạy lệnh, bạn sẽ thấy một QR code trong terminal và một menu Expo DevTools mở trong trình duyệt.

#### Bước 3: Kết nối điện thoại với máy tính

**Cách A: Cùng mạng WiFi (Khuyến nghị)**

1. Đảm bảo điện thoại và máy tính đang kết nối cùng một mạng WiFi
2. Mở ứng dụng **Expo Go** trên điện thoại
3. Quét QR code hiển thị trong terminal hoặc trình duyệt bằng:
   - **Android**: Nhấn "Scan QR code" trong Expo Go hoặc dùng camera
   - **iOS**: Dùng camera app để quét QR code, sau đó chọn "Open in Expo Go"
4. Ứng dụng sẽ tự động tải và chạy trên điện thoại

**Cách B: Tunnel mode (Khi không cùng WiFi)**

Nếu điện thoại và máy tính không cùng mạng WiFi:

```bash
npm start -- --tunnel
```

Sau đó quét QR code như bước trên. Lưu ý: Tunnel mode có thể chậm hơn.

**Cách C: LAN mode (Nhanh nhất, cần cùng WiFi)**

```bash
npm start -- --lan
```

#### Bước 4: Sử dụng ứng dụng

- Ứng dụng sẽ tự động reload khi bạn thay đổi code
- Shake điện thoại (hoặc nhấn `Ctrl+M` trên Android, `Cmd+D` trên iOS) để mở developer menu
- Nhấn `r` trong terminal để reload app
- Nhấn `m` để toggle menu

#### Troubleshooting

**Không kết nối được:**
- Kiểm tra cả hai thiết bị đang cùng WiFi
- Tắt firewall trên máy tính
- Thử dùng tunnel mode: `npm start -- --tunnel`

**QR code không hiển thị:**
- Chạy `npm start` trong terminal (không phải trong IDE)
- Kiểm tra đã cài đặt Expo CLI: `npm install -g expo-cli`

**Lỗi "Unable to resolve module":**
- Xóa `node_modules` và cài lại: `rm -rf node_modules && npm install`
- Clear cache: `npm start -- --clear`

### Cách 2: Chạy trên Emulator/Simulator

```bash
# Khởi động Expo
npm start

# Chạy trên Android Emulator (cần Android Studio)
npm run android

# Chạy trên iOS Simulator (chỉ macOS, cần Xcode)
npm run ios

# Chạy trên Web
npm run web
```

### Cách 3: Build standalone app

Để tạo file APK/IPA để cài đặt trực tiếp:

```bash
# Cài đặt EAS CLI
npm install -g eas-cli

# Đăng nhập Expo
eas login

# Build cho Android
eas build --platform android

# Build cho iOS (cần Apple Developer account)
eas build --platform ios
```

## 📁 Cấu trúc thư mục

```
frontend/
├── src/
│   ├── components/      # Các component tái sử dụng
│   │   ├── map/        # Component bản đồ
│   │   └── ui/         # Component UI
│   ├── navigation/     # Cấu hình navigation
│   └── screens/        # Các màn hình chính
├── public/             # Assets (logo, shapefiles)
├── App.js              # Entry point
└── package.json
```

## 🗺️ Màn hình chính

1. **MapScreen**: Bản đồ với các trạm quan trắc, tìm kiếm địa điểm, GPS
2. **DetailStationScreen**: Chi tiết trạm đo với biểu đồ và dự báo
3. **AnalyticExposureScreen**: Phân tích phơi nhiễm và gợi ý trốn bụi
4. **NewsScreen**: Tin tức về chất lượng không khí
5. **AIChatScreen**: Chat với trợ lý AI

## 📝 Ghi chú

- Ứng dụng sử dụng mock data cho demo
- Bản đồ sử dụng Leaflet.js trong WebView
- Dữ liệu AQI và dự báo được tạo ngẫu nhiên
- Hỗ trợ tìm kiếm địa điểm qua OpenStreetMap Nominatim API

## 📄 License

MIT

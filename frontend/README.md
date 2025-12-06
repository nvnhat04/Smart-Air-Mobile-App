# SmartAir Mobile App - Frontend

Ứng dụng di động React Native theo dõi chất lượng không khí và sức khỏe cho Việt Nam.

## 📱 Tính năng chính

- **Bản đồ AQI Real-time**: Hiển thị chất lượng không khí trên bản đồ với heatmap và markers
- **Dự báo 48 giờ**: Xem dự báo PM2.5 và AQI cho 2 ngày tới
- **Phân tích tiếp xúc**: Theo dõi lịch sử và phân tích mức độ tiếp xúc với ô nhiễm
- **Trốn bụi thông minh**: Gợi ý 10 địa điểm có không khí tốt nhất để du lịch cuối tuần
- **AI Chat Assistant**: Hỏi đáp về chất lượng không khí và sức khỏe
- **Tin tức**: Cập nhật tin tức về môi trường và sức khỏe
- **Profile & Auth**: Đăng ký, đăng nhập, quản lý thông tin cá nhân

## 🏗️ Cấu trúc dự án

```
frontend/
├── App.js                   # Main app component
├── index.js                 # Entry point
├── package.json
├── src/
│   ├── components/          # Reusable components
│   │   ├── map/            # Map-related components
│   │   │   ├── MapWebView.js
│   │   │   └── StationBottomSheet.js
│   │   └── ui/             # UI components
│   │       └── AqiBar.js
│   ├── navigation/          # Navigation structure
│   │   ├── RootStack.js    # Stack navigator (Intro, Login, Register, MainTabs)
│   │   └── RootTabs.js     # Bottom tabs (Map, Analytics, News, AI Chat, Profile)
│   ├── screens/             # All app screens
│   │   ├── IntroScreen.js          # Onboarding (3 slides)
│   │   ├── LoginScreen.js          # User login
│   │   ├── RegisterScreen.js       # User registration
│   │   ├── MapScreen.js            # Main map view
│   │   ├── AnalyticExposureScreen.js  # Analytics & "Trốn bụi"
│   │   ├── NewsScreen.js           # News feed
│   │   ├── AIChatScreen.js         # AI assistant
│   │   ├── ProfileScreen.js        # User profile
│   │   └── DetailStationScreen.js  # Station details
│   ├── services/            # API services
│   │   ├── api.js          # Backend API calls
│   │   ├── cemApi.js       # CEM API integration
│   │   └── API_USAGE_EXAMPLES.md
│   ├── utils/               # Utility functions
│   └── hooks/               # Custom React hooks
└── public/                  # Static assets
    └── VN41HSTS.*          # Vietnam boundary shapefiles
```

## 🚀 Cài đặt & Chạy

### Yêu cầu

- Node.js >= 18
- npm hoặc yarn
- Expo CLI
- iOS Simulator / Android Emulator hoặc thiết bị thực

### Cài đặt dependencies

```bash
cd frontend
npm install
```

### Chạy ứng dụng

```bash
# Start Expo development server
npm start

# Chạy trên Android
npm run android

# Chạy trên iOS
npm run ios

# Chạy trên web
npm run web
```

### Quét QR code với Expo Go

1. Chạy `npm start`
2. Quét QR code hiển thị bằng app Expo Go trên điện thoại
3. App sẽ load trên thiết bị của bạn

## 📦 Dependencies chính

### Core
- **React Native**: `0.81.5` - Framework chính
- **Expo**: `~54.0.25` - Development platform
- **React**: `19.1.0`

### Navigation
- **@react-navigation/native**: `^7.1.22` - Navigation library
- **@react-navigation/native-stack**: `^7.8.2` - Stack navigator
- **@react-navigation/bottom-tabs**: `^7.8.8` - Bottom tabs

### UI & Maps
- **react-native-maps**: `1.20.1` - Map component
- **react-native-webview**: `13.15.0` - WebView for map tiles
- **react-native-svg**: `15.12.1` - SVG support
- **@expo/vector-icons**: `^15.0.3` - Icon library (Feather, Ionicons)

### Storage & Location
- **@react-native-async-storage/async-storage**: `^2.2.0` - Local storage
- **expo-location**: `~19.0.7` - Location services

### Forms & Utilities
- **@react-native-picker/picker**: `^2.11.4` - Picker component

## 🔌 API Integration

### Backend API (api.js)

```javascript
import * as api from './services/api';

// Authentication
await api.auth.register(email, username, password, profile);
await api.auth.login(username, password);
await api.auth.getUserProfile(uid);

// PM2.5 & AQI Data
await api.getPM25Point(lon, lat, date);          // Current PM2.5 at location
await api.getPM25Forecast(lat, lon, days);       // Forecast data
await api.getLocationStats(days);                 // Average statistics

// User Health Data
await api.saveExposure(uid, data);
await api.getExposureHistory(uid, startDate, endDate);
```

### CEM API (cemApi.js)

External API for historical AQI data from monitoring stations.

## 🎨 UI/UX Features

### Intro Screen (IntroScreen.js)
- 3 slides giới thiệu tính năng app
- Icons: wind, trending-up, heart
- Skip button và pagination dots
- Navigation to Login

### Modern Auth Screens
**LoginScreen.js:**
- Logo container với wind icon
- Show/hide password toggle (eye icon)
- KeyboardAvoidingView cho iOS/Android
- Loading states
- Vietnamese text: "Chào mừng trở lại"

**RegisterScreen.js:**
- Sections: Required info + Optional profile
- Feather icons cho tất cả inputs
- Gender picker, age, location fields
- Validation: username 3-20 ký tự, password min 6

### Analytics & "Trốn bụi" (AnalyticExposureScreen.js)
- **Tab Lịch sử**: Biểu đồ PM2.5 theo thời gian
- **Tab Dự báo**: Forecast 48 giờ với % thay đổi (↓15%, ↑20%)
- **Tab Trốn bụi**: 
  - Lazy loading (chỉ load khi active)
  - 10 địa điểm tốt nhất
  - Batch API processing (3 concurrent)
  - Hiển thị forecast AQI sau 48h
  - Tính khoảng cách từ Hà Nội (Haversine formula)

### Color Scheme
- Primary: `#3b82f6` (blue)
- Background: `#f8fafc` (light)
- Text: `#0f172a` (dark)
- Success: `#10b981` (green)
- Warning: `#f59e0b` (yellow)
- Danger: `#ef4444` (red)

## 🧮 AQI Calculation

EPA AQI formula với 6 ranges:

```javascript
function aqiToPm25(aqi) {
  if (aqi <= 50) return ((aqi - 0) / (50 - 0)) * (12.0 - 0) + 0;
  if (aqi <= 100) return ((aqi - 51) / (100 - 51)) * (35.4 - 12.1) + 12.1;
  if (aqi <= 150) return ((aqi - 101) / (150 - 101)) * (55.4 - 35.5) + 35.5;
  if (aqi <= 200) return ((aqi - 151) / (200 - 151)) * (150.4 - 55.5) + 55.5;
  if (aqi <= 300) return ((aqi - 201) / (300 - 201)) * (250.4 - 150.5) + 150.5;
  return ((aqi - 301) / (500 - 301)) * (500.4 - 250.5) + 250.5;
}
```

## ⚡ Performance Optimizations

1. **Lazy Loading**: Destinations chỉ load khi tab "Trốn bụi" được active
2. **Batch Processing**: 3 API calls đồng thời thay vì 10
3. **Caching**: `destinationsLoaded` flag để tránh reload
4. **Reduced API calls**: 20+ → 10 requests
5. **AsyncStorage**: Persist auth state

## 🌍 Localization

- Toàn bộ UI bằng tiếng Việt
- Date formatting: DD/MM/YYYY
- Distance: km
- Temperature: °C
- PM2.5: µg/m³

## 🔐 Authentication Flow

```
App Start
  ↓
IntroScreen (first launch)
  ↓
LoginScreen ←→ RegisterScreen
  ↓
MainTabs (Map, Analytics, News, AI, Profile)
  ↓
DetailStation (modal)
```

## 📱 Screens Overview

| Screen | Route | Description |
|--------|-------|-------------|
| IntroScreen | `Intro` | Onboarding 3 slides |
| LoginScreen | `Login` | User authentication |
| RegisterScreen | `Register` | New user signup |
| MapScreen | `Map` | Main AQI map view |
| AnalyticExposureScreen | `Analytics` | History, forecast, escape |
| NewsScreen | `News` | Environmental news |
| AIChatScreen | `AIChat` | AI assistant |
| ProfileScreen | `Profile` | User settings |
| DetailStationScreen | `DetailStation` | Station details modal |

## 📦 Build & Deploy APK

### Prerequisites

1. **Cài đặt EAS CLI** (Expo Application Services)
```bash
npm install -g eas-cli
```

2. **Đăng nhập Expo account**
```bash
eas login
```

3. **Configure EAS** (nếu chưa có)
```bash
eas build:configure
```

### Build APK cho Android

#### Option 1: Build trên Expo Cloud (Khuyên dùng)

**Development Build** (cho testing):
```bash
# Build APK development
eas build --platform android --profile development

# Hoặc build preview (giống production nhưng không sign)
eas build --platform android --profile preview
```

**Production Build** (cho release):
```bash
# Build APK production
eas build --platform android --profile production

# Build AAB (Android App Bundle) cho Google Play Store
eas build --platform android --profile production --type app-bundle
```

Sau khi build xong:
- Download APK từ link Expo gửi qua email hoặc terminal
- Hoặc vào https://expo.dev/accounts/nvnhat04s-organization/projects/smart-air/builds

#### Option 2: Build Local (không cần Expo server)

Cần có Android SDK và Java JDK đã cài đặt.

```bash
# Build APK local
eas build --platform android --profile preview --local

# Output: *.apk file trong thư mục hiện tại
```

### Cấu hình Build Profiles

File `eas.json` (tạo tự động sau `eas build:configure`):

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Cài đặt APK trên thiết bị

**Cách 1: USB Cable**
```bash
# Enable USB debugging trên Android device
# Kết nối device qua USB

# Install APK
adb install path/to/app.apk

# Hoặc drag & drop APK vào device rồi tap để install
```

**Cách 2: QR Code / Link**
- Expo tự động tạo QR code sau khi build
- Quét QR hoặc mở link trên device để download APK
- Install từ Downloads folder

**Cách 3: Google Drive / Cloud Storage**
- Upload APK lên Google Drive
- Share link với users
- Download và install trên device

### Environment Variables cho Build

Cập nhật `app.json`:
```json
{
  "expo": {
    "extra": {
      "backendUrl": "https://api.smartair.app",
      "authServerUrl": "https://auth.smartair.app",
      "eas": {
        "projectId": "b02aaf8b-bdc0-4f1c-a680-46f7e5da1b81"
      }
    }
  }
}
```

Hoặc dùng `.env` với `app.config.js`:
```javascript
// app.config.js
export default {
  expo: {
    extra: {
      backendUrl: process.env.BACKEND_URL,
      authServerUrl: process.env.AUTH_URL
    }
  }
}
```

### Build với Custom Config

```bash
# Build với specific app.json
eas build --platform android --profile production --non-interactive

# Build với environment variables
BACKEND_URL=https://api.smartair.app eas build -p android

# Build multiple profiles cùng lúc
eas build --platform all --profile production
```

### Update OTA (Over-The-Air)

Sau khi đã deploy APK, có thể push updates không cần rebuild:

```bash
# Update JavaScript bundle
eas update --branch production --message "Fix bugs"

# Auto update cho users khi mở app
# Cần config trong app.json:
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/b02aaf8b-bdc0-4f1c-a680-46f7e5da1b81"
    }
  }
}
```

### Signing & Keystore

**Automatic (Expo managed)**:
- Expo tự động quản lý keystore
- Suitable cho development và preview builds

**Manual (own keystore)**:
```bash
# Generate keystore
keytool -genkeypair -v -keystore my-release-key.keystore \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Configure trong eas.json
{
  "build": {
    "production": {
      "android": {
        "credentialsSource": "local"
      }
    }
  }
}
```

### Testing APK

```bash
# Install và test trên emulator
adb install app.apk
adb shell am start -n com.yourcompany.smartair/.MainActivity

# View logs
adb logcat | grep -i "ReactNative\|expo"

# Check app info
adb shell dumpsys package com.yourcompany.smartair
```

### Troubleshooting Build Issues

**Issue: Build fails with "Out of memory"**
```json
// eas.json
{
  "build": {
    "production": {
      "android": {
        "gradleCommand": ":app:assembleRelease",
        "resourceClass": "large"
      }
    }
  }
}
```

**Issue: "Module not found" trong APK**
- Clear cache: `npx expo start -c`
- Remove node_modules: `rm -rf node_modules && npm install`
- Rebuild: `eas build --platform android --clear-cache`

**Issue: APK quá lớn (>100MB)**
- Enable Hermes: `"jsEngine": "hermes"` trong `app.json`
- Enable ProGuard: Add trong `eas.json`
- Split APK by ABI: `"enableSeparateBuildPerCPUArchitecture": true`

**Issue: Backend connection fails**
- Check CORS settings trên server
- Verify `backendUrl` trong `app.json`
- Test API với Postman trước

### Best Practices

1. **Version Management**: Tăng version trong `app.json` mỗi build
```json
{
  "version": "1.0.1",
  "android": {
    "versionCode": 2
  }
}
```

2. **Build Types**:
   - `development`: Internal testing, có dev menu
   - `preview`: Beta testing, giống production
   - `production`: Release cho users

3. **Testing Checklist** trước khi release:
   - ✅ Test trên nhiều Android versions (8, 9, 10, 11, 12+)
   - ✅ Test trên nhiều screen sizes
   - ✅ Test offline mode
   - ✅ Test permissions (location, storage)
   - ✅ Test deep links và notifications
   - ✅ Check app size (<50MB khuyên dùng)
   - ✅ Test update OTA

4. **Security**:
   - Don't commit `.env` files
   - Use EAS Secrets cho sensitive data
   - Enable code obfuscation cho production

### Deploy to Google Play Store

```bash
# Build AAB (Android App Bundle)
eas build --platform android --profile production

# Submit to Play Store
eas submit -p android --latest

# Hoặc manual: Upload AAB lên Play Console
# https://play.google.com/console
```

## 🐛 Debugging

```bash
# View logs
npx expo start

# Clear cache
npx expo start -c

# Check for errors
npx expo doctor
```

## 📝 Code Standards

- **Naming**: camelCase cho variables/functions, PascalCase cho components
- **Imports**: React hooks trước, components sau, utilities cuối
- **Comments**: Tiếng Việt cho logic phức tạp
- **Icons**: Sử dụng Feather icons cho consistency
- **Colors**: Dùng hex colors từ Tailwind CSS palette

## 🚧 Known Issues

- WebView maps có thể slow trên Android low-end devices
- Forecast data có thể thiếu cho một số locations
- AsyncStorage size limit (6MB trên iOS)

## 📄 License

MIT License

## 👥 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

- Documentation: `/src/services/API_USAGE_EXAMPLES.md`
- Issues: GitHub Issues
- API Docs: Backend `/docs` endpoint

# PWA (Progressive Web App) Setup

This frontend application has been configured as a Progressive Web App (PWA) with the following features:

## 🚀 PWA Features

### ✅ **Core PWA Features**
- **Service Worker**: Offline functionality and caching
- **Web App Manifest**: App-like experience with proper icons and metadata
- **Install Prompt**: Users can install the app on their devices
- **Offline Support**: Works without internet connection
- **Auto Updates**: Automatic service worker updates

### 🎨 **Visual & UX Features**
- **App Icons**: Multiple sizes generated from `/src/assets/images/logo.png`
- **Splash Screen**: Custom splash screen for app launch
- **Theme Colors**: Consistent branding with blue theme (#3b82f6)
- **RTL Support**: Full Arabic RTL support
- **Responsive Design**: Works on all device sizes

### 📱 **Mobile Features**
- **Standalone Mode**: App runs in full-screen mode
- **Home Screen Icon**: Custom icon on device home screen
- **App Shortcuts**: Quick access to main features
- **Touch Optimized**: Optimized for touch interactions

## 🛠️ **Setup & Configuration**

### **Icons Generation**
Icons are automatically generated from the logo file:
```bash
npm run generate-icons
```

This creates icons in multiple sizes:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

### **Build Process**
To build the PWA with icons:
```bash
npm run pwa:build
```

### **Development**
For development with PWA features:
```bash
npm run dev
```

## 📋 **PWA Manifest Features**

### **App Information**
- **Name**: نظام الإدارة - Urux
- **Short Name**: الإدارة
- **Description**: نظام إدارة التفعيل والتراخيص
- **Language**: Arabic (ar)
- **Direction**: RTL

### **Display Settings**
- **Display Mode**: Standalone (full-screen app)
- **Orientation**: Portrait primary
- **Theme Color**: #3b82f6 (blue)
- **Background Color**: #ffffff (white)

### **App Shortcuts**
1. **لوحة التحكم** - Dashboard
2. **إدارة المستخدمين** - User Management
3. **رموز التفعيل** - Activation Codes

## 🔧 **Service Worker Features**

### **Caching Strategy**
- **Static Assets**: Cache-first for images, CSS, JS
- **Fonts**: Cache-first for Google Fonts
- **API Calls**: Network-first with 5-minute cache
- **HTML**: Network-first for app shell

### **Offline Support**
- **App Shell**: Core app loads offline
- **Cached Data**: Previously viewed data available offline
- **Background Sync**: Queues actions when offline

## 📱 **Installation**

### **For Users**
1. Visit the app in a supported browser (Chrome, Edge, Safari)
2. Look for the install prompt or use browser menu
3. Click "Install" to add to home screen
4. App will launch in standalone mode

### **For Developers**
1. Build the app: `npm run pwa:build`
2. Deploy to HTTPS server (required for PWA)
3. Test installation on various devices

## 🧪 **Testing PWA Features**

### **Chrome DevTools**
1. Open DevTools (F12)
2. Go to "Application" tab
3. Check "Manifest" and "Service Workers" sections
4. Use "Lighthouse" for PWA audit

### **Mobile Testing**
1. Use Chrome DevTools device simulation
2. Test on actual mobile devices
3. Verify installation prompts
4. Test offline functionality

## 🔄 **Update Process**

### **Automatic Updates**
- Service worker automatically checks for updates
- Users see update notification
- One-click update process
- Seamless app updates

### **Manual Updates**
- Users can manually refresh to get updates
- Update prompts appear when new version is available
- Graceful update handling

## 📊 **PWA Metrics**

### **Performance**
- Fast loading with caching
- Optimized bundle sizes
- Efficient service worker
- Minimal network requests

### **User Experience**
- App-like feel
- Smooth animations
- Responsive design
- Offline functionality

## 🚨 **Troubleshooting**

### **Common Issues**
1. **Icons not showing**: Run `npm run generate-icons`
2. **Install prompt not appearing**: Check HTTPS and manifest
3. **Service worker not registering**: Check browser console
4. **Offline not working**: Verify caching strategy

### **Debug Commands**
```bash
# Generate icons
npm run generate-icons

# Build PWA
npm run pwa:build

# Check PWA status
# Use Chrome DevTools > Application > Manifest
```

## 📚 **Resources**

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

---

**Note**: PWA features require HTTPS in production. For development, localhost is allowed.

# 🐾 SpeedyPaws

A cute, minimal Chrome extension for controlling YouTube playback speed with smart features.

![SpeedyPaws](./docs/preview.png)

## ✨ Features

- **Speed Control**: Adjust playback speed from 0.1x to 5x
- **Cute Floating Controller**: Draggable overlay on YouTube videos
- **Keyboard Shortcuts**: 
  - `Shift + .` (>) - Increase speed
  - `Shift + ,` (<) - Decrease speed
- **Speed Memory**: Remember speed per channel and per video
- **Speed Profiles**: Quick presets for Study, Chill, and Review modes
- **Smart Speed Mode**: Auto-adjusts based on content (experimental)
- **Beautiful UI**: Pastel-themed popup with smooth animations

## 🚀 Installation

### Development Build

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the extension**:
   ```bash
   npm run build
   ```

3. **Load in Chrome**:
   - Open `chrome://extensions`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the `dist` folder

### Development Mode

For development with auto-rebuild:
```bash
npm run dev
```

## 📁 Project Structure

```
SpeedyPaws/
├── src/
│   ├── content/           # Content scripts (injected into YouTube)
│   │   ├── content.ts     # Main content script entry
│   │   ├── overlayUI.ts   # Floating controller UI
│   │   └── speedController.ts  # Video speed control logic
│   ├── background/
│   │   └── background.ts  # Service worker (handles commands)
│   ├── popup/
│   │   └── popup.ts       # Popup UI logic
│   └── types.ts           # Shared TypeScript types
├── public/
│   ├── manifest.json      # Extension manifest (MV3)
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Popup styles
│   ├── content.css        # Content script styles
│   └── icons/             # Extension icons
├── scripts/
│   └── build.js           # Post-build script
├── vite.config.ts         # Vite bundler config
├── tsconfig.json          # TypeScript config
└── package.json
```

## 🎨 UI Features

### Popup Interface
- Current speed display with gradient text
- Slider control with pastel gradient track
- Quick preset buttons (0.5x, 1x, 1.5x, 2x, 3x)
- Speed profiles: Study (0.75x), Chill (1x), Review (1.75x)
- Toggle switches for smart features

### Overlay Controller
- Draggable floating panel
- Remembers position across sessions
- Smooth animations
- Non-intrusive design

## ⚙️ Configuration

### Speed Profiles

| Profile | Speed | Use Case |
|---------|-------|----------|
| 📚 Study | 0.75x | Detailed learning |
| ☕ Chill | 1.0x | Normal viewing |
| ⚡ Review | 1.75x | Quick review |

### Settings

- **Smart Speed Mode**: Automatically adjusts speed based on speech density
- **Remember per channel**: Save speed preferences for each channel
- **Remember per video**: Save speed preferences for individual videos
- **Show overlay**: Toggle the floating controller visibility

## 🔧 Technical Details

- **Manifest Version**: V3
- **Permissions**: 
  - `storage` - Save preferences
  - `activeTab` - Access current tab
  - `scripting` - Inject content scripts
- **Host Permissions**: `*://*.youtube.com/*`

## 📝 Development Notes

### Building TypeScript
The project uses Vite for bundling TypeScript. Each entry point is compiled separately:
- `content.ts` → `content.js`
- `background.ts` → `background.js`
- `popup.ts` → `popup.js`

### Messaging Architecture
```
┌─────────┐     ┌────────────┐     ┌─────────────┐
│  Popup  │────▶│ Background │────▶│ Content     │
│         │◀────│ (Service)  │◀────│ Script      │
└─────────┘     └────────────┘     └─────────────┘
```

### Storage Schema
```typescript
interface SpeedyPawsSettings {
  smartSpeedEnabled: boolean;
  rememberChannel: boolean;
  rememberVideo: boolean;
  showOverlay: boolean;
  currentProfile: 'study' | 'chill' | 'review' | 'custom';
  defaultSpeed: number;
  profiles: { study: number; chill: number; review: number };
  channelSpeeds: Record<string, number>;
  videoSpeeds: Record<string, number>;
  overlayPosition: { x: number; y: number };
}
```

## 🐛 Troubleshooting

### Extension not working on YouTube
1. Refresh the YouTube page after installing
2. Check if the extension is enabled in `chrome://extensions`
3. Look for errors in the browser console

### Keyboard shortcuts not working
1. Go to `chrome://extensions/shortcuts`
2. Verify SpeedyPaws shortcuts are configured
3. Check for conflicts with other extensions

### Overlay not showing
1. Click the extension icon and enable "Show overlay"
2. Refresh the YouTube page

## 📄 License

MIT License - feel free to use and modify!

---

Made with 💕 and 🐾 by SpeedyPaws


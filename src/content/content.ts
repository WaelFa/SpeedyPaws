/**
 * SpeedyPaws Content Script
 * Main entry point for the YouTube content script
 * Initializes speed controller and overlay UI
 */

import {
  SpeedyPawsSettings,
  Message,
  SpeedChangePayload,
  SpeedProfile
} from '../types';
import { getSpeedController, SpeedController } from './speedController';
import { OverlayUI } from './overlayUI';

// Default settings
const DEFAULT_SETTINGS: SpeedyPawsSettings = {
  smartSpeedEnabled: false,
  rememberChannel: true,
  rememberVideo: true,
  showOverlay: true,
  currentProfile: 'custom',
  defaultSpeed: 1.0,
  profiles: {
    study: 0.75,
    chill: 1.0,
    review: 1.75,
  },
  channelSpeeds: {},
  videoSpeeds: {},
  overlayPosition: { x: 20, y: 80 },
};

class SpeedyPawsContent {
  private controller: SpeedController;
  private overlay: OverlayUI | null = null;
  private settings: SpeedyPawsSettings = DEFAULT_SETTINGS;
  private currentVideoId: string | null = null;
  private initRetries: number = 0;
  private maxRetries: number = 10;

  constructor() {
    this.controller = getSpeedController();
    this.init();
  }

  /**
   * Initialize the content script
   */
  private async init(): Promise<void> {
    console.log('[SpeedyPaws] 🐾 Initializing...');

    // Load settings
    await this.loadSettings();

    // Wait for YouTube to fully load
    await this.waitForYouTube();

    // Initialize overlay if enabled
    if (this.settings.showOverlay) {
      this.overlay = new OverlayUI(this.controller);
    }

    // Setup message listener
    this.setupMessageListener();

    // Watch for video changes
    this.watchForVideoChanges();

    // Apply saved speed for current video/channel
    this.applyRememberedSpeed();

    // Setup smart speed if enabled
    this.controller.setSmartSpeedEnabled(this.settings.smartSpeedEnabled);

    console.log('[SpeedyPaws] 🐾 Initialized successfully!');
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['speedyPawsSettings'], (result) => {
        if (result.speedyPawsSettings) {
          this.settings = { ...DEFAULT_SETTINGS, ...result.speedyPawsSettings };
        }
        resolve();
      });
    });
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ speedyPawsSettings: this.settings }, resolve);
    });
  }

  /**
   * Wait for YouTube video player to load
   */
  private async waitForYouTube(): Promise<void> {
    return new Promise((resolve) => {
      const check = (): void => {
        const video = document.querySelector('video.html5-main-video');
        if (video) {
          resolve();
        } else if (this.initRetries < this.maxRetries) {
          this.initRetries++;
          setTimeout(check, 500);
        } else {
          console.warn('[SpeedyPaws] Could not find video element');
          resolve();
        }
      };
      check();
    });
  }

  /**
   * Setup message listener for popup/background communication
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true; // Keep channel open for async response
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(
    message: Message, 
    sendResponse: (response: unknown) => void
  ): void {
    switch (message.type) {
      case 'GET_SPEED':
        sendResponse({ speed: this.controller.getSpeed() });
        break;

      case 'SET_SPEED':
        const speedPayload = message.payload as SpeedChangePayload;
        this.controller.setSpeed(speedPayload.speed);
        this.rememberSpeed(speedPayload.speed);
        sendResponse({ success: true });
        break;

      case 'INCREASE_SPEED':
        this.controller.increaseSpeed();
        this.rememberSpeed(this.controller.getSpeed());
        sendResponse({ speed: this.controller.getSpeed() });
        break;

      case 'DECREASE_SPEED':
        this.controller.decreaseSpeed();
        this.rememberSpeed(this.controller.getSpeed());
        sendResponse({ speed: this.controller.getSpeed() });
        break;

      case 'GET_SETTINGS':
        sendResponse({ settings: this.settings });
        break;

      case 'UPDATE_SETTINGS':
        const newSettings = message.payload as Partial<SpeedyPawsSettings>;
        this.updateSettings(newSettings);
        sendResponse({ success: true });
        break;

      case 'SET_PROFILE':
        const profile = message.payload as SpeedProfile;
        this.setProfile(profile);
        sendResponse({ success: true });
        break;

      case 'TOGGLE_OVERLAY':
        this.toggleOverlay();
        sendResponse({ visible: this.overlay?.getIsVisible() ?? false });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  }

  /**
   * Update settings
   */
  private async updateSettings(newSettings: Partial<SpeedyPawsSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();

    // Apply settings changes
    if (newSettings.showOverlay !== undefined) {
      if (newSettings.showOverlay && !this.overlay) {
        this.overlay = new OverlayUI(this.controller);
      } else if (!newSettings.showOverlay && this.overlay) {
        this.overlay.hide();
      }
    }

    if (newSettings.smartSpeedEnabled !== undefined) {
      this.controller.setSmartSpeedEnabled(newSettings.smartSpeedEnabled);
    }
  }

  /**
   * Set speed profile
   */
  private setProfile(profile: SpeedProfile): void {
    this.settings.currentProfile = profile;
    
    if (profile !== 'custom') {
      const profileSpeed = this.settings.profiles[profile];
      this.controller.setSpeed(profileSpeed);
    }
    
    this.overlay?.setProfile(profile);
    this.saveSettings();
  }

  /**
   * Toggle overlay visibility
   */
  private toggleOverlay(): void {
    if (this.overlay) {
      this.overlay.toggle();
    } else if (this.settings.showOverlay) {
      this.overlay = new OverlayUI(this.controller);
    }
  }

  /**
   * Watch for YouTube navigation (SPA)
   */
  private watchForVideoChanges(): void {
    // Listen for URL changes (YouTube is a SPA)
    let lastUrl = location.href;
    
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        this.handleVideoChange();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also listen for yt-navigate-finish event
    document.addEventListener('yt-navigate-finish', () => {
      this.handleVideoChange();
    });
  }

  /**
   * Handle video change
   */
  private handleVideoChange(): void {
    const videoInfo = this.controller.getVideoInfo();
    
    if (videoInfo && videoInfo.videoId !== this.currentVideoId) {
      this.currentVideoId = videoInfo.videoId;
      console.log('[SpeedyPaws] Video changed:', videoInfo.title);
      
      // Apply remembered speed for new video
      this.applyRememberedSpeed();

      // Notify background script
      chrome.runtime.sendMessage({
        type: 'VIDEO_CHANGED',
        payload: videoInfo,
      });
    }
  }

  /**
   * Apply remembered speed for current video/channel
   */
  private applyRememberedSpeed(): void {
    const videoInfo = this.controller.getVideoInfo();
    if (!videoInfo) return;

    let speedToApply = this.settings.defaultSpeed;

    // Check video-specific speed first
    if (this.settings.rememberVideo && this.settings.videoSpeeds[videoInfo.videoId]) {
      speedToApply = this.settings.videoSpeeds[videoInfo.videoId];
      console.log(`[SpeedyPaws] Applying video speed: ${speedToApply}x`);
    }
    // Then check channel-specific speed
    else if (this.settings.rememberChannel && this.settings.channelSpeeds[videoInfo.channelId]) {
      speedToApply = this.settings.channelSpeeds[videoInfo.channelId];
      console.log(`[SpeedyPaws] Applying channel speed: ${speedToApply}x`);
    }
    // Apply profile speed if set
    else if (this.settings.currentProfile !== 'custom') {
      speedToApply = this.settings.profiles[this.settings.currentProfile];
      console.log(`[SpeedyPaws] Applying profile speed: ${speedToApply}x`);
    }

    this.controller.setSpeed(speedToApply);
  }

  /**
   * Remember speed for current video/channel
   */
  private rememberSpeed(speed: number): void {
    const videoInfo = this.controller.getVideoInfo();
    if (!videoInfo) return;

    // Remember for video
    if (this.settings.rememberVideo) {
      this.settings.videoSpeeds[videoInfo.videoId] = speed;
    }

    // Remember for channel
    if (this.settings.rememberChannel) {
      this.settings.channelSpeeds[videoInfo.channelId] = speed;
    }

    // Update default if no profile active
    if (this.settings.currentProfile === 'custom') {
      this.settings.defaultSpeed = speed;
    }

    this.saveSettings();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SpeedyPawsContent());
} else {
  new SpeedyPawsContent();
}


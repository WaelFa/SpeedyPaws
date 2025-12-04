/**
 * SpeedyPaws Popup Script
 * Handles popup UI interactions and communication with content script
 */

import { 
  SpeedyPawsSettings, 
  DEFAULT_SETTINGS, 
  Message, 
  SpeedProfile,
  MIN_SPEED,
  MAX_SPEED,
  SPEED_STEP
} from '../types';

class PopupController {
  private settings: SpeedyPawsSettings = DEFAULT_SETTINGS;
  private currentSpeed: number = 1.0;

  // DOM Elements
  private speedDisplay!: HTMLElement;
  private speedSlider!: HTMLInputElement;
  private decreaseBtn!: HTMLButtonElement;
  private increaseBtn!: HTMLButtonElement;
  private presetBtns!: NodeListOf<HTMLButtonElement>;
  private profileBtns!: NodeListOf<HTMLButtonElement>;
  private smartSpeedToggle!: HTMLInputElement;
  private rememberChannelToggle!: HTMLInputElement;
  private rememberVideoToggle!: HTMLInputElement;
  private showOverlayToggle!: HTMLInputElement;

  constructor() {
    this.init();
  }

  /**
   * Initialize the popup
   */
  private async init(): Promise<void> {
    // Cache DOM elements
    this.cacheDOMElements();
    
    // Load settings and current speed
    await this.loadData();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Update UI
    this.updateUI();
  }

  /**
   * Cache DOM element references
   */
  private cacheDOMElements(): void {
    this.speedDisplay = document.getElementById('currentSpeed')!;
    this.speedSlider = document.getElementById('speedSlider') as HTMLInputElement;
    this.decreaseBtn = document.getElementById('decreaseSpeed') as HTMLButtonElement;
    this.increaseBtn = document.getElementById('increaseSpeed') as HTMLButtonElement;
    this.presetBtns = document.querySelectorAll('.preset-btn');
    this.profileBtns = document.querySelectorAll('.profile-btn');
    this.smartSpeedToggle = document.getElementById('smartSpeedToggle') as HTMLInputElement;
    this.rememberChannelToggle = document.getElementById('rememberChannelToggle') as HTMLInputElement;
    this.rememberVideoToggle = document.getElementById('rememberVideoToggle') as HTMLInputElement;
    this.showOverlayToggle = document.getElementById('showOverlayToggle') as HTMLInputElement;
  }

  /**
   * Load settings and current speed from storage/content script
   */
  private async loadData(): Promise<void> {
    // Load settings from storage
    const settingsResult = await chrome.storage.local.get(['speedyPawsSettings']);
    if (settingsResult.speedyPawsSettings) {
      this.settings = { ...DEFAULT_SETTINGS, ...settingsResult.speedyPawsSettings };
    }

    // Get current speed from content script
    try {
      const response = await this.sendToContent({ type: 'GET_SPEED' });
      if (response?.speed) {
        this.currentSpeed = response.speed;
      }
    } catch {
      // No active YouTube tab, use default
      this.currentSpeed = this.settings.defaultSpeed;
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Speed slider
    this.speedSlider.addEventListener('input', () => {
      const speed = parseFloat(this.speedSlider.value);
      this.setSpeed(speed);
    });

    // Decrease button
    this.decreaseBtn.addEventListener('click', () => {
      this.adjustSpeed(-SPEED_STEP);
    });

    // Increase button
    this.increaseBtn.addEventListener('click', () => {
      this.adjustSpeed(SPEED_STEP);
    });

    // Preset buttons
    this.presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const speed = parseFloat(btn.dataset.speed || '1');
        this.setSpeed(speed);
      });
    });

    // Profile buttons
    this.profileBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const profile = btn.dataset.profile as SpeedProfile;
        this.setProfile(profile);
      });
    });

    // Toggle switches
    this.smartSpeedToggle.addEventListener('change', () => {
      this.updateSetting('smartSpeedEnabled', this.smartSpeedToggle.checked);
    });

    this.rememberChannelToggle.addEventListener('change', () => {
      this.updateSetting('rememberChannel', this.rememberChannelToggle.checked);
    });

    this.rememberVideoToggle.addEventListener('change', () => {
      this.updateSetting('rememberVideo', this.rememberVideoToggle.checked);
    });

    this.showOverlayToggle.addEventListener('change', () => {
      this.updateSetting('showOverlay', this.showOverlayToggle.checked);
    });
  }

  /**
   * Update UI to reflect current state
   */
  private updateUI(): void {
    // Speed display
    this.speedDisplay.textContent = this.currentSpeed.toFixed(1);
    this.speedSlider.value = this.currentSpeed.toString();

    // Preset buttons
    this.presetBtns.forEach((btn) => {
      const presetSpeed = parseFloat(btn.dataset.speed || '1');
      btn.classList.toggle('active', Math.abs(presetSpeed - this.currentSpeed) < 0.05);
    });

    // Profile buttons
    this.profileBtns.forEach((btn) => {
      const profile = btn.dataset.profile as SpeedProfile;
      btn.classList.toggle('active', profile === this.settings.currentProfile);
    });

    // Toggles
    this.smartSpeedToggle.checked = this.settings.smartSpeedEnabled;
    this.rememberChannelToggle.checked = this.settings.rememberChannel;
    this.rememberVideoToggle.checked = this.settings.rememberVideo;
    this.showOverlayToggle.checked = this.settings.showOverlay;
  }

  /**
   * Set playback speed
   */
  private async setSpeed(speed: number): Promise<void> {
    // Clamp speed
    speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
    speed = Math.round(speed * 10) / 10;

    this.currentSpeed = speed;
    this.settings.currentProfile = 'custom';
    this.updateUI();

    // Send to content script
    try {
      await this.sendToContent({ 
        type: 'SET_SPEED', 
        payload: { speed } 
      });
    } catch {
      // No active YouTube tab
    }
  }

  /**
   * Adjust speed by delta
   */
  private async adjustSpeed(delta: number): Promise<void> {
    const newSpeed = this.currentSpeed + delta;
    await this.setSpeed(newSpeed);
  }

  /**
   * Set speed profile
   */
  private async setProfile(profile: SpeedProfile): Promise<void> {
    this.settings.currentProfile = profile;
    
    // Apply profile speed
    const profileSpeed = this.settings.profiles[profile];
    this.currentSpeed = profileSpeed;
    
    this.updateUI();

    // Update settings in storage
    await this.saveSettings();

    // Send to content script
    try {
      await this.sendToContent({ 
        type: 'SET_PROFILE', 
        payload: profile 
      });
    } catch {
      // No active YouTube tab
    }
  }

  /**
   * Update a single setting
   */
  private async updateSetting<K extends keyof SpeedyPawsSettings>(
    key: K, 
    value: SpeedyPawsSettings[K]
  ): Promise<void> {
    this.settings[key] = value;
    await this.saveSettings();

    // Send to content script
    try {
      await this.sendToContent({ 
        type: 'UPDATE_SETTINGS', 
        payload: { [key]: value } 
      });
    } catch {
      // No active YouTube tab
    }
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    await chrome.storage.local.set({ speedyPawsSettings: this.settings });
  }

  /**
   * Send message to content script in active tab
   */
  private async sendToContent(message: Message): Promise<Record<string, unknown> | null> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id || !tab.url?.includes('youtube.com')) {
        return null;
      }

      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id!, message, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Could not send message:', chrome.runtime.lastError.message || chrome.runtime.lastError);
            resolve(null);
          } else {
            resolve(response as Record<string, unknown>);
          }
        });
      });
    } catch (error) {
      console.warn('Error sending message to content script:', error);
      return null;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});


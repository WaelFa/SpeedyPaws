/**
 * SpeedyPaws Speed Controller
 * Handles YouTube video playback speed manipulation
 */

// Speed bounds
const MIN_SPEED = 0.1;
const MAX_SPEED = 5.0;
const SPEED_STEP = 0.1;

export class SpeedController {
  private video: HTMLVideoElement | null = null;
  private currentSpeed: number = 1.0;
  private observers: ((speed: number) => void)[] = [];
  private videoObserver: MutationObserver | null = null;
  private smartSpeedEnabled: boolean = false;
  private smartSpeedInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initialize the speed controller
   */
  private init(): void {
    this.findVideo();
    this.setupVideoObserver();
    this.setupKeyboardShortcuts();
  }

  /**
   * Find the YouTube video element
   */
  private findVideo(): HTMLVideoElement | null {
    this.video = document.querySelector('video.html5-main-video') as HTMLVideoElement;
    
    if (this.video) {
      // Sync current speed with video
      this.currentSpeed = this.video.playbackRate;
      
      // Listen for external speed changes
      this.video.addEventListener('ratechange', () => {
        if (this.video) {
          this.currentSpeed = this.video.playbackRate;
          this.notifyObservers();
        }
      });
    }
    
    return this.video;
  }

  /**
   * Setup observer to watch for video element changes
   */
  private setupVideoObserver(): void {
    this.videoObserver = new MutationObserver(() => {
      if (!this.video || !document.contains(this.video)) {
        this.findVideo();
        if (this.video) {
          this.setSpeed(this.currentSpeed);
        }
      }
    });

    this.videoObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Setup keyboard shortcuts (Shift + . / ,)
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // Only handle if not typing in input
      if (this.isTyping(e)) return;

      if (e.shiftKey && e.key === '>') {
        e.preventDefault();
        this.increaseSpeed();
      } else if (e.shiftKey && e.key === '<') {
        e.preventDefault();
        this.decreaseSpeed();
      }
    });
  }

  /**
   * Check if user is typing in an input field
   */
  private isTyping(e: KeyboardEvent): boolean {
    const target = e.target as HTMLElement;
    return (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    );
  }

  /**
   * Set playback speed
   */
  setSpeed(speed: number): void {
    // Clamp speed to valid range
    speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
    speed = Math.round(speed * 10) / 10; // Round to 1 decimal

    if (!this.video) {
      this.findVideo();
    }

    if (this.video) {
      this.video.playbackRate = speed;
      this.currentSpeed = speed;
      this.notifyObservers();
    }
  }

  /**
   * Get current playback speed
   */
  getSpeed(): number {
    if (this.video) {
      this.currentSpeed = this.video.playbackRate;
    }
    return this.currentSpeed;
  }

  /**
   * Increase speed by step
   */
  increaseSpeed(): void {
    this.setSpeed(this.currentSpeed + SPEED_STEP);
  }

  /**
   * Decrease speed by step
   */
  decreaseSpeed(): void {
    this.setSpeed(this.currentSpeed - SPEED_STEP);
  }

  /**
   * Register observer for speed changes
   */
  onSpeedChange(callback: (speed: number) => void): void {
    this.observers.push(callback);
  }

  /**
   * Notify all observers of speed change
   */
  private notifyObservers(): void {
    this.observers.forEach(callback => callback(this.currentSpeed));
  }

  /**
   * Get current video info from YouTube page
   */
  getVideoInfo(): VideoInfo | null {
    try {
      // Get video ID from URL
      const urlParams = new URLSearchParams(window.location.search);
      const videoId = urlParams.get('v');
      
      if (!videoId) return null;

      // Get channel info
      const channelLink = document.querySelector(
        '#channel-name a, ytd-channel-name a, #owner-name a'
      ) as HTMLAnchorElement;
      
      const channelName = channelLink?.textContent?.trim() || 'Unknown';
      const channelHref = channelLink?.href || '';
      const channelId = this.extractChannelId(channelHref);

      // Get video title
      const titleElement = document.querySelector(
        'h1.ytd-video-primary-info-renderer, h1.ytd-watch-metadata'
      );
      const title = titleElement?.textContent?.trim() || 'Unknown';

      return {
        videoId,
        channelId,
        channelName,
        title,
      };
    } catch (error) {
      console.error('[SpeedyPaws] Error getting video info:', error);
      return null;
    }
  }

  /**
   * Extract channel ID from URL
   */
  private extractChannelId(href: string): string {
    try {
      const match = href.match(/\/(channel|c|user|@)\/([^/?]+)/);
      return match ? match[2] : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Enable/disable smart speed mode
   * Smart speed adjusts playback based on audio analysis
   */
  setSmartSpeedEnabled(enabled: boolean): void {
    this.smartSpeedEnabled = enabled;
    
    if (enabled) {
      this.startSmartSpeed();
    } else {
      this.stopSmartSpeed();
    }
  }

  /**
   * Start smart speed analysis
   * This is a simplified implementation that adjusts speed based on
   * whether the video is likely showing speech (could be enhanced with actual audio analysis)
   */
  private startSmartSpeed(): void {
    if (this.smartSpeedInterval) return;

    // Simplified smart speed: check video duration vs current time
    // In a real implementation, this would use Web Audio API for speech detection
    this.smartSpeedInterval = setInterval(() => {
      if (!this.video || !this.smartSpeedEnabled) return;

      // Simple heuristic: videos with longer still frames likely have less speech
      // This is a placeholder for actual speech density detection
      const suggestedSpeed = this.calculateSmartSpeed();
      if (Math.abs(suggestedSpeed - this.currentSpeed) > 0.2) {
        // Gradually adjust speed
        const newSpeed = this.currentSpeed + (suggestedSpeed > this.currentSpeed ? 0.1 : -0.1);
        this.setSpeed(Math.round(newSpeed * 10) / 10);
      }
    }, 5000);
  }

  /**
   * Calculate suggested speed based on content analysis
   */
  private calculateSmartSpeed(): number {
    // Placeholder implementation
    // In a full implementation, this would:
    // 1. Analyze audio waveform for speech patterns
    // 2. Detect silent/music sections
    // 3. Adjust speed accordingly
    return 1.0;
  }

  /**
   * Stop smart speed analysis
   */
  private stopSmartSpeed(): void {
    if (this.smartSpeedInterval) {
      clearInterval(this.smartSpeedInterval);
      this.smartSpeedInterval = null;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopSmartSpeed();
    if (this.videoObserver) {
      this.videoObserver.disconnect();
    }
    this.observers = [];
  }
}

// Singleton instance
let controller: SpeedController | null = null;

export function getSpeedController(): SpeedController {
  if (!controller) {
    controller = new SpeedController();
  }
  return controller;
}


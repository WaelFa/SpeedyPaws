/**
 * SpeedyPaws Overlay UI
 * Creates and manages the floating speed controller overlay on YouTube
 */

import { MIN_SPEED, MAX_SPEED, SpeedProfile } from '../types';
import { SpeedController } from './speedController';

export class OverlayUI {
  private controller: SpeedController;
  private container: HTMLDivElement | null = null;
  private toast: HTMLDivElement | null = null;
  private isDragging: boolean = false;
  private dragOffset = { x: 0, y: 0 };
  private position = { x: 20, y: 80 };
  private isVisible: boolean = true;
  private currentProfile: SpeedProfile = 'custom';
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(controller: SpeedController) {
    this.controller = controller;
    this.init();
  }

  /**
   * Initialize the overlay UI
   */
  private init(): void {
    this.loadPosition();
    this.createOverlay();
    this.createToast();
    this.setupEventListeners();
    
    // Listen for speed changes
    this.controller.onSpeedChange((speed) => {
      this.updateSpeedDisplay(speed);
      this.showToast(speed);
    });
  }

  /**
   * Load saved position from storage
   */
  private loadPosition(): void {
    chrome.storage.local.get(['overlayPosition'], (result) => {
      if (result.overlayPosition) {
        this.position = result.overlayPosition;
        this.updatePosition();
      }
    });
  }

  /**
   * Save position to storage
   */
  private savePosition(): void {
    chrome.storage.local.set({ overlayPosition: this.position });
  }

  /**
   * Create the main overlay container
   */
  private createOverlay(): void {
    this.container = document.createElement('div');
    this.container.className = 'speedypaws-controller entering';
    this.container.innerHTML = this.getOverlayHTML();
    
    document.body.appendChild(this.container);
    this.updatePosition();
    
    // Remove entering class after animation
    setTimeout(() => {
      this.container?.classList.remove('entering');
    }, 300);
  }

  /**
   * Get overlay HTML template
   */
  private getOverlayHTML(): string {
    const currentSpeed = this.controller.getSpeed();
    
    return `
      <div class="speedypaws-header">
        <span class="speedypaws-paw" aria-label="Paw logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 100 100" fill="url(#gradAsset)" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="gradAsset" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#FF8FAB"/>
                <stop offset="100%" style="stop-color:#B19CD9"/>
              </linearGradient>
            </defs>
            <path d="M50 55 C35 55, 25 65, 25 78 C25 88, 38 95, 50 95 C62 95, 75 88, 75 78 C75 65, 65 55, 50 55 Z"/>
            <ellipse cx="28" cy="45" rx="10" ry="12" transform="rotate(-20 28 45)"/>
            <ellipse cx="50" cy="35" rx="11" ry="13"/>
            <ellipse cx="72" cy="45" rx="10" ry="12" transform="rotate(20 72 45)"/>
          </svg>
        </span>
        <span class="speedypaws-title">SpeedyPaws</span>
        <button class="speedypaws-close" title="Hide controller">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
            <line x1="4" y1="4" x2="14" y2="14" stroke="#8B8798" stroke-width="2" stroke-linecap="round"/>
            <line x1="14" y1="4" x2="4" y2="14" stroke="#8B8798" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      
      <div class="speedypaws-speed-display">
        <span class="speedypaws-speed-value">${currentSpeed.toFixed(1)}</span>
        <span class="speedypaws-speed-suffix">x</span>
      </div>
      
      <div class="speedypaws-controls">
        <button class="speedypaws-btn speedypaws-btn-decrease" title="Decrease speed (Shift + ,)">−</button>
        <input 
          type="range" 
          class="speedypaws-slider" 
          min="${MIN_SPEED}" 
          max="${MAX_SPEED}" 
          step="0.1" 
          value="${currentSpeed}"
        >
        <button class="speedypaws-btn speedypaws-btn-increase" title="Increase speed (Shift + .)">+</button>
      </div>
      
      <div class="speedypaws-presets">
        <button class="speedypaws-preset ${currentSpeed === 0.5 ? 'active' : ''}" data-speed="0.5">0.5x</button>
        <button class="speedypaws-preset ${currentSpeed === 1.0 ? 'active' : ''}" data-speed="1">1x</button>
        <button class="speedypaws-preset ${currentSpeed === 1.5 ? 'active' : ''}" data-speed="1.5">1.5x</button>
        <button class="speedypaws-preset ${currentSpeed === 2.0 ? 'active' : ''}" data-speed="2">2x</button>
      </div>
    `;
  }

  /**
   * Create toast notification element
   */
  private createToast(): void {
    this.toast = document.createElement('div');
    this.toast.className = 'speedypaws-toast';
    this.toast.innerHTML = `
      <span class="speedypaws-toast-paw">
        <svg width="16" height="16" viewBox="0 0 100 100" fill="url(#gradAsset)" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="gradAsset" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#F472B6"/>
              <stop offset="100%" style="stop-color:#A78BFA"/>
            </linearGradient>
          </defs>
          <path d="M50 55 C35 55, 25 65, 25 78 C25 88, 38 95, 50 95 C62 95, 75 88, 75 78 C75 65, 65 55, 50 55 Z"/>
          <ellipse cx="28" cy="45" rx="10" ry="12" transform="rotate(-20 28 45)"/>
          <ellipse cx="50" cy="35" rx="11" ry="13"/>
          <ellipse cx="72" cy="45" rx="10" ry="12" transform="rotate(20 72 45)"/>
        </svg>
      </span>
      <span>Speed: </span>
      <span class="speedypaws-toast-speed">1.0x</span>
    `;
    document.body.appendChild(this.toast);
  }

  /**
   * Setup event listeners for the overlay
   */
  private setupEventListeners(): void {
    if (!this.container) return;

    // Drag functionality
    this.container.addEventListener('mousedown', this.handleDragStart.bind(this));
    document.addEventListener('mousemove', this.handleDragMove.bind(this));
    document.addEventListener('mouseup', this.handleDragEnd.bind(this));

    // Close button
    const closeBtn = this.container.querySelector('.speedypaws-close');
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
    });

    // Decrease button
    const decreaseBtn = this.container.querySelector('.speedypaws-btn-decrease');
    decreaseBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.controller.decreaseSpeed();
    });

    // Increase button
    const increaseBtn = this.container.querySelector('.speedypaws-btn-increase');
    increaseBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.controller.increaseSpeed();
    });

    // Slider
    const slider = this.container.querySelector('.speedypaws-slider') as HTMLInputElement;
    slider?.addEventListener('input', (e) => {
      e.stopPropagation();
      const speed = parseFloat((e.target as HTMLInputElement).value);
      this.controller.setSpeed(speed);
    });

    // Prevent slider from triggering drag
    slider?.addEventListener('mousedown', (e) => e.stopPropagation());

    // Preset buttons
    const presets = this.container.querySelectorAll('.speedypaws-preset');
    presets.forEach((preset) => {
      preset.addEventListener('click', (e) => {
        e.stopPropagation();
        const speed = parseFloat((preset as HTMLElement).dataset.speed || '1');
        this.controller.setSpeed(speed);
      });
    });

    // Prevent clicks from propagating to YouTube
    this.container.addEventListener('click', (e) => e.stopPropagation());
  }

  /**
   * Handle drag start
   */
  private handleDragStart(e: MouseEvent): void {
    // Don't drag if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.closest('button') ||
      target.closest('input')
    ) {
      return;
    }

    this.isDragging = true;
    this.container?.classList.add('dragging');
    
    const rect = this.container!.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  /**
   * Handle drag move
   */
  private handleDragMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;

    // Keep within viewport
    const maxX = window.innerWidth - (this.container?.offsetWidth || 200);
    const maxY = window.innerHeight - (this.container?.offsetHeight || 150);

    this.position = {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    };

    this.updatePosition();
  }

  /**
   * Handle drag end
   */
  private handleDragEnd(): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.container?.classList.remove('dragging');
      this.savePosition();
    }
  }

  /**
   * Update overlay position on screen
   */
  private updatePosition(): void {
    if (this.container) {
      this.container.style.left = `${this.position.x}px`;
      this.container.style.top = `${this.position.y}px`;
    }
  }

  /**
   * Update the speed display
   */
  private updateSpeedDisplay(speed: number): void {
    if (!this.container) return;

    // Update main speed display
    const speedValue = this.container.querySelector('.speedypaws-speed-value');
    if (speedValue) {
      speedValue.textContent = speed.toFixed(1);
    }

    // Update slider
    const slider = this.container.querySelector('.speedypaws-slider') as HTMLInputElement;
    if (slider) {
      slider.value = speed.toString();
    }

    // Update preset buttons
    const presets = this.container.querySelectorAll('.speedypaws-preset');
    presets.forEach((preset) => {
      const presetSpeed = parseFloat((preset as HTMLElement).dataset.speed || '1');
      preset.classList.toggle('active', Math.abs(presetSpeed - speed) < 0.05);
    });
  }

  /**
   * Show toast notification
   */
  private showToast(speed: number): void {
    if (!this.toast) return;

    // Clear existing timeout
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    // Update toast content
    const speedSpan = this.toast.querySelector('.speedypaws-toast-speed');
    if (speedSpan) {
      speedSpan.textContent = `${speed.toFixed(1)}x`;
    }

    // Show toast
    this.toast.classList.add('show');

    // Hide after delay
    this.toastTimeout = setTimeout(() => {
      this.toast?.classList.remove('show');
    }, 1500);
  }

  /**
   * Show the overlay
   */
  show(): void {
    if (this.container) {
      this.container.style.display = 'block';
      this.container.classList.add('entering');
      this.isVisible = true;
      
      setTimeout(() => {
        this.container?.classList.remove('entering');
      }, 300);
    }
  }

  /**
   * Hide the overlay
   */
  hide(): void {
    if (this.container) {
      this.container.classList.add('exiting');
      this.isVisible = false;
      
      setTimeout(() => {
        if (this.container) {
          this.container.style.display = 'none';
          this.container.classList.remove('exiting');
        }
      }, 200);
    }
  }

  /**
   * Toggle overlay visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Set visibility based on setting
   */
  setVisible(visible: boolean): void {
    if (visible && !this.isVisible) {
      this.show();
    } else if (!visible && this.isVisible) {
      this.hide();
    }
  }

  /**
   * Update current profile display
   */
  setProfile(profile: SpeedProfile): void {
    this.currentProfile = profile;
    // Could add a profile badge to the UI here
  }

  /**
   * Check if overlay is visible
   */
  getIsVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.container?.remove();
    this.toast?.remove();
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }
}


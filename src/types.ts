/**
 * SpeedyPaws Type Definitions
 * Shared types used across the extension
 */

// Speed profile types
export type SpeedProfile = 'study' | 'chill' | 'review' | 'custom';

// Profile speed configurations
export interface ProfileConfig {
  study: number;
  chill: number;
  review: number;
}

// Storage data structure
export interface SpeedyPawsSettings {
  // Global settings
  smartSpeedEnabled: boolean;
  rememberChannel: boolean;
  rememberVideo: boolean;
  showOverlay: boolean;
  currentProfile: SpeedProfile;
  defaultSpeed: number;
  
  // Speed profiles
  profiles: ProfileConfig;
  
  // Per-channel speeds (channelId -> speed)
  channelSpeeds: Record<string, number>;
  
  // Per-video speeds (videoId -> speed)
  videoSpeeds: Record<string, number>;
  
  // Overlay position
  overlayPosition: { x: number; y: number };
}

// Default settings
export const DEFAULT_SETTINGS: SpeedyPawsSettings = {
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

// Message types for communication between scripts
export type MessageType = 
  | 'GET_SPEED'
  | 'SET_SPEED'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'SPEED_CHANGED'
  | 'INCREASE_SPEED'
  | 'DECREASE_SPEED'
  | 'SET_PROFILE'
  | 'TOGGLE_OVERLAY'
  | 'VIDEO_CHANGED';

export interface Message {
  type: MessageType;
  payload?: unknown;
}

export interface SpeedChangePayload {
  speed: number;
  videoId?: string;
  channelId?: string;
}

export interface SettingsUpdatePayload {
  settings: Partial<SpeedyPawsSettings>;
}

// YouTube video info
export interface VideoInfo {
  videoId: string;
  channelId: string;
  channelName: string;
  title: string;
}

// Speed bounds
export const MIN_SPEED = 0.1;
export const MAX_SPEED = 5.0;
export const SPEED_STEP = 0.1;


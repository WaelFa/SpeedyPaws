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


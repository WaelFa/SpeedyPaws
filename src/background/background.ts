/**
 * SpeedyPaws Background Service Worker
 * Handles extension lifecycle, keyboard commands, and cross-tab coordination
 */

import { Message, VideoInfo, DEFAULT_SETTINGS, SpeedyPawsSettings } from '../types';

// Track current video info per tab
const tabVideoInfo: Map<number, VideoInfo> = new Map();

/**
 * Initialize the background service worker
 */
function init(): void {
  console.log('[SpeedyPaws Background] 🐾 Service worker started');
  
  // Setup command listeners (keyboard shortcuts)
  setupCommandListeners();
  
  // Setup message listeners
  setupMessageListeners();
  
  // Setup tab listeners
  setupTabListeners();
  
  // Initialize default settings if needed
  initDefaultSettings();
}

/**
 * Initialize default settings in storage
 */
async function initDefaultSettings(): Promise<void> {
  const result = await chrome.storage.local.get(['speedyPawsSettings']);
  if (!result.speedyPawsSettings) {
    await chrome.storage.local.set({ speedyPawsSettings: DEFAULT_SETTINGS });
    console.log('[SpeedyPaws Background] Initialized default settings');
  }
}

/**
 * Setup keyboard command listeners
 * Note: Keyboard shortcuts are handled directly in content script
 */
function setupCommandListeners(): void {
  // Keyboard shortcuts are handled in content script via document.addEventListener('keydown')
  // No need for chrome.commands API since we removed commands from manifest
}

/**
 * Setup message listeners for communication with popup and content scripts
 */
function setupMessageListeners(): void {
  chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
    handleMessage(message, sender, sendResponse);
    return true; // Keep channel open for async responses
  });
}

/**
 * Handle incoming messages
 */
async function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
): Promise<void> {
  const tabId = sender.tab?.id;

  switch (message.type) {
    case 'VIDEO_CHANGED':
      // Track video info for the tab
      if (tabId && message.payload) {
        tabVideoInfo.set(tabId, message.payload as VideoInfo);
        console.log('[SpeedyPaws Background] Video changed:', message.payload);
      }
      sendResponse({ success: true });
      break;

    case 'GET_SETTINGS':
      const settings = await getSettings();
      sendResponse({ settings });
      break;

    case 'UPDATE_SETTINGS':
      await updateSettings(message.payload as Partial<SpeedyPawsSettings>);
      // Broadcast to all YouTube tabs
      await broadcastToYouTubeTabs({ type: 'UPDATE_SETTINGS', payload: message.payload });
      sendResponse({ success: true });
      break;

    default:
      // Forward to active tab's content script
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id && tab.url?.includes('youtube.com')) {
          const response = await chrome.tabs.sendMessage(tab.id, message);
          sendResponse(response);
        } else {
          sendResponse({ error: 'No active YouTube tab' });
        }
      } catch (error) {
        sendResponse({ error: 'Failed to communicate with content script' });
      }
  }
}

/**
 * Get settings from storage
 */
async function getSettings(): Promise<SpeedyPawsSettings> {
  const result = await chrome.storage.local.get(['speedyPawsSettings']);
  return result.speedyPawsSettings || DEFAULT_SETTINGS;
}

/**
 * Update settings in storage
 */
async function updateSettings(updates: Partial<SpeedyPawsSettings>): Promise<void> {
  const current = await getSettings();
  const updated = { ...current, ...updates };
  await chrome.storage.local.set({ speedyPawsSettings: updated });
}

/**
 * Broadcast message to all YouTube tabs
 */
async function broadcastToYouTubeTabs(message: Message): Promise<void> {
  const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
  
  for (const tab of tabs) {
    if (tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, message);
      } catch {
        // Tab might not have content script loaded
      }
    }
  }
}

/**
 * Setup tab event listeners
 */
function setupTabListeners(): void {
  // Clean up when tab closes
  chrome.tabs.onRemoved.addListener((tabId) => {
    tabVideoInfo.delete(tabId);
  });

  // Clean up when tab navigates away from YouTube
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url && !tab.url?.includes('youtube.com')) {
      tabVideoInfo.delete(tabId);
    }
  });
}

/**
 * Handle extension install/update
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[SpeedyPaws Background] Extension installed');
    // Could open onboarding page here
  } else if (details.reason === 'update') {
    console.log('[SpeedyPaws Background] Extension updated to', chrome.runtime.getManifest().version);
  }
});

// Initialize
init();


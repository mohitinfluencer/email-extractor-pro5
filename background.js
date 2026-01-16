/**
 * Email Extractor Pro - Background Service Worker
 * Handles badge updates to show lead count on extension icon
 */

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_BADGE') {
        const count = message.count || 0;
        const tabId = sender.tab?.id;

        if (tabId) {
            // Set badge text (show number, or empty if 0)
            chrome.action.setBadgeText({
                text: count > 0 ? String(count) : '',
                tabId: tabId
            });

            // Set badge background color (purple to match theme)
            chrome.action.setBadgeBackgroundColor({
                color: '#8B5CF6', // Purple
                tabId: tabId
            });

            // Set badge text color (white)
            chrome.action.setBadgeTextColor({
                color: '#FFFFFF',
                tabId: tabId
            });
        }

        sendResponse({ success: true });
    }

    return true; // Keep message channel open for async response
});

// Clear badge when tab is updated/navigated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading') {
        chrome.action.setBadgeText({
            text: '',
            tabId: tabId
        });
    }
});

// Clear badge when tab is activated (switched to)
chrome.tabs.onActivated.addListener((activeInfo) => {
    // Badge is per-tab, so it will show the correct count for that tab
    // No action needed here, but kept for potential future use
});

console.log('[Email Extractor Pro] Background service worker loaded');

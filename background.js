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
            try {
                // Set badge text (show number, or empty if 0)
                chrome.action.setBadgeText({
                    text: count > 0 ? String(count) : '',
                    tabId: tabId
                }, () => {
                    if (chrome.runtime.lastError) { /* Ignore - tab might be closed */ }
                });

                // Set badge background color (purple to match theme)
                chrome.action.setBadgeBackgroundColor({
                    color: '#8B5CF6', // Purple
                    tabId: tabId
                }, () => {
                    if (chrome.runtime.lastError) { /* Ignore */ }
                });

                // Set badge text color (white)
                chrome.action.setBadgeTextColor({
                    color: '#FFFFFF',
                    tabId: tabId
                }, () => {
                    if (chrome.runtime.lastError) { /* Ignore */ }
                });
            } catch (e) {
                // Extension context or tab might be gone
            }
        }

        sendResponse({ success: true });
    }

    return true; // Keep message channel open for async response
});

// Clear badge when tab is updated/navigated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading') {
        try {
            chrome.action.setBadgeText({
                text: '',
                tabId: tabId
            }, () => {
                if (chrome.runtime.lastError) { /* Ignore - tab might be closed */ }
            });
        } catch (e) {
            // Ignore
        }
    }
});

// Clear badge when tab is activated (switched to)
chrome.tabs.onActivated.addListener((activeInfo) => {
    // Badge is per-tab, so it will show the correct count for that tab
    // No action needed here, but kept for potential future use
});

console.log('[Email Extractor Pro] Background service worker loaded');

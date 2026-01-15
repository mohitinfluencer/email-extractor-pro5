/**
 * Popup Script for Email Extractor Pro
 * Part 1: Initialization and State Management
 */

// State
let state = {
    active: true,
    extractEmails: true,
    extractPhones: true,
    extractSocials: true,
    validateEmails: true,
    generateNames: false,
    autosave: false,
    extractSerp: false,
    selectedCountries: ['IN', 'US', 'UK'],
    // Profile Mode settings
    profileMode: false,
    profileAutosave: false,
    // Extractor results
    emails: [],
    invalidEmails: [],
    phones: [],
    phonesFiltered: 0,
    socialLinks: [],
    socialsByPlatform: {},
    serpLinks: { linkedin: [] },
    // Profile results
    currentProfile: null,
    isProfilePage: false,
    savedProfiles: []
};

// Country data for UI dropdown
const POPUP_COUNTRIES = [
    { code: 'IN', name: 'India', dialCode: '+91' },
    { code: 'US', name: 'USA', dialCode: '+1' },
    { code: 'UK', name: 'UK', dialCode: '+44' },
    { code: 'CA', name: 'Canada', dialCode: '+1' },
    { code: 'AU', name: 'Australia', dialCode: '+61' },
    { code: 'DE', name: 'Germany', dialCode: '+49' },
    { code: 'FR', name: 'France', dialCode: '+33' },
    { code: 'IT', name: 'Italy', dialCode: '+39' },
    { code: 'ES', name: 'Spain', dialCode: '+34' },
    { code: 'BR', name: 'Brazil', dialCode: '+55' },
    { code: 'MX', name: 'Mexico', dialCode: '+52' },
    { code: 'JP', name: 'Japan', dialCode: '+81' },
    { code: 'KR', name: 'South Korea', dialCode: '+82' },
    { code: 'CN', name: 'China', dialCode: '+86' },
    { code: 'RU', name: 'Russia', dialCode: '+7' },
    { code: 'AE', name: 'UAE', dialCode: '+971' },
    { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
    { code: 'SG', name: 'Singapore', dialCode: '+65' },
    { code: 'MY', name: 'Malaysia', dialCode: '+60' },
    { code: 'ID', name: 'Indonesia', dialCode: '+62' },
    { code: 'PH', name: 'Philippines', dialCode: '+63' },
    { code: 'TH', name: 'Thailand', dialCode: '+66' },
    { code: 'VN', name: 'Vietnam', dialCode: '+84' },
    { code: 'PK', name: 'Pakistan', dialCode: '+92' },
    { code: 'BD', name: 'Bangladesh', dialCode: '+880' },
    { code: 'NG', name: 'Nigeria', dialCode: '+234' },
    { code: 'ZA', name: 'South Africa', dialCode: '+27' },
    { code: 'EG', name: 'Egypt', dialCode: '+20' },
    { code: 'TR', name: 'Turkey', dialCode: '+90' },
    { code: 'NL', name: 'Netherlands', dialCode: '+31' },
    { code: 'SE', name: 'Sweden', dialCode: '+46' },
    { code: 'NO', name: 'Norway', dialCode: '+47' },
    { code: 'DK', name: 'Denmark', dialCode: '+45' },
    { code: 'PL', name: 'Poland', dialCode: '+48' },
    { code: 'CH', name: 'Switzerland', dialCode: '+41' },
    { code: 'AT', name: 'Austria', dialCode: '+43' },
    { code: 'BE', name: 'Belgium', dialCode: '+32' },
    { code: 'IE', name: 'Ireland', dialCode: '+353' },
    { code: 'NZ', name: 'New Zealand', dialCode: '+64' },
    { code: 'IL', name: 'Israel', dialCode: '+972' },
    { code: 'HK', name: 'Hong Kong', dialCode: '+852' },
    { code: 'TW', name: 'Taiwan', dialCode: '+886' }
];

// DOM Elements
const elements = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    cacheElements();
    await loadSettings();
    setupEventListeners();
    initCountryDropdown();
    updateUI();
    setupStorageSync();

    if (state.active) {
        if (state.profileMode) {
            triggerProfileExtraction();
        } else {
            triggerExtraction();
        }
    } else {
        showInactiveState();
    }
});

function cacheElements() {
    elements.activeToggle = document.getElementById('activeToggle');
    elements.emailsToggle = document.getElementById('emailsToggle');
    elements.phonesToggle = document.getElementById('phonesToggle');
    elements.socialsToggle = document.getElementById('socialsToggle');
    elements.validateToggle = document.getElementById('validateToggle');
    elements.namesToggle = document.getElementById('namesToggle');
    elements.autosaveToggle = document.getElementById('autosaveToggle');
    elements.serpToggle = document.getElementById('serpToggle');

    elements.loadingState = document.getElementById('loadingState');
    elements.inactiveState = document.getElementById('inactiveState');
    elements.resultsContainer = document.getElementById('resultsContainer');

    elements.emailsSection = document.getElementById('emailsSection');
    elements.emailsCount = document.getElementById('emailsCount');
    elements.emailsList = document.getElementById('emailsList');
    elements.seeAllEmails = document.getElementById('seeAllEmails');
    elements.emailsTotal = document.getElementById('emailsTotal');
    elements.copyEmails = document.getElementById('copyEmails');
    elements.clearEmails = document.getElementById('clearEmails');

    elements.invalidEmailsDropdown = document.getElementById('invalidEmailsDropdown');
    elements.invalidEmailsToggle = document.getElementById('invalidEmailsToggle');
    elements.invalidEmailsContent = document.getElementById('invalidEmailsContent');
    elements.invalidEmailsList = document.getElementById('invalidEmailsList');
    elements.invalidCount = document.getElementById('invalidCount');

    elements.phonesSection = document.getElementById('phonesSection');
    elements.phonesCount = document.getElementById('phonesCount');
    elements.phonesFiltered = document.getElementById('phonesFiltered');
    elements.phonesList = document.getElementById('phonesList');
    elements.seeAllPhones = document.getElementById('seeAllPhones');
    elements.phonesTotal = document.getElementById('phonesTotal');
    elements.copyPhones = document.getElementById('copyPhones');
    elements.clearPhones = document.getElementById('clearPhones');
    elements.noCountryMessage = document.getElementById('noCountryMessage');

    elements.countryDropdownBtn = document.getElementById('countryDropdownBtn');
    elements.countryDropdown = document.getElementById('countryDropdown');
    elements.countryLabel = document.getElementById('countryLabel');
    elements.countrySearch = document.getElementById('countrySearch');
    elements.countryList = document.getElementById('countryList');
    elements.selectAllCountries = document.getElementById('selectAllCountries');
    elements.clearCountries = document.getElementById('clearCountries');

    elements.socialsSection = document.getElementById('socialsSection');
    elements.socialsCount = document.getElementById('socialsCount');
    elements.socialsList = document.getElementById('socialsList');
    elements.seeAllSocials = document.getElementById('seeAllSocials');
    elements.socialsTotal = document.getElementById('socialsTotal');
    elements.copyWA = document.getElementById('copyWA');
    elements.copyLI = document.getElementById('copyLI');
    elements.copySocials = document.getElementById('copySocials');
    elements.clearSocials = document.getElementById('clearSocials');

    elements.serpSubsection = document.getElementById('serpSubsection');
    elements.serpCount = document.getElementById('serpCount');
    elements.serpList = document.getElementById('serpList');
    elements.copySerpLinks = document.getElementById('copySerpLinks');

    elements.modalOverlay = document.getElementById('modalOverlay');
    elements.modalTitle = document.getElementById('modalTitle');
    elements.modalSearch = document.getElementById('modalSearch');
    elements.modalContent = document.getElementById('modalContent');
    elements.modalClose = document.getElementById('modalClose');
    elements.modalClear = document.getElementById('modalClear');
    elements.modalCopy = document.getElementById('modalCopy');

    elements.toast = document.getElementById('toast');

    // Expand button
    elements.expandBtn = document.getElementById('expandBtn');

    // Profile Mode elements
    elements.extractorToggles = document.getElementById('extractorToggles');
    elements.profileToggles = document.getElementById('profileToggles');
    elements.profileModeToggle = document.getElementById('profileModeToggle');
    elements.profileModeToggle2 = document.getElementById('profileModeToggle2');
    elements.profileAutosaveToggle = document.getElementById('profileAutosaveToggle');
    elements.profileContainer = document.getElementById('profileContainer');
    elements.notProfileState = document.getElementById('notProfileState');
    elements.profileCard = document.getElementById('profileCard');
    elements.profileBadge = document.getElementById('profileBadge');
    elements.profileName = document.getElementById('profileName');
    elements.profileUsername = document.getElementById('profileUsername');
    elements.profileHeadline = document.getElementById('profileHeadline');
    elements.profileLocation = document.getElementById('profileLocation');
    elements.profileCompany = document.getElementById('profileCompany');
    elements.profileEmail = document.getElementById('profileEmail');
    elements.profileEmailRow = document.getElementById('profileEmailRow');
    elements.profilePhone = document.getElementById('profilePhone');
    elements.profilePhoneRow = document.getElementById('profilePhoneRow');
    elements.profileWebsite = document.getElementById('profileWebsite');
    elements.profileWebsiteRow = document.getElementById('profileWebsiteRow');
    elements.copyProfileBtn = document.getElementById('copyProfileBtn');
    elements.saveProfileBtn = document.getElementById('saveProfileBtn');
    elements.savedProfilesCount = document.getElementById('savedProfilesCount');
    elements.savedProfilesList = document.getElementById('savedProfilesList');
    elements.seeAllProfiles = document.getElementById('seeAllProfiles');
    elements.profilesTotal = document.getElementById('profilesTotal');
    elements.downloadProfilesCsv = document.getElementById('downloadProfilesCsv');
    elements.clearSavedProfiles = document.getElementById('clearSavedProfiles');

    // Saved Leads Counter elements
    elements.savedCounterBar = document.getElementById('savedCounterBar');
    elements.savedEmailCount = document.getElementById('savedEmailCount');
    elements.savedPhoneCount = document.getElementById('savedPhoneCount');
    elements.savedSocialCount = document.getElementById('savedSocialCount');
}

async function loadSettings() {
    try {
        const data = await Storage.getAll();
        state.active = data.settings.active;
        state.extractEmails = data.settings.extractEmails;
        state.extractPhones = data.settings.extractPhones;
        state.extractSocials = data.settings.extractSocials;
        state.validateEmails = data.settings.validateEmails;
        state.generateNames = data.settings.generateNames;
        state.autosave = data.settings.autosave;
        state.extractSerp = data.settings.extractSerp;
        state.selectedCountries = data.settings.selectedCountries || ['IN', 'US', 'UK'];
        // Profile Mode settings
        state.profileMode = data.settings.profileMode || false;
        state.profileAutosave = data.settings.profileAutosave || false;
        // Load saved profiles
        state.savedProfiles = await Storage.getSavedProfiles();
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function saveSettings() {
    try {
        await Storage.saveSettings({
            active: state.active,
            extractEmails: state.extractEmails,
            extractPhones: state.extractPhones,
            extractSocials: state.extractSocials,
            validateEmails: state.validateEmails,
            generateNames: state.generateNames,
            autosave: state.autosave,
            extractSerp: state.extractSerp,
            selectedCountries: state.selectedCountries,
            profileMode: state.profileMode,
            profileAutosave: state.profileAutosave
        });
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

function updateUI() {
    elements.activeToggle.checked = state.active;
    elements.emailsToggle.checked = state.extractEmails;
    elements.phonesToggle.checked = state.extractPhones;
    elements.socialsToggle.checked = state.extractSocials;
    elements.validateToggle.checked = state.validateEmails;
    elements.namesToggle.checked = state.generateNames;
    elements.autosaveToggle.checked = state.autosave;
    elements.serpToggle.checked = state.extractSerp;
    updateCountryLabel();

    // Profile Mode UI
    if (elements.profileModeToggle) elements.profileModeToggle.checked = state.profileMode;
    if (elements.profileModeToggle2) elements.profileModeToggle2.checked = state.profileMode;
    if (elements.profileAutosaveToggle) elements.profileAutosaveToggle.checked = state.profileAutosave;

    // Show/hide saved counter bar based on autosave setting
    if (elements.savedCounterBar) {
        elements.savedCounterBar.style.display = state.autosave ? 'flex' : 'none';
        if (state.autosave) {
            loadAndDisplaySavedCounts();
        }
    }

    updateProfileModeUI();
}

/**
 * Load saved counts from storage and display them
 */
async function loadAndDisplaySavedCounts() {
    try {
        const saved = await Storage.getSaved();
        updateSavedCountsDisplay(saved);
    } catch (error) {
        console.error('Error loading saved counts:', error);
    }
}

/**
 * Update the saved counts display in the counter bar
 * @param {Object} saved - Saved data object with emails, phones, socialLinks
 */
function updateSavedCountsDisplay(saved) {
    if (!saved) return;

    if (elements.savedEmailCount) {
        elements.savedEmailCount.textContent = saved.emails?.length || 0;
    }
    if (elements.savedPhoneCount) {
        elements.savedPhoneCount.textContent = saved.phones?.length || 0;
    }
    if (elements.savedSocialCount) {
        elements.savedSocialCount.textContent = saved.socialLinks?.length || 0;
    }
}

function setupEventListeners() {
    // Active toggle
    elements.activeToggle.addEventListener('change', () => {
        state.active = elements.activeToggle.checked;
        saveSettings();
        if (state.active) {
            triggerExtraction();
        } else {
            showInactiveState();
        }
    });

    // Feature toggles - all trigger re-extraction
    const toggles = [
        { el: 'emailsToggle', key: 'extractEmails' },
        { el: 'phonesToggle', key: 'extractPhones' },
        { el: 'socialsToggle', key: 'extractSocials' },
        { el: 'validateToggle', key: 'validateEmails' },
        { el: 'namesToggle', key: 'generateNames' },
        { el: 'serpToggle', key: 'extractSerp' }
    ];

    toggles.forEach(({ el, key }) => {
        elements[el].addEventListener('change', () => {
            state[key] = elements[el].checked;
            saveSettings();
            if (state.active) triggerExtraction();
        });
    });

    // Autosave toggle - special handling to show/hide saved counter bar
    elements.autosaveToggle.addEventListener('change', () => {
        state.autosave = elements.autosaveToggle.checked;
        saveSettings();

        // Show/hide saved counter bar
        if (elements.savedCounterBar) {
            elements.savedCounterBar.style.display = state.autosave ? 'flex' : 'none';
            if (state.autosave) {
                loadAndDisplaySavedCounts();
            }
        }

        if (state.active) triggerExtraction();
    });

    // Copy buttons
    elements.copyEmails.addEventListener('click', () => copyToClipboard(state.emails.join('\n'), 'Emails copied!'));
    elements.copyPhones.addEventListener('click', () => copyToClipboard(state.phones.join('\n'), 'Phones copied!'));
    elements.copySocials.addEventListener('click', () => copyToClipboard(state.socialLinks.map(l => l.url).join('\n'), 'Social links copied!'));
    elements.copyWA.addEventListener('click', () => copyPlatformLinks('whatsapp', 'WhatsApp links copied!'));
    elements.copyLI.addEventListener('click', () => copyPlatformLinks('linkedin', 'LinkedIn links copied!'));
    elements.copySerpLinks.addEventListener('click', () => copyToClipboard(state.serpLinks.linkedin.join('\n'), 'SERP links copied!'));

    // Clear buttons
    elements.clearEmails.addEventListener('click', () => { state.emails = []; state.invalidEmails = []; renderEmails(); });
    elements.clearPhones.addEventListener('click', () => { state.phones = []; renderPhones(); });
    elements.clearSocials.addEventListener('click', () => { state.socialLinks = []; state.socialsByPlatform = {}; renderSocials(); });

    // See all buttons
    elements.seeAllEmails.addEventListener('click', () => openModal('emails'));
    elements.seeAllPhones.addEventListener('click', () => openModal('phones'));
    elements.seeAllSocials.addEventListener('click', () => openModal('socials'));

    // Invalid emails dropdown
    elements.invalidEmailsToggle.addEventListener('click', () => {
        const isExpanded = elements.invalidEmailsContent.style.display !== 'none';
        elements.invalidEmailsContent.style.display = isExpanded ? 'none' : 'block';
        elements.invalidEmailsToggle.classList.toggle('expanded', !isExpanded);
    });

    // Country dropdown
    elements.countryDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = elements.countryDropdown.style.display !== 'none';
        elements.countryDropdown.style.display = isOpen ? 'none' : 'block';
    });

    elements.countrySearch.addEventListener('input', filterCountries);
    elements.selectAllCountries.addEventListener('click', selectAllCountries);
    elements.clearCountries.addEventListener('click', clearAllCountries);

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!elements.countryDropdown.contains(e.target) && e.target !== elements.countryDropdownBtn) {
            elements.countryDropdown.style.display = 'none';
        }
    });

    // Modal
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) closeModal();
    });
    elements.modalSearch.addEventListener('input', filterModalItems);

    // Expand button - open dashboard
    elements.expandBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('panel.html') });
    });
}

// Storage sync listener
function setupStorageSync() {
    Storage.onChange((changes) => {
        if (changes.settings) {
            const newSettings = changes.settings.newValue;
            state.active = newSettings.active;
            state.extractEmails = newSettings.extractEmails;
            state.extractPhones = newSettings.extractPhones;
            state.extractSocials = newSettings.extractSocials;
            state.validateEmails = newSettings.validateEmails;
            state.generateNames = newSettings.generateNames;
            state.autosave = newSettings.autosave;
            state.extractSerp = newSettings.extractSerp;
            state.selectedCountries = newSettings.selectedCountries || [];
            updateUI();
            initCountryDropdown();
        }
    });
}

// Extraction Pipeline - Simple and Robust
let isExtracting = false;

async function triggerExtraction() {
    // Prevent multiple concurrent extractions
    if (isExtracting) {
        console.log('[Popup] Extraction already in progress, skipping');
        return;
    }

    isExtracting = true;
    showLoading();

    // Timeout - MUST complete within 4 seconds
    const timeoutId = setTimeout(() => {
        console.log('[Popup] Extraction timeout triggered');
        if (isExtracting) {
            isExtracting = false;
            handleExtractionFailure('Extraction timed out. Click Retry.');
        }
    }, 4000);

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.id) {
            clearTimeout(timeoutId);
            isExtracting = false;
            handleExtractionFailure('No active tab found');
            return;
        }

        // Check if we can access this tab
        const url = tab.url || '';
        if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') ||
            url.startsWith('edge://') || url.startsWith('about:') || url === '') {
            clearTimeout(timeoutId);
            isExtracting = false;
            handleExtractionFailure('Cannot extract from this page');
            return;
        }

        // Try to communicate with content script
        let response = null;

        try {
            // First try direct message
            response = await sendMessageWithTimeout(tab.id, {
                type: 'EXTRACT_DATA',
                extractEmails: state.extractEmails,
                extractPhones: state.extractPhones,
                extractSocials: state.extractSocials,
                extractSerpLinks: state.extractSerp,
                validateEmails: state.validateEmails,
                generateNames: state.generateNames,
                selectedCountries: state.selectedCountries
            }, 4000);
        } catch (e) {
            console.log('[Popup] Direct message failed, trying injection:', e.message);

            // Try injecting content script
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });

                // Wait for injection
                await sleep(400);

                // Try again after injection
                response = await sendMessageWithTimeout(tab.id, {
                    type: 'EXTRACT_DATA',
                    extractEmails: state.extractEmails,
                    extractPhones: state.extractPhones,
                    extractSocials: state.extractSocials,
                    extractSerpLinks: state.extractSerp,
                    validateEmails: state.validateEmails,
                    generateNames: state.generateNames,
                    selectedCountries: state.selectedCountries
                }, 4000);
            } catch (injectionError) {
                console.error('[Popup] Injection failed:', injectionError);
                throw new Error('Cannot access this page');
            }
        }

        // Clear timeout - we got a response
        clearTimeout(timeoutId);
        isExtracting = false;

        if (response && !response.error) {
            // Success - update state
            state.emails = response.emails || [];
            state.invalidEmails = response.invalidEmails || [];
            state.phones = response.phones || [];
            state.phonesFiltered = response.phonesFiltered || 0;
            state.socialLinks = response.socialLinks || [];
            state.socialsByPlatform = response.socialsByPlatform || {};
            state.serpLinks = response.serpLinks || { linkedin: [] };

            // Save results
            await Storage.saveResults({
                emails: state.emails,
                invalidEmails: state.invalidEmails,
                phones: state.phones,
                phonesFiltered: state.phonesFiltered,
                socialLinks: state.socialLinks,
                socialsByPlatform: state.socialsByPlatform,
                serpLinks: state.serpLinks
            });

            // Autosave if enabled
            if (state.autosave) {
                const mergedSaved = await Storage.autosaveResults({
                    emails: state.emails,
                    phones: state.phones,
                    socialLinks: state.socialLinks,
                    serpLinks: state.serpLinks
                });
                if (mergedSaved) {
                    updateSavedCountsDisplay(mergedSaved);
                }
            }

            showResults();
            renderAll();
        } else {
            throw new Error(response?.error || 'Empty response');
        }
    } catch (error) {
        console.error('[Popup] Extraction error:', error);
        clearTimeout(timeoutId);
        isExtracting = false;

        let msg = 'Extraction failed';
        if (error.message.includes('Cannot access') || error.message.includes('Cannot extract')) {
            msg = error.message;
        } else if (error.message.includes('Could not establish connection') ||
            error.message.includes('Receiving end does not exist')) {
            msg = 'Page not accessible. Refresh and retry.';
        }
        handleExtractionFailure(msg);
    }
}

// Helper: Send message with timeout
function sendMessageWithTimeout(tabId, message, timeout) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('Message timeout'));
        }, timeout);

        chrome.tabs.sendMessage(tabId, message, (response) => {
            clearTimeout(timer);
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(response);
            }
        });
    });
}

// Helper: Sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle extraction failure - always show UI, never stuck
function handleExtractionFailure(message) {
    // Clear state
    state.emails = [];
    state.invalidEmails = [];
    state.phones = [];
    state.phonesFiltered = 0;
    state.socialLinks = [];
    state.socialsByPlatform = {};
    state.serpLinks = { linkedin: [] };

    // Always show results (even if empty)
    showResults();
    renderAll();

    // Show error and retry button
    showToast(message, 'error');
    showRetryButton();
}

function showRetryButton() {
    // Check if retry button already exists
    if (document.getElementById('retryBtn')) return;

    const retryBtn = document.createElement('button');
    retryBtn.id = 'retryBtn';
    retryBtn.className = 'retry-button';
    retryBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Retry Extraction
    `;
    retryBtn.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 12px;
        margin: 16px 0;
        background: linear-gradient(135deg, var(--primary), var(--primary-dark));
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
    `;

    retryBtn.addEventListener('click', () => {
        retryBtn.remove();
        triggerExtraction();
    });

    // Insert at top of results container
    if (elements.resultsContainer) {
        elements.resultsContainer.insertBefore(retryBtn, elements.resultsContainer.firstChild);
    }
}

function hideRetryButton() {
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) retryBtn.remove();
}

function showLoading() {
    elements.loadingState.style.display = 'flex';
    elements.inactiveState.style.display = 'none';
    elements.resultsContainer.style.display = 'none';
}

function showInactiveState() {
    elements.loadingState.style.display = 'none';
    elements.inactiveState.style.display = 'flex';
    elements.resultsContainer.style.display = 'none';
}

function showResults() {
    elements.loadingState.style.display = 'none';
    elements.inactiveState.style.display = 'none';
    elements.resultsContainer.style.display = 'block';
}

function showError(message) {
    showToast(message, 'error');
    showResults();
    renderAll();
}

// Rendering Functions
function renderAll() {
    hideRetryButton(); // Remove retry button on successful render
    renderEmails();
    renderPhones();
    renderSocials();
    renderSerpLinks();
}

function renderEmails() {
    const emails = state.emails;
    elements.emailsCount.textContent = `(${emails.length})`;
    elements.emailsList.innerHTML = '';

    // Show first 3 emails
    const preview = emails.slice(0, 3);
    preview.forEach(email => {
        const item = createEmailItem(email);
        elements.emailsList.appendChild(item);
    });

    // See all button
    if (emails.length > 3) {
        elements.seeAllEmails.style.display = 'block';
        elements.emailsTotal.textContent = emails.length;
    } else {
        elements.seeAllEmails.style.display = 'none';
    }

    // Invalid emails
    if (state.validateEmails && state.invalidEmails.length > 0) {
        elements.invalidEmailsDropdown.style.display = 'block';
        elements.invalidCount.textContent = state.invalidEmails.length;
        elements.invalidEmailsList.innerHTML = '';
        state.invalidEmails.forEach(email => {
            const item = createEmailItem(email, true);
            elements.invalidEmailsList.appendChild(item);
        });
    } else {
        elements.invalidEmailsDropdown.style.display = 'none';
    }

    // Empty state
    if (emails.length === 0) {
        elements.emailsList.innerHTML = '<div class="empty-state">No emails found</div>';
    }
}

function createEmailItem(email, isInvalid = false) {
    const div = document.createElement('div');
    div.className = 'item';

    const name = state.generateNames ? (window.NameGenerator?.generate(email) || '') : '';

    div.innerHTML = `
    <div class="item-content">
      ${name ? `<div class="item-name">${name}</div>` : ''}
      <div class="item-value">${email}</div>
    </div>
    <button class="item-copy" title="Copy">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
        <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/>
      </svg>
    </button>
  `;

    div.querySelector('.item-copy').addEventListener('click', () => copyToClipboard(email, 'Email copied!'));
    return div;
}

function renderPhones() {
    const phones = state.phones;
    elements.phonesCount.textContent = `(${phones.length})`;
    elements.phonesFiltered.textContent = state.phonesFiltered > 0 ? `(FILTERED: ${state.phonesFiltered})` : '';
    elements.phonesList.innerHTML = '';

    // Check if countries selected
    if (state.selectedCountries.length === 0) {
        elements.noCountryMessage.style.display = 'block';
        elements.phonesList.innerHTML = '';
        elements.seeAllPhones.style.display = 'none';
        return;
    }
    elements.noCountryMessage.style.display = 'none';

    // Show first 3 phones
    const preview = phones.slice(0, 3);
    preview.forEach(phone => {
        const item = createPhoneItem(phone);
        elements.phonesList.appendChild(item);
    });

    // See all button
    if (phones.length > 3) {
        elements.seeAllPhones.style.display = 'block';
        elements.phonesTotal.textContent = phones.length;
    } else {
        elements.seeAllPhones.style.display = 'none';
    }

    // Empty state
    if (phones.length === 0) {
        elements.phonesList.innerHTML = '<div class="empty-state">No phones found</div>';
    }
}

function createPhoneItem(phone) {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
    <div class="item-content">
      <div class="item-value">${formatPhoneDisplay(phone)}</div>
    </div>
    <button class="item-copy" title="Copy">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
        <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/>
      </svg>
    </button>
  `;
    div.querySelector('.item-copy').addEventListener('click', () => copyToClipboard(phone, 'Phone copied!'));
    return div;
}

function formatPhoneDisplay(phone) {
    if (phone.startsWith('+')) return phone;
    return '+' + phone;
}

function renderSocials() {
    const platforms = ['whatsapp', 'instagram', 'tiktok', 'linkedin', 'twitter', 'youtube', 'facebook', 'website'];
    const platformIcons = {
        whatsapp: 'WA', instagram: 'IG', tiktok: 'TT', linkedin: 'LI',
        twitter: 'X', youtube: 'YT', facebook: 'FB', website: 'WEB'
    };
    const platformNames = {
        whatsapp: 'WhatsApp', instagram: 'Instagram', tiktok: 'TikTok', linkedin: 'LinkedIn',
        twitter: 'Twitter/X', youtube: 'YouTube', facebook: 'Facebook', website: 'Website'
    };

    let totalCount = 0;
    elements.socialsList.innerHTML = '';

    platforms.forEach(platform => {
        const links = state.socialsByPlatform[platform] || [];
        if (links.length > 0) {
            totalCount += links.length;
            const item = document.createElement('div');
            item.className = 'platform-item';
            item.innerHTML = `
        <div class="platform-info">
          <div class="platform-icon ${platform}">${platformIcons[platform]}</div>
          <div class="platform-details">
            <div class="platform-name">${platformNames[platform]} (${links.length})</div>
            <div class="platform-link">${links[0]}</div>
          </div>
        </div>
        <button class="item-copy" title="Copy">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      `;
            item.querySelector('.item-copy').addEventListener('click', () =>
                copyToClipboard(links[0], `${platformNames[platform]} link copied!`)
            );
            elements.socialsList.appendChild(item);
        }
    });

    elements.socialsCount.textContent = `(${totalCount})`;

    if (totalCount > 8) {
        elements.seeAllSocials.style.display = 'block';
        elements.socialsTotal.textContent = totalCount;
    } else {
        elements.seeAllSocials.style.display = 'none';
    }

    if (totalCount === 0) {
        elements.socialsList.innerHTML = '<div class="empty-state">No social links found</div>';
    }
}

function renderSerpLinks() {
    const links = state.serpLinks.linkedin || [];

    if (state.extractSerp && links.length > 0) {
        elements.serpSubsection.style.display = 'block';
        elements.serpCount.textContent = links.length;
        elements.serpList.innerHTML = '';

        links.slice(0, 5).forEach(link => {
            const item = document.createElement('div');
            item.className = 'item';
            item.innerHTML = `
        <div class="item-content">
          <div class="item-value">${link}</div>
        </div>
        <button class="item-copy" title="Copy">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      `;
            item.querySelector('.item-copy').addEventListener('click', () => copyToClipboard(link, 'Link copied!'));
            elements.serpList.appendChild(item);
        });
    } else {
        elements.serpSubsection.style.display = 'none';
    }
}

// Country Dropdown
function initCountryDropdown() {
    elements.countryList.innerHTML = '';
    POPUP_COUNTRIES.forEach(country => {
        const item = document.createElement('div');
        item.className = 'country-item';
        item.innerHTML = `
      <input type="checkbox" id="country-${country.code}" value="${country.code}" 
        ${state.selectedCountries.includes(country.code) ? 'checked' : ''}>
      <label for="country-${country.code}">${country.name} (${country.dialCode})</label>
    `;
        item.querySelector('input').addEventListener('change', (e) => {
            if (e.target.checked) {
                if (!state.selectedCountries.includes(country.code)) {
                    state.selectedCountries.push(country.code);
                }
            } else {
                state.selectedCountries = state.selectedCountries.filter(c => c !== country.code);
            }
            updateCountryLabel();
            saveSettings();
            if (state.active) triggerExtraction();
        });
        elements.countryList.appendChild(item);
    });

    // Prevent popup scrolling when scrolling inside country list
    elements.countryList.addEventListener('wheel', (e) => {
        const { scrollTop, scrollHeight, clientHeight } = elements.countryList;
        const atTop = scrollTop === 0 && e.deltaY < 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight && e.deltaY > 0;
        if (!atTop && !atBottom) {
            e.stopPropagation();
        }
    }, { passive: true });

    updateCountryLabel();
}

function updateCountryLabel() {
    const count = state.selectedCountries.length;
    if (count === 0) {
        elements.countryLabel.textContent = 'Select countries';
    } else if (count === 1) {
        const country = POPUP_COUNTRIES.find(c => c.code === state.selectedCountries[0]);
        elements.countryLabel.textContent = country ? `${country.name} (${country.dialCode})` : state.selectedCountries[0];
    } else {
        elements.countryLabel.textContent = `Selected: ${count} countries`;
    }
}

function filterCountries() {
    const search = elements.countrySearch.value.toLowerCase();
    elements.countryList.querySelectorAll('.country-item').forEach(item => {
        const label = item.querySelector('label').textContent.toLowerCase();
        item.style.display = label.includes(search) ? 'flex' : 'none';
    });
}

function selectAllCountries() {
    state.selectedCountries = POPUP_COUNTRIES.map(c => c.code);
    elements.countryList.querySelectorAll('input').forEach(input => input.checked = true);
    updateCountryLabel();
    saveSettings();
    if (state.active) triggerExtraction();
}

function clearAllCountries() {
    state.selectedCountries = [];
    elements.countryList.querySelectorAll('input').forEach(input => input.checked = false);
    updateCountryLabel();
    saveSettings();
    if (state.active) triggerExtraction();
}

// Modal System
let currentModalType = null;
let currentModalData = [];

function openModal(type) {
    currentModalType = type;
    elements.modalSearch.value = '';

    switch (type) {
        case 'emails':
            elements.modalTitle.textContent = `All Emails (${state.emails.length})`;
            currentModalData = state.emails;
            break;
        case 'phones':
            elements.modalTitle.textContent = `All Phones (${state.phones.length})`;
            currentModalData = state.phones;
            break;
        case 'socials':
            elements.modalTitle.textContent = `All Social Links (${state.socialLinks.length})`;
            currentModalData = state.socialLinks;
            break;
    }

    renderModalItems(currentModalData);

    elements.modalCopy.onclick = () => {
        const data = type === 'socials' ? currentModalData.map(l => l.url).join('\n') : currentModalData.join('\n');
        copyToClipboard(data, 'Copied to clipboard!');
    };

    elements.modalClear.onclick = () => {
        if (type === 'emails') { state.emails = []; state.invalidEmails = []; }
        else if (type === 'phones') state.phones = [];
        else if (type === 'socials') { state.socialLinks = []; state.socialsByPlatform = {}; }
        closeModal();
        renderAll();
    };

    elements.modalOverlay.style.display = 'flex';
}

function closeModal() {
    elements.modalOverlay.style.display = 'none';
    currentModalType = null;
    currentModalData = [];
}

function renderModalItems(items) {
    elements.modalContent.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'items-list';

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';
        const value = typeof item === 'string' ? item : item.url;
        const name = currentModalType === 'emails' && state.generateNames ? (window.NameGenerator?.generate(value) || '') : '';

        div.innerHTML = `
      <div class="item-content">
        ${name ? `<div class="item-name">${name}</div>` : ''}
        <div class="item-value">${value}</div>
      </div>
      <button class="item-copy" title="Copy">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
          <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
    `;
        div.querySelector('.item-copy').addEventListener('click', () => copyToClipboard(value, 'Copied!'));
        list.appendChild(div);
    });

    elements.modalContent.appendChild(list);
}

function filterModalItems() {
    const search = elements.modalSearch.value.toLowerCase();
    const filtered = currentModalData.filter(item => {
        const value = typeof item === 'string' ? item : item.url;
        return value.toLowerCase().includes(search);
    });
    renderModalItems(filtered);
}

// Utility Functions
function copyToClipboard(text, message = 'Copied!') {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        showToast(message, 'success');
    }).catch(() => {
        showToast('Copy failed', 'error');
    });
}

function copyPlatformLinks(platform, message) {
    const links = state.socialsByPlatform[platform] || [];
    if (links.length > 0) {
        copyToClipboard(links.join('\n'), message);
    } else {
        showToast(`No ${platform} links found`, 'error');
    }
}

function showToast(message, type = 'success') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type} show`;
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 2000);
}

// ===== Profile Mode Functions =====

function updateProfileModeUI() {
    if (state.profileMode) {
        // Show Profile Mode UI
        if (elements.extractorToggles) elements.extractorToggles.style.display = 'none';
        if (elements.profileToggles) elements.profileToggles.style.display = 'flex';
        if (elements.resultsContainer) elements.resultsContainer.style.display = 'none';
        if (elements.profileContainer) elements.profileContainer.style.display = 'block';
    } else {
        // Show Extractor Mode UI
        if (elements.extractorToggles) elements.extractorToggles.style.display = 'flex';
        if (elements.profileToggles) elements.profileToggles.style.display = 'none';
        if (elements.profileContainer) elements.profileContainer.style.display = 'none';
    }
}

function setupProfileModeListeners() {
    // Profile Mode toggle (in extractor row)
    if (elements.profileModeToggle) {
        elements.profileModeToggle.addEventListener('change', () => {
            state.profileMode = elements.profileModeToggle.checked;
            saveSettings();
            updateUI();
            if (state.profileMode && state.active) {
                triggerProfileExtraction();
            } else if (state.active) {
                triggerExtraction();
            }
        });
    }

    // Profile Mode toggle (in profile row)
    if (elements.profileModeToggle2) {
        elements.profileModeToggle2.addEventListener('change', () => {
            state.profileMode = elements.profileModeToggle2.checked;
            saveSettings();
            updateUI();
            if (!state.profileMode && state.active) {
                triggerExtraction();
            }
        });
    }

    // Profile Autosave toggle
    if (elements.profileAutosaveToggle) {
        elements.profileAutosaveToggle.addEventListener('change', () => {
            state.profileAutosave = elements.profileAutosaveToggle.checked;
            saveSettings();
        });
    }

    // Copy profile button
    if (elements.copyProfileBtn) {
        elements.copyProfileBtn.addEventListener('click', () => {
            if (state.currentProfile) {
                const summary = formatProfileSummary(state.currentProfile);
                copyToClipboard(summary, 'Profile summary copied!');
            }
        });
    }

    // Save profile button
    if (elements.saveProfileBtn) {
        elements.saveProfileBtn.addEventListener('click', async () => {
            if (state.currentProfile) {
                await Storage.saveProfile(state.currentProfile);
                state.savedProfiles = await Storage.getSavedProfiles();
                renderSavedProfiles();
                showToast('Profile saved!', 'success');
            }
        });
    }

    // Download CSV button
    if (elements.downloadProfilesCsv) {
        elements.downloadProfilesCsv.addEventListener('click', () => {
            if (state.savedProfiles.length > 0) {
                if (window.CSVExporter) {
                    window.CSVExporter.downloadProfiles(state.savedProfiles);
                    showToast('CSV downloaded!', 'success');
                }
            } else {
                showToast('No saved profiles', 'error');
            }
        });
    }

    // Clear saved profiles button
    if (elements.clearSavedProfiles) {
        elements.clearSavedProfiles.addEventListener('click', async () => {
            if (state.savedProfiles.length > 0 && confirm('Clear all saved profiles?')) {
                await Storage.clearAllProfiles();
                state.savedProfiles = [];
                renderSavedProfiles();
                showToast('All profiles cleared', 'success');
            }
        });
    }

    // See all profiles button
    if (elements.seeAllProfiles) {
        elements.seeAllProfiles.addEventListener('click', () => {
            openProfilesModal();
        });
    }
}

async function triggerProfileExtraction() {
    // Prevent multiple concurrent extractions
    if (isExtracting) {
        console.log('[Popup] Profile extraction already in progress');
        return;
    }
    isExtracting = true;
    showLoading();

    // Timeout - 6 seconds max
    const timeoutId = setTimeout(() => {
        if (isExtracting) {
            isExtracting = false;
            showToast('Profile extraction timed out', 'error');
            showProfileNotFound();
        }
    }, 6000);

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.id) {
            clearTimeout(timeoutId);
            isExtracting = false;
            showProfileNotFound();
            return;
        }

        const url = tab.url || '';
        if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url === '') {
            clearTimeout(timeoutId);
            isExtracting = false;
            showProfileNotFound();
            return;
        }

        let response = null;

        try {
            response = await sendMessageWithTimeout(tab.id, { type: 'EXTRACT_PROFILE' }, 4000);
        } catch (e) {
            console.log('[Popup] Direct profile message failed, injecting:', e.message);
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
                await sleep(400);
                response = await sendMessageWithTimeout(tab.id, { type: 'EXTRACT_PROFILE' }, 4000);
            } catch (err) {
                console.error('[Popup] Profile injection failed:', err);
                clearTimeout(timeoutId);
                isExtracting = false;
                showProfileNotFound();
                return;
            }
        }

        clearTimeout(timeoutId);
        isExtracting = false;

        if (response && response.isProfilePage && response.profile) {
            state.currentProfile = response.profile;
            state.isProfilePage = true;

            if (state.profileAutosave) {
                await Storage.saveProfile(response.profile);
                state.savedProfiles = await Storage.getSavedProfiles();
            }

            showProfileResults();
            renderProfileCard();
            renderSavedProfiles();
        } else {
            state.currentProfile = null;
            state.isProfilePage = false;
            showProfileNotFound();
            renderSavedProfiles();
        }
    } catch (error) {
        console.error('[Popup] Profile extraction error:', error);
        clearTimeout(timeoutId);
        isExtracting = false;
        showProfileNotFound();
    }
}

function showProfileNotFound() {
    elements.loadingState.style.display = 'none';
    elements.inactiveState.style.display = 'none';
    elements.resultsContainer.style.display = 'none';
    elements.profileContainer.style.display = 'block';
    elements.notProfileState.style.display = 'flex';
    elements.profileCard.style.display = 'none';
}

function showProfileResults() {
    elements.loadingState.style.display = 'none';
    elements.inactiveState.style.display = 'none';
    elements.resultsContainer.style.display = 'none';
    elements.profileContainer.style.display = 'block';
    elements.notProfileState.style.display = 'none';
    elements.profileCard.style.display = 'block';
}

function renderProfileCard() {
    const profile = state.currentProfile;
    if (!profile) return;

    // Platform badge
    elements.profileBadge.textContent = profile.platform || 'Profile';
    elements.profileBadge.className = 'profile-badge' + (profile.platform === 'Instagram' ? ' instagram' : '');

    // Name
    elements.profileName.textContent = profile.fullName || profile.displayName || profile.username || '-';

    // Username
    elements.profileUsername.textContent = profile.username ? `@${profile.username}` : '';

    // Headline/Bio
    elements.profileHeadline.textContent = profile.headline || profile.bioText || '-';

    // Location
    if (profile.location) {
        elements.profileLocation.textContent = profile.location;
        elements.profileLocation.style.display = 'inline-flex';
    } else {
        elements.profileLocation.style.display = 'none';
    }

    // Company
    if (profile.companyName) {
        elements.profileCompany.textContent = profile.companyName;
        elements.profileCompany.style.display = 'inline-flex';
    } else {
        elements.profileCompany.style.display = 'none';
    }

    // Email
    if (profile.email) {
        elements.profileEmail.textContent = profile.email;
        elements.profileEmailRow.style.display = 'flex';
    } else {
        elements.profileEmailRow.style.display = 'none';
    }

    // Phone
    if (profile.phone) {
        elements.profilePhone.textContent = profile.phone;
        elements.profilePhoneRow.style.display = 'flex';
    } else {
        elements.profilePhoneRow.style.display = 'none';
    }

    // Website
    const websiteUrl = profile.externalWebsiteLink || (profile.links && profile.links[0]);
    if (websiteUrl) {
        elements.profileWebsite.href = websiteUrl;
        elements.profileWebsite.textContent = websiteUrl.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
        elements.profileWebsiteRow.style.display = 'flex';
    } else {
        elements.profileWebsiteRow.style.display = 'none';
    }
}

function renderSavedProfiles() {
    const profiles = state.savedProfiles || [];
    elements.savedProfilesCount.textContent = `(${profiles.length})`;
    elements.savedProfilesList.innerHTML = '';

    if (profiles.length === 0) {
        elements.savedProfilesList.innerHTML = '<div class="empty-state">No saved profiles yet</div>';
        elements.seeAllProfiles.style.display = 'none';
        return;
    }

    // Show first 3 profiles
    profiles.slice(0, 3).forEach(profile => {
        elements.savedProfilesList.appendChild(createProfileItem(profile));
    });

    // See all button
    if (profiles.length > 3) {
        elements.seeAllProfiles.style.display = 'block';
        elements.profilesTotal.textContent = profiles.length;
    } else {
        elements.seeAllProfiles.style.display = 'none';
    }
}

function createProfileItem(profile) {
    const div = document.createElement('div');
    div.className = 'profile-item';

    const name = profile.fullName || profile.displayName || profile.username || 'Unknown';
    const platformClass = profile.platform === 'Instagram' ? 'instagram' : '';

    div.innerHTML = `
        <div class="profile-item-info">
            <div class="profile-item-name">${name}</div>
            <div class="profile-item-meta">
                <span class="profile-item-platform ${platformClass}">${profile.platform || 'Profile'}</span>
                <span>@${profile.username || '-'}</span>
            </div>
        </div>
        <div class="profile-item-actions">
            <button class="copy" title="Copy">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
                    <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/>
                </svg>
            </button>
            <button class="delete" title="Delete">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
    `;

    div.querySelector('.copy').addEventListener('click', () => {
        copyToClipboard(formatProfileSummary(profile), 'Profile copied!');
    });

    div.querySelector('.delete').addEventListener('click', async () => {
        await Storage.deleteProfile(profile.profileUrl || profile.id);
        state.savedProfiles = await Storage.getSavedProfiles();
        renderSavedProfiles();
        showToast('Profile deleted', 'success');
    });

    return div;
}

function formatProfileSummary(profile) {
    if (!profile) return '';

    const lines = [
        `Name: ${profile.fullName || profile.displayName || '-'}`,
        `Username: ${profile.username || '-'}`,
        `Platform: ${profile.platform || '-'}`,
        `URL: ${profile.profileUrl || '-'}`,
        `Email: ${profile.email || '-'}`,
        `Phone: ${profile.phone || '-'}`,
        `Website: ${(profile.links || []).join(', ') || profile.externalWebsiteLink || '-'}`,
        `Bio/Headline: ${profile.headline || profile.bioText || '-'}`
    ];

    if (profile.location) lines.splice(4, 0, `Location: ${profile.location}`);
    if (profile.companyName) lines.splice(5, 0, `Company: ${profile.companyName}`);

    return lines.join('\n');
}

function openProfilesModal() {
    currentModalType = 'profiles';
    currentModalData = state.savedProfiles;
    elements.modalTitle.textContent = `All Saved Profiles (${state.savedProfiles.length})`;
    elements.modalSearch.value = '';

    renderProfileModalItems(state.savedProfiles);

    elements.modalCopy.onclick = () => {
        const allSummaries = state.savedProfiles.map(p => formatProfileSummary(p)).join('\n\n---\n\n');
        copyToClipboard(allSummaries, 'All profiles copied!');
    };

    elements.modalClear.onclick = async () => {
        if (confirm('Clear all saved profiles?')) {
            await Storage.clearAllProfiles();
            state.savedProfiles = [];
            renderSavedProfiles();
            closeModal();
            showToast('All profiles cleared', 'success');
        }
    };

    elements.modalOverlay.style.display = 'flex';
}

function renderProfileModalItems(profiles) {
    elements.modalContent.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'items-list';

    profiles.forEach(profile => {
        const div = document.createElement('div');
        div.className = 'profile-item';
        const name = profile.fullName || profile.displayName || profile.username || 'Unknown';
        const platformClass = profile.platform === 'Instagram' ? 'instagram' : '';

        div.innerHTML = `
            <div class="profile-item-info">
                <div class="profile-item-name">${name}</div>
                <div class="profile-item-meta">
                    <span class="profile-item-platform ${platformClass}">${profile.platform || 'Profile'}</span>
                    <span>@${profile.username || '-'}</span>
                </div>
            </div>
            <div class="profile-item-actions">
                <button class="copy" title="Copy">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
                        <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
                <button class="delete" title="Delete">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        `;

        div.querySelector('.copy').addEventListener('click', () => {
            copyToClipboard(formatProfileSummary(profile), 'Profile copied!');
        });

        div.querySelector('.delete').addEventListener('click', async () => {
            await Storage.deleteProfile(profile.profileUrl || profile.id);
            state.savedProfiles = await Storage.getSavedProfiles();
            renderSavedProfiles();
            renderProfileModalItems(state.savedProfiles);
            elements.modalTitle.textContent = `All Saved Profiles (${state.savedProfiles.length})`;
        });

        list.appendChild(div);
    });

    elements.modalContent.appendChild(list);
}

// Initialize Profile Mode listeners
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(setupProfileModeListeners, 100);
});

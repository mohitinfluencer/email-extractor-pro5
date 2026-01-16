/**
 * Dashboard (Panel) Script for Email Extractor Pro
 * Handles dashboard UI, storage sync, and data display
 */

// Country data for UI dropdown
const PANEL_COUNTRIES = [
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
    { code: 'JP', name: 'Japan', dialCode: '+81' },
    { code: 'AE', name: 'UAE', dialCode: '+971' },
    { code: 'SG', name: 'Singapore', dialCode: '+65' },
    { code: 'PK', name: 'Pakistan', dialCode: '+92' },
    { code: 'BD', name: 'Bangladesh', dialCode: '+880' },
    { code: 'NG', name: 'Nigeria', dialCode: '+234' },
    { code: 'ZA', name: 'South Africa', dialCode: '+27' },
    { code: 'NL', name: 'Netherlands', dialCode: '+31' },
    { code: 'SE', name: 'Sweden', dialCode: '+46' },
    { code: 'CH', name: 'Switzerland', dialCode: '+41' }
];

// State
let state = {
    settings: {},
    results: {},
    saved: {},
    savedProfiles: [],
    currentTab: 'live',
    // Profile Mode
    profileMode: false
};

// DOM cache
const el = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    cacheElements();
    await loadData();
    setupEventListeners();
    initCountryDropdown();
    updateUI();
    renderAll();
    setupStorageSync();
});

function cacheElements() {
    // Toggles
    el.activeToggle = document.getElementById('activeToggle');
    el.emailsToggle = document.getElementById('emailsToggle');
    el.phonesToggle = document.getElementById('phonesToggle');
    el.socialsToggle = document.getElementById('socialsToggle');
    el.serpToggle = document.getElementById('serpToggle');
    el.namesToggle = document.getElementById('namesToggle');
    el.autosaveToggle = document.getElementById('autosaveToggle');

    // Status
    el.statusIndicator = document.getElementById('statusIndicator');

    // Country
    el.countryDropdownBtn = document.getElementById('countryDropdownBtn');
    el.countryDropdown = document.getElementById('countryDropdown');
    el.countryLabel = document.getElementById('countryLabel');
    el.countrySearch = document.getElementById('countrySearch');
    el.countryList = document.getElementById('countryList');
    el.selectAllCountries = document.getElementById('selectAllCountries');
    el.clearCountries = document.getElementById('clearCountries');

    // Actions
    el.saveNowBtn = document.getElementById('saveNowBtn');
    el.refreshBtn = document.getElementById('refreshBtn');

    // Stats
    el.totalEmails = document.getElementById('totalEmails');
    el.totalPhones = document.getElementById('totalPhones');
    el.totalSocials = document.getElementById('totalSocials');

    // Tabs
    el.liveTab = document.getElementById('liveTab');
    el.savedTab = document.getElementById('savedTab');
    el.liveCount = document.getElementById('liveCount');
    el.savedCount = document.getElementById('savedCount');

    // Live sections
    el.liveEmailsCount = document.getElementById('liveEmailsCount');
    el.liveEmailsList = document.getElementById('liveEmailsList');
    el.seeAllLiveEmails = document.getElementById('seeAllLiveEmails');
    el.livePhonesCount = document.getElementById('livePhonesCount');
    el.livePhonesFiltered = document.getElementById('livePhonesFiltered');
    el.livePhonesList = document.getElementById('livePhonesList');
    el.seeAllLivePhones = document.getElementById('seeAllLivePhones');
    el.liveSocialsCount = document.getElementById('liveSocialsCount');
    el.liveSocialsList = document.getElementById('liveSocialsList');
    el.seeAllLiveSocials = document.getElementById('seeAllLiveSocials');
    el.liveSerpSection = document.getElementById('liveSerpSection');
    el.liveSerpCount = document.getElementById('liveSerpCount');
    el.liveSerpList = document.getElementById('liveSerpList');

    // Saved sections
    el.savedTotalLabel = document.getElementById('savedTotalLabel');
    el.savedEmailsCount = document.getElementById('savedEmailsCount');
    el.savedEmailsList = document.getElementById('savedEmailsList');
    el.seeAllSavedEmails = document.getElementById('seeAllSavedEmails');
    el.savedPhonesCount = document.getElementById('savedPhonesCount');
    el.savedPhonesList = document.getElementById('savedPhonesList');
    el.seeAllSavedPhones = document.getElementById('seeAllSavedPhones');
    el.savedSocialsCount = document.getElementById('savedSocialsCount');
    el.savedSocialsList = document.getElementById('savedSocialsList');
    el.seeAllSavedSocials = document.getElementById('seeAllSavedSocials');

    // Modal
    el.modalOverlay = document.getElementById('modalOverlay');
    el.modalTitle = document.getElementById('modalTitle');
    el.modalSearch = document.getElementById('modalSearch');
    el.modalContent = document.getElementById('modalContent');
    el.modalClose = document.getElementById('modalClose');
    el.modalExport = document.getElementById('modalExport');
    el.modalCopy = document.getElementById('modalCopy');

    // Toast
    el.toast = document.getElementById('toast');

    // Profile Mode elements
    el.profileModeToggle = document.getElementById('profileModeToggle');
    el.extractorControls = document.getElementById('extractorControls');
    el.profileModeControls = document.getElementById('profileModeControls');
    el.profileAutosaveToggle = document.getElementById('profileAutosaveToggle');
    el.downloadProfilesCsv = document.getElementById('downloadProfilesCsv');
    el.clearAllProfiles = document.getElementById('clearAllProfiles');
}

async function loadData() {
    const data = await Storage.getAll();
    state.settings = data.settings || {};
    state.results = data.results || {};
    state.saved = data.saved || {};
    state.savedProfiles = data.savedProfiles || [];
    state.profileMode = state.settings.profileMode || false;
}

function updateUI() {
    // Set toggle states
    el.activeToggle.checked = state.settings.active;
    el.emailsToggle.checked = state.settings.extractEmails;
    el.phonesToggle.checked = state.settings.extractPhones;
    el.socialsToggle.checked = state.settings.extractSocials;
    el.serpToggle.checked = state.settings.extractSerp;
    el.namesToggle.checked = state.settings.generateNames;
    el.autosaveToggle.checked = state.settings.autosave;

    // Update status
    updateStatusIndicator();
    updateCountryLabel();
    updateStats();
    updateTabCounts();
}

function updateStatusIndicator() {
    const dot = el.statusIndicator.querySelector('.status-dot');
    const text = el.statusIndicator.querySelector('.status-text');

    if (state.settings.active) {
        dot.classList.add('active');
        text.textContent = 'Auto Extract ON';
        el.statusIndicator.style.background = 'rgba(16, 185, 129, 0.1)';
        el.statusIndicator.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        text.style.color = '#10B981';
    } else {
        dot.classList.remove('active');
        text.textContent = 'Inactive';
        el.statusIndicator.style.background = 'rgba(100, 116, 139, 0.1)';
        el.statusIndicator.style.borderColor = 'rgba(100, 116, 139, 0.3)';
        text.style.color = '#64748B';
    }
}

function updateStats() {
    const emailCount = (state.results.emails?.length || 0) + (state.saved.emails?.length || 0);
    const phoneCount = (state.results.phones?.length || 0) + (state.saved.phones?.length || 0);
    const socialCount = (state.results.socialLinks?.length || 0) + (state.saved.socialLinks?.length || 0);

    el.totalEmails.textContent = emailCount;
    el.totalPhones.textContent = phoneCount;
    el.totalSocials.textContent = socialCount;
}

function updateTabCounts() {
    const liveTotal = (state.results.emails?.length || 0) +
        (state.results.phones?.length || 0) +
        (state.results.socialLinks?.length || 0);
    const savedTotal = (state.saved.emails?.length || 0) +
        (state.saved.phones?.length || 0) +
        (state.saved.socialLinks?.length || 0);

    el.liveCount.textContent = liveTotal;
    el.savedCount.textContent = savedTotal;
}

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Toggle changes
    const toggles = [
        { el: el.activeToggle, key: 'active' },
        { el: el.emailsToggle, key: 'extractEmails' },
        { el: el.phonesToggle, key: 'extractPhones' },
        { el: el.socialsToggle, key: 'extractSocials' },
        { el: el.serpToggle, key: 'extractSerp' },
        { el: el.namesToggle, key: 'generateNames' },
        { el: el.autosaveToggle, key: 'autosave' }
    ];

    toggles.forEach(({ el: toggle, key }) => {
        toggle.addEventListener('change', async () => {
            state.settings[key] = toggle.checked;
            await Storage.saveSettings(state.settings);
            updateStatusIndicator();
        });
    });

    // Country dropdown
    el.countryDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        el.countryDropdown.classList.toggle('open');
    });

    el.countrySearch.addEventListener('input', filterCountries);
    el.selectAllCountries.addEventListener('click', selectAllCountries);
    el.clearCountries.addEventListener('click', clearAllCountries);

    document.addEventListener('click', (e) => {
        if (!el.countryDropdown.contains(e.target) && e.target !== el.countryDropdownBtn) {
            el.countryDropdown.classList.remove('open');
        }
    });

    // Actions
    el.saveNowBtn.addEventListener('click', saveAllNow);
    el.refreshBtn.addEventListener('click', refreshData);

    // Export CSV buttons
    const exportLiveBtn = document.getElementById('exportLiveCSV');
    const exportSavedBtn = document.getElementById('exportSavedCSV');

    exportLiveBtn?.addEventListener('click', () => {
        const hasData = (state.results.emails?.length || 0) + (state.results.phones?.length || 0) + (state.results.socialLinks?.length || 0) > 0;
        if (!hasData) {
            showToast('No live results to export', 'error');
            return;
        }
        const data = {
            emails: state.results.emails || [],
            phones: state.results.phones || [],
            socialLinks: state.results.socialLinks || []
        };
        const success = CSVExporter.downloadAllLeads(data, {}, state.settings.generateNames);
        if (success) showToast('Live Results CSV downloaded!', 'success');
    });

    exportSavedBtn?.addEventListener('click', () => {
        const hasData = (state.saved.emails?.length || 0) + (state.saved.phones?.length || 0) + (state.saved.socialLinks?.length || 0) > 0;
        if (!hasData) {
            showToast('No saved leads to export', 'error');
            return;
        }
        const success = CSVExporter.downloadSavedLeads(state.saved, state.settings.generateNames);
        if (success) showToast('Saved Leads CSV downloaded!', 'success');
    });

    // Live copy/clear
    document.getElementById('copyLiveEmails').addEventListener('click', () =>
        copyToClipboard(state.results.emails?.join('\n'), 'Emails copied!'));
    document.getElementById('clearLiveEmails').addEventListener('click', async () => {
        await Storage.clearResults('emails');
        state.results.emails = [];
        state.results.invalidEmails = [];
        renderLiveEmails();
        updateStats();
        updateTabCounts();
    });

    document.getElementById('copyLivePhones').addEventListener('click', () =>
        copyToClipboard(state.results.phones?.join('\n'), 'Phones copied!'));
    document.getElementById('clearLivePhones').addEventListener('click', async () => {
        await Storage.clearResults('phones');
        state.results.phones = [];
        renderLivePhones();
        updateStats();
        updateTabCounts();
    });

    document.getElementById('copyLiveSocials').addEventListener('click', () =>
        copyToClipboard(state.results.socialLinks?.map(l => l.url).join('\n'), 'Social links copied!'));
    document.getElementById('copyLiveWA').addEventListener('click', () =>
        copyPlatformLinks('whatsapp', state.results.socialsByPlatform, 'WhatsApp links copied!'));
    document.getElementById('copyLiveLI').addEventListener('click', () =>
        copyPlatformLinks('linkedin', state.results.socialsByPlatform, 'LinkedIn links copied!'));
    document.getElementById('clearLiveSocials').addEventListener('click', async () => {
        await Storage.clearResults('socialLinks');
        state.results.socialLinks = [];
        state.results.socialsByPlatform = {};
        renderLiveSocials();
        updateStats();
        updateTabCounts();
    });

    document.getElementById('copyLiveSerp').addEventListener('click', () =>
        copyToClipboard(state.results.serpLinks?.linkedin?.join('\n'), 'SERP links copied!'));

    // Saved copy/clear
    document.getElementById('copySavedEmails').addEventListener('click', () =>
        copyToClipboard(state.saved.emails?.join('\n'), 'Emails copied!'));
    document.getElementById('clearSavedEmails').addEventListener('click', async () => {
        await Storage.clearSaved('emails');
        state.saved.emails = [];
        renderSavedEmails();
        updateStats();
        updateTabCounts();
        updateSavedTotal();
    });

    document.getElementById('copySavedPhones').addEventListener('click', () =>
        copyToClipboard(state.saved.phones?.join('\n'), 'Phones copied!'));
    document.getElementById('clearSavedPhones').addEventListener('click', async () => {
        await Storage.clearSaved('phones');
        state.saved.phones = [];
        renderSavedPhones();
        updateStats();
        updateTabCounts();
        updateSavedTotal();
    });

    document.getElementById('copySavedSocials').addEventListener('click', () =>
        copyToClipboard(state.saved.socialLinks?.map(l => l.url || l).join('\n'), 'Social links copied!'));
    document.getElementById('clearSavedSocials').addEventListener('click', async () => {
        await Storage.clearSaved('socialLinks');
        state.saved.socialLinks = [];
        renderSavedSocials();
        updateStats();
        updateTabCounts();
        updateSavedTotal();
    });

    document.getElementById('clearAllSaved').addEventListener('click', async () => {
        if (confirm('Clear all saved leads? This cannot be undone.')) {
            await Storage.clearSaved('all');
            state.saved = { emails: [], phones: [], socialLinks: [], serpLinks: { linkedin: [] } };
            renderSavedEmails();
            renderSavedPhones();
            renderSavedSocials();
            updateStats();
            updateTabCounts();
            updateSavedTotal();
            showToast('All saved leads cleared', 'success');
        }
    });

    // See all buttons
    el.seeAllLiveEmails.addEventListener('click', () => openModal('emails', state.results.emails, false));
    el.seeAllLivePhones.addEventListener('click', () => openModal('phones', state.results.phones, false));
    el.seeAllLiveSocials.addEventListener('click', () => openModal('socials', state.results.socialLinks, false));
    el.seeAllSavedEmails.addEventListener('click', () => openModal('emails', state.saved.emails, true));
    el.seeAllSavedPhones.addEventListener('click', () => openModal('phones', state.saved.phones, true));
    el.seeAllSavedSocials.addEventListener('click', () => openModal('socials', state.saved.socialLinks, true));

    // Modal
    el.modalClose.addEventListener('click', closeModal);
    el.modalOverlay.addEventListener('click', (e) => { if (e.target === el.modalOverlay) closeModal(); });
    el.modalSearch.addEventListener('input', filterModalItems);
}

function switchTab(tab) {
    state.currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tab}Tab`);
    });
}

// Storage sync - Real-time updates from popup
function setupStorageSync() {
    Storage.onChange((changes) => {
        if (changes.settings) {
            state.settings = changes.settings.newValue;
            updateUI();
            // Re-render country dropdown to reflect new selection
            initCountryDropdown();
        }
        if (changes.results) {
            state.results = changes.results.newValue || {};
            renderLiveResults();
            updateStats();
            updateTabCounts();
        }
        if (changes.saved) {
            state.saved = changes.saved.newValue || {};
            renderSavedResults();
            updateStats();
            updateTabCounts();
            updateSavedTotal();
        }
        if (changes.savedProfiles) {
            state.savedProfiles = changes.savedProfiles.newValue || [];
            // Update profile mode if active
            if (state.profileMode) {
                updateProfileModeUI();
            }
        }
    });
}

// Country dropdown
function initCountryDropdown() {
    el.countryList.innerHTML = '';
    PANEL_COUNTRIES.forEach(country => {
        const item = document.createElement('div');
        item.className = 'country-item';
        item.innerHTML = `
      <input type="checkbox" id="country-${country.code}" value="${country.code}"
        ${state.settings.selectedCountries?.includes(country.code) ? 'checked' : ''}>
      <label for="country-${country.code}">${country.name} (${country.dialCode})</label>
    `;
        item.querySelector('input').addEventListener('change', async (e) => {
            if (e.target.checked) {
                if (!state.settings.selectedCountries.includes(country.code)) {
                    state.settings.selectedCountries.push(country.code);
                }
            } else {
                state.settings.selectedCountries = state.settings.selectedCountries.filter(c => c !== country.code);
            }
            await Storage.saveSettings(state.settings);
            updateCountryLabel();
        });
        el.countryList.appendChild(item);
    });

    // Prevent page scrolling when scrolling inside country list
    el.countryList.addEventListener('wheel', (e) => {
        const { scrollTop, scrollHeight, clientHeight } = el.countryList;
        const atTop = scrollTop === 0 && e.deltaY < 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight && e.deltaY > 0;
        if (!atTop && !atBottom) {
            e.stopPropagation();
        }
    }, { passive: true });

    updateCountryLabel();
}

function updateCountryLabel() {
    const count = state.settings.selectedCountries?.length || 0;
    if (count === 0) {
        el.countryLabel.textContent = 'Select countries';
    } else if (count === 1) {
        const country = PANEL_COUNTRIES.find(c => c.code === state.settings.selectedCountries[0]);
        el.countryLabel.textContent = country ? `${country.name} (${country.dialCode})` : state.settings.selectedCountries[0];
    } else {
        el.countryLabel.textContent = `Selected: ${count} countries`;
    }
}

function filterCountries() {
    const search = el.countrySearch.value.toLowerCase();
    el.countryList.querySelectorAll('.country-item').forEach(item => {
        const label = item.querySelector('label').textContent.toLowerCase();
        item.style.display = label.includes(search) ? 'flex' : 'none';
    });
}

async function selectAllCountries() {
    state.settings.selectedCountries = PANEL_COUNTRIES.map(c => c.code);
    el.countryList.querySelectorAll('input').forEach(input => input.checked = true);
    await Storage.saveSettings(state.settings);
    updateCountryLabel();
}

async function clearAllCountries() {
    state.settings.selectedCountries = [];
    el.countryList.querySelectorAll('input').forEach(input => input.checked = false);
    await Storage.saveSettings(state.settings);
    updateCountryLabel();
}

// Actions
async function saveAllNow() {
    await Storage.autosaveResults(state.results);
    const data = await Storage.getSaved();
    state.saved = data;
    renderSavedResults();
    updateStats();
    updateTabCounts();
    updateSavedTotal();
    showToast('All results saved!', 'success');
}

async function refreshData() {
    await loadData();
    renderAll();
    showToast('Data refreshed!', 'success');
}

// Render functions
function renderAll() {
    renderLiveResults();
    renderSavedResults();
    updateSavedTotal();
}

function renderLiveResults() {
    renderLiveEmails();
    renderLivePhones();
    renderLiveSocials();
    renderLiveSerp();
}

function renderSavedResults() {
    renderSavedEmails();
    renderSavedPhones();
    renderSavedSocials();
}

function renderLiveEmails() {
    const emails = state.results.emails || [];
    el.liveEmailsCount.textContent = `(${emails.length})`;
    el.liveEmailsList.innerHTML = '';

    if (emails.length === 0) {
        el.liveEmailsList.innerHTML = '<div class="empty-state"><p>No emails extracted yet</p></div>';
        el.seeAllLiveEmails.style.display = 'none';
        return;
    }

    emails.slice(0, 3).forEach(email => {
        el.liveEmailsList.appendChild(createEmailItem(email));
    });

    if (emails.length > 3) {
        el.seeAllLiveEmails.style.display = 'block';
        el.seeAllLiveEmails.querySelector('span').textContent = emails.length;
    } else {
        el.seeAllLiveEmails.style.display = 'none';
    }
}

function renderLivePhones() {
    const phones = state.results.phones || [];
    el.livePhonesCount.textContent = `(${phones.length})`;
    el.livePhonesFiltered.textContent = state.results.phonesFiltered ? `FILTERED: ${state.results.phonesFiltered}` : '';
    el.livePhonesList.innerHTML = '';

    if (phones.length === 0) {
        el.livePhonesList.innerHTML = '<div class="empty-state"><p>No phones extracted yet</p></div>';
        el.seeAllLivePhones.style.display = 'none';
        return;
    }

    phones.slice(0, 3).forEach(phone => {
        el.livePhonesList.appendChild(createPhoneItem(phone));
    });

    if (phones.length > 3) {
        el.seeAllLivePhones.style.display = 'block';
        el.seeAllLivePhones.querySelector('span').textContent = phones.length;
    } else {
        el.seeAllLivePhones.style.display = 'none';
    }
}

function renderLiveSocials() {
    const platforms = ['whatsapp', 'instagram', 'tiktok', 'linkedin', 'twitter', 'youtube', 'facebook', 'website'];
    const platformNames = {
        whatsapp: 'WhatsApp', instagram: 'Instagram', tiktok: 'TikTok', linkedin: 'LinkedIn',
        twitter: 'Twitter/X', youtube: 'YouTube', facebook: 'Facebook', website: 'Website'
    };
    const platformIcons = {
        whatsapp: 'WA', instagram: 'IG', tiktok: 'TT', linkedin: 'LI',
        twitter: 'X', youtube: 'YT', facebook: 'FB', website: 'WEB'
    };

    const byPlatform = state.results.socialsByPlatform || {};
    let totalCount = 0;
    el.liveSocialsList.innerHTML = '';

    platforms.forEach(platform => {
        const links = byPlatform[platform] || [];
        if (links.length > 0) {
            totalCount += links.length;
            const card = document.createElement('div');
            card.className = 'platform-card';
            card.innerHTML = `
        <div class="platform-icon ${platform}">${platformIcons[platform]}</div>
        <div class="platform-name">${platformNames[platform]}</div>
        <div class="platform-count">${links.length} link${links.length > 1 ? 's' : ''}</div>
      `;
            card.addEventListener('click', () => openModal('socials', links.map(url => ({ platform, url })), false, platformNames[platform]));
            el.liveSocialsList.appendChild(card);
        }
    });

    el.liveSocialsCount.textContent = `(${totalCount})`;

    if (totalCount === 0) {
        el.liveSocialsList.innerHTML = '<div class="empty-state"><p>No social links extracted yet</p></div>';
    }

    el.seeAllLiveSocials.style.display = totalCount > 8 ? 'block' : 'none';
    if (totalCount > 8) el.seeAllLiveSocials.querySelector('span').textContent = totalCount;
}

function renderLiveSerp() {
    const links = state.results.serpLinks?.linkedin || [];

    if (state.settings.extractSerp && links.length > 0) {
        el.liveSerpSection.style.display = 'block';
        el.liveSerpCount.textContent = `(${links.length})`;
        el.liveSerpList.innerHTML = '';

        links.slice(0, 3).forEach(link => {
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
            el.liveSerpList.appendChild(item);
        });
    } else {
        el.liveSerpSection.style.display = 'none';
    }
}

function renderSavedEmails() {
    const emails = state.saved.emails || [];
    el.savedEmailsCount.textContent = `(${emails.length})`;
    el.savedEmailsList.innerHTML = '';

    if (emails.length === 0) {
        el.savedEmailsList.innerHTML = '<div class="empty-state"><p>No saved emails</p></div>';
        el.seeAllSavedEmails.style.display = 'none';
        return;
    }

    emails.slice(0, 3).forEach(email => {
        el.savedEmailsList.appendChild(createEmailItem(email, true));
    });

    if (emails.length > 3) {
        el.seeAllSavedEmails.style.display = 'block';
        el.seeAllSavedEmails.querySelector('span').textContent = emails.length;
    } else {
        el.seeAllSavedEmails.style.display = 'none';
    }
}

function renderSavedPhones() {
    const phones = state.saved.phones || [];
    el.savedPhonesCount.textContent = `(${phones.length})`;
    el.savedPhonesList.innerHTML = '';

    if (phones.length === 0) {
        el.savedPhonesList.innerHTML = '<div class="empty-state"><p>No saved phones</p></div>';
        el.seeAllSavedPhones.style.display = 'none';
        return;
    }

    phones.slice(0, 3).forEach(phone => {
        el.savedPhonesList.appendChild(createPhoneItem(phone, true));
    });

    if (phones.length > 3) {
        el.seeAllSavedPhones.style.display = 'block';
        el.seeAllSavedPhones.querySelector('span').textContent = phones.length;
    } else {
        el.seeAllSavedPhones.style.display = 'none';
    }
}

function renderSavedSocials() {
    const links = state.saved.socialLinks || [];
    el.savedSocialsCount.textContent = `(${links.length})`;
    el.savedSocialsList.innerHTML = '';

    if (links.length === 0) {
        el.savedSocialsList.innerHTML = '<div class="empty-state"><p>No saved social links</p></div>';
        el.seeAllSavedSocials.style.display = 'none';
        return;
    }

    // Group by platform
    const byPlatform = {};
    links.forEach(l => {
        const platform = l.platform || 'website';
        if (!byPlatform[platform]) byPlatform[platform] = [];
        byPlatform[platform].push(l.url || l);
    });

    const platformNames = {
        whatsapp: 'WhatsApp', instagram: 'Instagram', tiktok: 'TikTok', linkedin: 'LinkedIn',
        twitter: 'Twitter/X', youtube: 'YouTube', facebook: 'Facebook', website: 'Website', unknown: 'Other'
    };
    const platformIcons = {
        whatsapp: 'WA', instagram: 'IG', tiktok: 'TT', linkedin: 'LI',
        twitter: 'X', youtube: 'YT', facebook: 'FB', website: 'WEB', unknown: '?'
    };

    Object.entries(byPlatform).forEach(([platform, urls]) => {
        const card = document.createElement('div');
        card.className = 'platform-card';
        card.innerHTML = `
      <div class="platform-icon ${platform}">${platformIcons[platform] || '?'}</div>
      <div class="platform-name">${platformNames[platform] || platform}</div>
      <div class="platform-count">${urls.length} link${urls.length > 1 ? 's' : ''}</div>
    `;
        card.addEventListener('click', () => openModal('socials', urls.map(url => ({ platform, url })), true, platformNames[platform]));
        el.savedSocialsList.appendChild(card);
    });

    el.seeAllSavedSocials.style.display = links.length > 8 ? 'block' : 'none';
    if (links.length > 8) el.seeAllSavedSocials.querySelector('span').textContent = links.length;
}

function updateSavedTotal() {
    const total = (state.saved.emails?.length || 0) +
        (state.saved.phones?.length || 0) +
        (state.saved.socialLinks?.length || 0);
    el.savedTotalLabel.textContent = `${total} total leads saved`;
}

// Item creators
function createEmailItem(emailData, isSaved = false) {
    const div = document.createElement('div');
    div.className = 'item';

    // Handle both string and object formats
    let email, name;
    if (typeof emailData === 'string') {
        email = emailData;
        name = state.settings.generateNames ? (window.NameGenerator?.generate(email) || '') : '';
    } else if (emailData && typeof emailData === 'object') {
        email = emailData.email || '';
        name = emailData.name || (state.settings.generateNames ? (window.NameGenerator?.generate(email) || '') : '');
    } else {
        email = '';
        name = '';
    }

    // Skip if no valid email
    if (!email) {
        div.innerHTML = '<div class="item-content"><div class="item-value">Invalid email data</div></div>';
        return div;
    }

    div.innerHTML = `
    <div class="item-content">
      ${name ? `<div class="item-name">${name}</div>` : ''}
      <div class="item-value">${email}</div>
    </div>
    <div class="item-actions">
      <button class="item-copy" title="Copy">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
          <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
      ${isSaved ? `<button class="item-delete" title="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>` : ''}
    </div>
  `;

    div.querySelector('.item-copy').addEventListener('click', () => copyToClipboard(email, 'Email copied!'));
    if (isSaved) {
        div.querySelector('.item-delete').addEventListener('click', async () => {
            await Storage.deleteSavedItem('emails', emailData);
            state.saved.emails = state.saved.emails.filter(e => {
                const eEmail = typeof e === 'string' ? e : e?.email;
                return eEmail !== email;
            });
            renderSavedEmails();
            updateStats();
            updateTabCounts();
            updateSavedTotal();
        });
    }
    return div;
}

function createPhoneItem(phone, isSaved = false) {
    const div = document.createElement('div');
    div.className = 'item';

    div.innerHTML = `
    <div class="item-content">
      <div class="item-value">${phone.startsWith('+') ? phone : '+' + phone}</div>
    </div>
    <div class="item-actions">
      <button class="item-copy" title="Copy">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
          <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
      ${isSaved ? `<button class="item-delete" title="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>` : ''}
    </div>
  `;

    div.querySelector('.item-copy').addEventListener('click', () => copyToClipboard(phone, 'Phone copied!'));
    if (isSaved) {
        div.querySelector('.item-delete').addEventListener('click', async () => {
            await Storage.deleteSavedItem('phones', phone);
            state.saved.phones = state.saved.phones.filter(p => p !== phone);
            renderSavedPhones();
            updateStats();
            updateTabCounts();
            updateSavedTotal();
        });
    }
    return div;
}

// Modal system
let modalData = { type: '', items: [], isSaved: false };

function openModal(type, items, isSaved = false, title = '') {
    modalData = { type, items: items || [], isSaved };

    const typeNames = { emails: 'Emails', phones: 'Phones', socials: 'Social Links' };
    el.modalTitle.textContent = title || `All ${typeNames[type]} (${items.length})`;
    el.modalSearch.value = '';

    renderModalItems(items);

    el.modalCopy.onclick = () => {
        let data;
        if (type === 'emails') {
            // Handle both string and object email formats
            data = items.map(e => typeof e === 'string' ? e : (e?.email || '')).filter(Boolean).join('\n');
        } else if (type === 'socials') {
            data = items.map(l => l.url || l).join('\n');
        } else {
            data = items.map(p => typeof p === 'string' ? p : (p?.phone || '')).filter(Boolean).join('\n');
        }
        copyToClipboard(data, 'Copied to clipboard!');
    };

    el.modalExport.onclick = () => exportCSV(type, items);

    el.modalOverlay.classList.add('open');
}

function closeModal() {
    el.modalOverlay.classList.remove('open');
    modalData = { type: '', items: [], isSaved: false };
}

function renderModalItems(items) {
    el.modalContent.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'items-list';

    items.forEach(item => {
        // Handle different item formats
        let value, name = '';

        if (modalData.type === 'emails') {
            // Email can be string or object { email, name }
            if (typeof item === 'string') {
                value = item;
            } else if (item && typeof item === 'object') {
                value = item.email || '';
                name = item.name || '';
            } else {
                return; // Skip invalid items
            }
            if (!value) return;

            // Generate name if enabled and not already set
            if (!name && state.settings.generateNames) {
                name = window.NameGenerator?.generate(value) || '';
            }
        } else if (modalData.type === 'phones') {
            value = typeof item === 'string' ? item : (item?.phone || '');
            if (!value) return;
        } else {
            // Socials
            value = typeof item === 'string' ? item : item.url;
            if (!value) return;
        }

        const div = document.createElement('div');
        div.className = 'item';

        div.innerHTML = `
      <div class="item-content">
        ${name ? `<div class="item-name">${name}</div>` : ''}
        <div class="item-value">${value}</div>
      </div>
      <div class="item-actions">
        <button class="item-copy" title="Copy">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        ${modalData.isSaved ? `<button class="item-delete" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>` : ''}
      </div>
    `;

        div.querySelector('.item-copy').addEventListener('click', () => copyToClipboard(value, 'Copied!'));

        if (modalData.isSaved) {
            div.querySelector('.item-delete').addEventListener('click', async () => {
                await Storage.deleteSavedItem(modalData.type, item);
                modalData.items = modalData.items.filter(i => {
                    const iValue = typeof i === 'string' ? i : (i?.email || i?.url || i?.phone || '');
                    return iValue !== value;
                });
                renderModalItems(modalData.items);
                await loadData();
                renderAll();
            });
        }

        list.appendChild(div);
    });

    el.modalContent.appendChild(list);
}


function filterModalItems() {
    const search = el.modalSearch.value.toLowerCase();
    const filtered = modalData.items.filter(item => {
        // Handle both string and object formats
        let value;
        if (typeof item === 'string') {
            value = item;
        } else if (item && typeof item === 'object') {
            value = item.email || item.url || item.phone || '';
        } else {
            value = '';
        }
        return value.toLowerCase().includes(search);
    });
    renderModalItems(filtered);
}

function exportCSV(type, items) {
    let csv = '';

    if (type === 'emails') {
        csv = 'Email,Name\n';
        items.forEach(emailData => {
            // Handle both string and object formats
            const email = typeof emailData === 'string' ? emailData : (emailData?.email || '');
            if (!email) return;
            const name = (typeof emailData === 'object' && emailData?.name)
                ? emailData.name
                : (window.NameGenerator?.generate(email) || '');
            csv += `"${email}","${name}"\n`;
        });
    } else if (type === 'phones') {
        csv = 'Phone\n';
        items.forEach(phoneData => {
            const phone = typeof phoneData === 'string' ? phoneData : (phoneData?.phone || '');
            if (phone) csv += `"${phone}"\n`;
        });
    } else if (type === 'socials') {
        csv = 'Platform,URL\n';
        items.forEach(item => {
            const platform = item.platform || 'unknown';
            const url = item.url || item;
            csv += `"${platform}","${url}"\n`;
        });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported!', 'success');
}

// Utilities
function copyToClipboard(text, message = 'Copied!') {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => showToast(message, 'success'))
        .catch(() => showToast('Copy failed', 'error'));
}

function copyPlatformLinks(platform, byPlatform, message) {
    const links = byPlatform?.[platform] || [];
    if (links.length > 0) {
        copyToClipboard(links.join('\n'), message);
    } else {
        showToast(`No ${platform} links found`, 'error');
    }
}

function showToast(message, type = 'success') {
    el.toast.textContent = message;
    el.toast.className = `toast ${type} show`;
    setTimeout(() => el.toast.classList.remove('show'), 2000);
}

// ===== Profile Mode Functions =====

function setupProfileModeListeners() {
    // Profile Mode toggle
    if (el.profileModeToggle) {
        el.profileModeToggle.addEventListener('change', async () => {
            state.settings.profileMode = el.profileModeToggle.checked;
            state.profileMode = el.profileModeToggle.checked;
            await Storage.saveSettings(state.settings);
            updateProfileModeUI();
        });
    }

    // Profile Autosave toggle
    if (el.profileAutosaveToggle) {
        el.profileAutosaveToggle.addEventListener('change', async () => {
            state.settings.profileAutosave = el.profileAutosaveToggle.checked;
            await Storage.saveSettings(state.settings);
        });
    }

    // Download profiles CSV
    if (el.downloadProfilesCsv) {
        el.downloadProfilesCsv.addEventListener('click', () => {
            if (state.savedProfiles.length > 0) {
                if (window.CSVExporter) {
                    window.CSVExporter.downloadProfiles(state.savedProfiles);
                    showToast('Profiles CSV downloaded!', 'success');
                }
            } else {
                showToast('No saved profiles to export', 'error');
            }
        });
    }

    // Clear all profiles
    if (el.clearAllProfiles) {
        el.clearAllProfiles.addEventListener('click', async () => {
            if (state.savedProfiles.length > 0 && confirm('Clear all saved profiles? This cannot be undone.')) {
                await Storage.clearAllProfiles();
                state.savedProfiles = [];
                showToast('All profiles cleared', 'success');
            }
        });
    }
}

function updateProfileModeUI() {
    const isProfileMode = state.settings.profileMode || state.profileMode;

    // Update toggle state
    if (el.profileModeToggle) {
        el.profileModeToggle.checked = isProfileMode;
    }
    if (el.profileAutosaveToggle) {
        el.profileAutosaveToggle.checked = state.settings.profileAutosave || false;
    }

    // Toggle visibility of controls
    if (el.extractorControls) {
        // Hide extraction controls in profile mode
        const extractionControls = document.querySelectorAll('.control-section:not(.profile-mode-controls)');
        extractionControls.forEach(ctrl => {
            if (!ctrl.classList.contains('profile-mode-group')) {
                ctrl.style.display = isProfileMode ? 'none' : 'block';
            }
        });

        if (el.extractorControls) {
            el.extractorControls.style.display = isProfileMode ? 'none' : 'block';
        }
    }

    if (el.profileModeControls) {
        el.profileModeControls.style.display = isProfileMode ? 'block' : 'none';
    }

    // Toggle tabs and main content for profile mode
    const tabsHeader = document.querySelector('.tabs-header');
    const liveTab = el.liveTab;
    const savedTab = el.savedTab;

    if (isProfileMode) {
        // In profile mode, show simplified view
        if (tabsHeader) tabsHeader.style.display = 'none';
        if (liveTab) liveTab.style.display = 'none';
        if (savedTab) savedTab.style.display = 'none';
    } else {
        // In extractor mode, show normal view
        if (tabsHeader) tabsHeader.style.display = 'flex';
        if (liveTab) liveTab.classList.toggle('active', state.currentTab === 'live');
        if (savedTab) savedTab.classList.toggle('active', state.currentTab === 'saved');
    }
}

async function loadProfileModeData() {
    state.savedProfiles = await Storage.getSavedProfiles();
    state.profileMode = state.settings.profileMode || false;
}

// Initialize profile mode listeners after DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        await loadProfileModeData();
        setupProfileModeListeners();
        updateProfileModeUI();
    }, 100);
});

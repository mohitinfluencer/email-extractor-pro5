/**
 * Storage Utility - Single Source of Truth
 * Handles all storage operations for popup and dashboard sync
 * 
 * IMPORTANT: 
 * - results = current page data (replaced on each extraction)
 * - saved = cumulative autosaved data (appends, never overwrites)
 */

const Storage = {
    // Debug mode flag
    DEBUG: false,

    // Default structure
    DEFAULT_STATE: {
        settings: {
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
            profileAutosave: false
        },
        results: {
            emails: [],
            invalidEmails: [],
            phones: [],
            phonesFiltered: 0,
            socialLinks: [],
            socialsByPlatform: {},
            serpLinks: { linkedin: [] },
            // Profile result
            currentProfile: null,
            isProfilePage: false
        },
        saved: {
            emails: [],
            phones: [],
            socialLinks: [],
            serpLinks: { linkedin: [] }
        },
        // Saved profiles (separate bucket)
        savedProfiles: []
    },

    // ==================== CORE MERGE FUNCTIONS ====================

    /**
     * Merge two arrays with deduplication using a key function
     * @param {Array} oldList - Existing items
     * @param {Array} newList - New items to add
     * @param {Function} keyFn - Function to extract unique key from item
     * @returns {Array} Merged unique items
     */
    mergeUnique(oldList, newList, keyFn) {
        const map = new Map();
        // Add old items first
        for (const item of (oldList || [])) {
            const key = keyFn(item);
            if (key) map.set(key, item);
        }
        // Add new items (will overwrite duplicates with newer version)
        for (const item of (newList || [])) {
            const key = keyFn(item);
            if (key) map.set(key, item);
        }
        return Array.from(map.values());
    },

    /**
     * MAIN FUNCTION: Merge results into saved (APPEND, NEVER OVERWRITE)
     * This is the critical function that fixes autosave accumulation
     * 
     * @param {Object} existingSaved - Current saved object from storage
     * @param {Object} newResults - New extraction results to merge
     * @returns {Object} Merged saved object
     */
    mergeSavedWithResults(existingSaved, newResults) {
        const saved = existingSaved || this.DEFAULT_STATE.saved;
        const results = newResults || {};

        if (this.DEBUG) {
            console.log('[Autosave] === MERGE START ===');
            console.log('[Autosave] saved before:', {
                emails: saved.emails?.length || 0,
                phones: saved.phones?.length || 0,
                socialLinks: saved.socialLinks?.length || 0,
                serpLinks: saved.serpLinks?.linkedin?.length || 0
            });
            console.log('[Autosave] results to merge:', {
                emails: results.emails?.length || 0,
                phones: results.phones?.length || 0,
                socialLinks: results.socialLinks?.length || 0,
                serpLinks: results.serpLinks?.linkedin?.length || 0
            });
        }

        // Merge emails (dedupe by lowercase)
        const mergedEmails = this.mergeUnique(
            saved.emails,
            results.emails,
            (email) => email?.toLowerCase?.() || email
        );

        // Merge phones (dedupe by normalized E.164)
        const mergedPhones = this.mergeUnique(
            saved.phones,
            results.phones,
            (phone) => this.normalizePhone(phone)
        );

        // Merge social links (dedupe by canonical URL)
        const mergedSocialLinks = this.mergeUnique(
            saved.socialLinks,
            results.socialLinks,
            (link) => this.normalizeUrl(link?.url || link)
        );

        // Merge SERP links (dedupe by canonical URL)
        const existingSerp = saved.serpLinks?.linkedin || [];
        const newSerp = results.serpLinks?.linkedin || [];
        const mergedSerpLinks = this.mergeUnique(
            existingSerp,
            newSerp,
            (link) => this.normalizeUrl(link)
        );

        const mergedSaved = {
            emails: mergedEmails,
            phones: mergedPhones,
            socialLinks: mergedSocialLinks,
            serpLinks: { linkedin: mergedSerpLinks }
        };

        if (this.DEBUG) {
            console.log('[Autosave] saved after merge:', {
                emails: mergedSaved.emails.length,
                phones: mergedSaved.phones.length,
                socialLinks: mergedSaved.socialLinks.length,
                serpLinks: mergedSaved.serpLinks.linkedin.length
            });
            console.log('[Autosave] === MERGE END ===');
        }

        return mergedSaved;
    },

    /**
     * Autosave results using merge (APPEND, NEVER OVERWRITE)
     * This replaces the old autosaveResults function
     */
    async autosaveResults(results) {
        try {
            // Step 1: Load existing saved data
            const existingSaved = await this.getSaved();

            // Step 2: Merge results into saved (append, dedupe)
            const mergedSaved = this.mergeSavedWithResults(existingSaved, results);

            // Step 3: Save merged data back to storage
            await chrome.storage.local.set({ saved: mergedSaved });

            if (this.DEBUG) {
                console.log('[Autosave] Successfully saved merged data');
            }

            return mergedSaved;
        } catch (error) {
            console.error('[Autosave] Error:', error);
            return null;
        }
    },

    // ==================== NORMALIZATION FUNCTIONS ====================

    /**
     * Normalize phone to E.164 format for comparison
     */
    normalizePhone(phone) {
        if (!phone) return '';
        let digits = String(phone).replace(/\D/g, '');
        // Remove common prefixes for comparison
        if (digits.startsWith('00')) digits = digits.substring(2);
        if (digits.startsWith('91') && digits.length === 12) digits = digits.substring(2);
        if (digits.startsWith('1') && digits.length === 11) digits = digits.substring(1);
        if (digits.startsWith('44') && digits.length >= 12) digits = digits.substring(2);
        return digits;
    },

    /**
     * Normalize URL for comparison (remove tracking params, etc.)
     */
    normalizeUrl(url) {
        if (!url) return '';
        try {
            const parsed = new URL(url);
            // Remove www. prefix
            let hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();
            // Remove trailing slashes
            let pathname = parsed.pathname.replace(/\/+$/, '').toLowerCase();
            // Remove common tracking parameters
            const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                'fbclid', 'gclid', 'igshid', 'si', 'ref', 'source', 'ref_src', 'ref_url'];
            trackingParams.forEach(p => parsed.searchParams.delete(p));
            const search = parsed.searchParams.toString();
            return hostname + pathname + (search ? '?' + search : '');
        } catch {
            return String(url).toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
        }
    },

    // ==================== STANDARD GETTERS ====================

    /**
     * Get all storage data
     */
    async getAll() {
        try {
            const data = await chrome.storage.local.get(['settings', 'results', 'saved']);
            return {
                settings: { ...this.DEFAULT_STATE.settings, ...data.settings },
                results: { ...this.DEFAULT_STATE.results, ...data.results },
                saved: { ...this.DEFAULT_STATE.saved, ...data.saved }
            };
        } catch (error) {
            console.error('Storage.getAll error:', error);
            return this.DEFAULT_STATE;
        }
    },

    /**
     * Get settings only
     */
    async getSettings() {
        try {
            const data = await chrome.storage.local.get('settings');
            return { ...this.DEFAULT_STATE.settings, ...data.settings };
        } catch (error) {
            console.error('Storage.getSettings error:', error);
            return this.DEFAULT_STATE.settings;
        }
    },

    /**
     * Save settings
     */
    async saveSettings(settings) {
        try {
            await chrome.storage.local.set({ settings });
            return true;
        } catch (error) {
            console.error('Storage.saveSettings error:', error);
            return false;
        }
    },

    /**
     * Update single setting
     */
    async updateSetting(key, value) {
        try {
            const settings = await this.getSettings();
            settings[key] = value;
            await this.saveSettings(settings);
            return true;
        } catch (error) {
            console.error('Storage.updateSetting error:', error);
            return false;
        }
    },

    /**
     * Get results only
     */
    async getResults() {
        try {
            const data = await chrome.storage.local.get('results');
            return { ...this.DEFAULT_STATE.results, ...data.results };
        } catch (error) {
            console.error('Storage.getResults error:', error);
            return this.DEFAULT_STATE.results;
        }
    },

    /**
     * Save results (current page data - replaced on each extraction)
     */
    async saveResults(results) {
        try {
            await chrome.storage.local.set({ results });
            return true;
        } catch (error) {
            console.error('Storage.saveResults error:', error);
            return false;
        }
    },

    /**
     * Get saved leads (cumulative data)
     */
    async getSaved() {
        try {
            const data = await chrome.storage.local.get('saved');
            return {
                emails: data.saved?.emails || [],
                phones: data.saved?.phones || [],
                socialLinks: data.saved?.socialLinks || [],
                serpLinks: { linkedin: data.saved?.serpLinks?.linkedin || [] }
            };
        } catch (error) {
            console.error('Storage.getSaved error:', error);
            return this.DEFAULT_STATE.saved;
        }
    },

    /**
     * Get saved counts for UI display
     */
    async getSavedCounts() {
        const saved = await this.getSaved();
        return {
            emails: saved.emails?.length || 0,
            phones: saved.phones?.length || 0,
            socialLinks: saved.socialLinks?.length || 0,
            serpLinks: saved.serpLinks?.linkedin?.length || 0,
            total: (saved.emails?.length || 0) + (saved.phones?.length || 0) +
                (saved.socialLinks?.length || 0) + (saved.serpLinks?.linkedin?.length || 0)
        };
    },

    // ==================== DELETE / CLEAR FUNCTIONS ====================

    /**
     * Delete single saved item
     */
    async deleteSavedItem(type, item) {
        try {
            const saved = await this.getSaved();

            if (type === 'emails') {
                saved.emails = saved.emails.filter(e => e.toLowerCase() !== item.toLowerCase());
            } else if (type === 'phones') {
                saved.phones = saved.phones.filter(p => this.normalizePhone(p) !== this.normalizePhone(item));
            } else if (type === 'socialLinks') {
                saved.socialLinks = saved.socialLinks.filter(l => this.normalizeUrl(l.url || l) !== this.normalizeUrl(item));
            } else if (type === 'serpLinks') {
                saved.serpLinks.linkedin = saved.serpLinks.linkedin.filter(l => this.normalizeUrl(l) !== this.normalizeUrl(item));
            }

            await chrome.storage.local.set({ saved });
            return true;
        } catch (error) {
            console.error('Storage.deleteSavedItem error:', error);
            return false;
        }
    },

    /**
     * Clear all saved items of a type (or all)
     */
    async clearSaved(type) {
        try {
            const saved = await this.getSaved();

            if (type === 'emails') saved.emails = [];
            else if (type === 'phones') saved.phones = [];
            else if (type === 'socialLinks') saved.socialLinks = [];
            else if (type === 'serpLinks') saved.serpLinks = { linkedin: [] };
            else if (type === 'all') {
                saved.emails = [];
                saved.phones = [];
                saved.socialLinks = [];
                saved.serpLinks = { linkedin: [] };
            }

            await chrome.storage.local.set({ saved });
            return true;
        } catch (error) {
            console.error('Storage.clearSaved error:', error);
            return false;
        }
    },

    /**
     * Clear results (current page data)
     */
    async clearResults(type) {
        try {
            const results = await this.getResults();

            if (type === 'emails') { results.emails = []; results.invalidEmails = []; }
            else if (type === 'phones') { results.phones = []; results.phonesFiltered = 0; }
            else if (type === 'socialLinks') { results.socialLinks = []; results.socialsByPlatform = {}; }
            else if (type === 'serpLinks') results.serpLinks = { linkedin: [] };
            else if (type === 'all') {
                results.emails = [];
                results.invalidEmails = [];
                results.phones = [];
                results.phonesFiltered = 0;
                results.socialLinks = [];
                results.socialsByPlatform = {};
                results.serpLinks = { linkedin: [] };
            }

            await chrome.storage.local.set({ results });
            return true;
        } catch (error) {
            console.error('Storage.clearResults error:', error);
            return false;
        }
    },

    // ==================== STORAGE CHANGE LISTENER ====================

    /**
     * Listen for storage changes
     */
    onChange(callback) {
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local') {
                callback(changes);
            }
        });
    },

    // ==================== PROFILE MODE METHODS ====================

    /**
     * Get saved profiles
     */
    async getSavedProfiles() {
        try {
            const data = await chrome.storage.local.get('savedProfiles');
            return data.savedProfiles || [];
        } catch (error) {
            console.error('Storage.getSavedProfiles error:', error);
            return [];
        }
    },

    /**
     * Save a profile (with deduplication by URL)
     */
    async saveProfile(profile) {
        try {
            if (!profile || !profile.profileUrl) return false;

            const profiles = await this.getSavedProfiles();
            const normalizedUrl = this.normalizeUrl(profile.profileUrl);

            const existingIndex = profiles.findIndex(p =>
                this.normalizeUrl(p.profileUrl || p.url) === normalizedUrl
            );

            if (existingIndex >= 0) {
                profiles[existingIndex] = { ...profiles[existingIndex], ...profile, updatedAt: Date.now() };
            } else {
                profiles.push({ ...profile, createdAt: Date.now() });
            }

            await chrome.storage.local.set({ savedProfiles: profiles });
            return true;
        } catch (error) {
            console.error('Storage.saveProfile error:', error);
            return false;
        }
    },

    /**
     * Delete a profile by URL
     */
    async deleteProfile(profileUrl) {
        try {
            const profiles = await this.getSavedProfiles();
            const normalizedUrl = this.normalizeUrl(profileUrl);
            const filtered = profiles.filter(p =>
                this.normalizeUrl(p.profileUrl || p.url) !== normalizedUrl
            );
            await chrome.storage.local.set({ savedProfiles: filtered });
            return true;
        } catch (error) {
            console.error('Storage.deleteProfile error:', error);
            return false;
        }
    },

    /**
     * Clear all saved profiles
     */
    async clearAllProfiles() {
        try {
            await chrome.storage.local.set({ savedProfiles: [] });
            return true;
        } catch (error) {
            console.error('Storage.clearAllProfiles error:', error);
            return false;
        }
    },

    // ==================== LEGACY SUPPORT ====================

    /**
     * Legacy function - now uses mergeSavedWithResults internally
     * Kept for backward compatibility
     */
    async saveLead(type, items) {
        try {
            const saved = await this.getSaved();
            const results = {};

            if (type === 'emails') results.emails = items;
            else if (type === 'phones') results.phones = items;
            else if (type === 'socialLinks') results.socialLinks = items;
            else if (type === 'serpLinks') results.serpLinks = { linkedin: items };

            const merged = this.mergeSavedWithResults(saved, results);
            await chrome.storage.local.set({ saved: merged });
            return true;
        } catch (error) {
            console.error('Storage.saveLead error:', error);
            return false;
        }
    }
};

// Export for browser
if (typeof window !== 'undefined') {
    window.Storage = Storage;
}

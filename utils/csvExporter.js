/**
 * CSV Exporter Utility - Pro Version
 * Exports data to CSV format with full metadata
 */

const CSVExporter = {
    /**
     * Get current timestamp in readable format
     */
    getTimestamp() {
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    },

    /**
     * Get date for filename
     */
    getDateForFilename() {
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    },

    /**
     * Escape CSV value - handles commas, quotes, newlines
     */
    escape(value) {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    },

    /**
     * Convert rows to CSV string
     */
    toCSV(headers, rows) {
        const headerLine = headers.map(h => this.escape(h)).join(',');
        const dataLines = rows.map(row => row.map(cell => this.escape(cell)).join(','));
        return [headerLine, ...dataLines].join('\r\n');
    },

    /**
     * Download CSV file
     */
    download(csvString, filename) {
        if (!csvString) return false;

        // Add BOM for Excel compatibility
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return true;
    },

    /**
     * Generate name from email
     */
    generateNameFromEmail(email) {
        if (!email) return '';
        const localPart = email.split('@')[0];
        const parts = localPart.split(/[._-]/).filter(p => p.length > 1);
        return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
    },

    /**
     * Detect platform from URL
     */
    detectPlatform(url) {
        if (!url) return 'Website';
        const u = url.toLowerCase();
        if (u.includes('linkedin')) return 'LinkedIn';
        if (u.includes('instagram')) return 'Instagram';
        if (u.includes('twitter') || u.includes('x.com')) return 'Twitter';
        if (u.includes('facebook') || u.includes('fb.com')) return 'Facebook';
        if (u.includes('youtube')) return 'YouTube';
        if (u.includes('tiktok')) return 'TikTok';
        if (u.includes('whatsapp') || u.includes('wa.me')) return 'WhatsApp';
        if (u.includes('github')) return 'GitHub';
        return 'Website';
    },

    // ==================== EXPORT FUNCTIONS ====================

    /**
     * Export emails to CSV
     * @param {Array} emails - Array of email strings or objects
     * @param {Object} meta - { sourceUrl, pageTitle, extractedAt }
     * @param {Boolean} withNames - Generate names from emails
     */
    exportEmails(emails, meta = {}, withNames = false) {
        if (!emails || emails.length === 0) return null;

        const headers = ['Name', 'Email', 'Source URL', 'Page Title', 'Extracted At'];
        const rows = emails.map(email => {
            const emailStr = typeof email === 'object' ? (email.email || email.value || '') : email;
            const name = withNames ? this.generateNameFromEmail(emailStr) : (email.name || '');
            return [
                name,
                emailStr,
                meta.sourceUrl || email.sourceUrl || '',
                meta.pageTitle || email.pageTitle || '',
                meta.extractedAt || email.extractedAt || this.getTimestamp()
            ];
        });

        return this.toCSV(headers, rows);
    },

    /**
     * Export phones to CSV
     * @param {Array} phones - Array of phone strings or objects
     * @param {Object} meta - { sourceUrl, pageTitle, extractedAt }
     */
    exportPhones(phones, meta = {}) {
        if (!phones || phones.length === 0) return null;

        const headers = ['Phone', 'Country Code', 'Source URL', 'Page Title', 'Extracted At'];
        const rows = phones.map(phone => {
            const phoneStr = typeof phone === 'object' ? (phone.phone || phone.number || phone.value || '') : phone;
            const country = typeof phone === 'object' ? (phone.country || phone.countryCode || '') : '';
            return [
                phoneStr,
                country,
                meta.sourceUrl || phone.sourceUrl || '',
                meta.pageTitle || phone.pageTitle || '',
                meta.extractedAt || phone.extractedAt || this.getTimestamp()
            ];
        });

        return this.toCSV(headers, rows);
    },

    /**
     * Export social links to CSV
     * @param {Array} links - Array of link objects or strings
     * @param {Object} meta - { sourceUrl, pageTitle, extractedAt }
     */
    exportSocialLinks(links, meta = {}) {
        if (!links || links.length === 0) return null;

        const headers = ['Platform', 'URL', 'Source URL', 'Page Title', 'Extracted At'];
        const rows = links.map(link => {
            const url = typeof link === 'object' ? (link.url || '') : link;
            const platform = typeof link === 'object' ? (link.platform || this.detectPlatform(url)) : this.detectPlatform(url);
            return [
                platform,
                url,
                meta.sourceUrl || link.sourceUrl || '',
                meta.pageTitle || link.pageTitle || '',
                meta.extractedAt || link.extractedAt || this.getTimestamp()
            ];
        });

        return this.toCSV(headers, rows);
    },

    /**
     * Export ALL leads combined to CSV
     * @param {Object} data - { emails, phones, socialLinks }
     * @param {Object} meta - { sourceUrl, pageTitle, extractedAt }
     * @param {Boolean} withNames - Generate names for emails
     */
    exportAllLeads(data, meta = {}, withNames = false) {
        const headers = ['Type', 'Name', 'Email', 'Phone', 'Country', 'Platform', 'Social URL', 'Source URL', 'Page Title', 'Extracted At'];
        const rows = [];

        // Add emails
        (data.emails || []).forEach(email => {
            const emailStr = typeof email === 'object' ? (email.email || email.value || '') : email;
            const name = withNames ? this.generateNameFromEmail(emailStr) : (email.name || '');
            rows.push([
                'Email',
                name,
                emailStr,
                '',
                '',
                '',
                '',
                meta.sourceUrl || email.sourceUrl || '',
                meta.pageTitle || email.pageTitle || '',
                meta.extractedAt || email.extractedAt || this.getTimestamp()
            ]);
        });

        // Add phones
        (data.phones || []).forEach(phone => {
            const phoneStr = typeof phone === 'object' ? (phone.phone || phone.number || phone.value || '') : phone;
            const country = typeof phone === 'object' ? (phone.country || phone.countryCode || '') : '';
            rows.push([
                'Phone',
                '',
                '',
                phoneStr,
                country,
                '',
                '',
                meta.sourceUrl || phone.sourceUrl || '',
                meta.pageTitle || phone.pageTitle || '',
                meta.extractedAt || phone.extractedAt || this.getTimestamp()
            ]);
        });

        // Add social links
        (data.socialLinks || []).forEach(link => {
            const url = typeof link === 'object' ? (link.url || '') : link;
            const platform = typeof link === 'object' ? (link.platform || this.detectPlatform(url)) : this.detectPlatform(url);
            rows.push([
                'Social',
                '',
                '',
                '',
                '',
                platform,
                url,
                meta.sourceUrl || link.sourceUrl || '',
                meta.pageTitle || link.pageTitle || '',
                meta.extractedAt || link.extractedAt || this.getTimestamp()
            ]);
        });

        if (rows.length === 0) return null;
        return this.toCSV(headers, rows);
    },

    /**
     * Export saved profiles to CSV
     */
    exportProfiles(profiles) {
        if (!profiles || profiles.length === 0) return null;

        const headers = [
            'Platform', 'Name', 'Username', 'URL', 'Headline/Bio',
            'Location', 'Email', 'Phone', 'Links', 'Company', 'Saved At'
        ];

        const rows = profiles.map(p => [
            p.platform || '',
            p.fullName || p.displayName || p.name || '',
            p.username || '',
            p.profileUrl || p.url || '',
            p.headline || p.bioText || p.headlineOrBio || '',
            p.location || '',
            p.email || '',
            p.phone || '',
            (p.links || []).join('; '),
            p.companyName || '',
            p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : ''
        ]);

        return this.toCSV(headers, rows);
    },

    // ==================== DOWNLOAD HELPERS ====================

    downloadEmails(emails, meta = {}, withNames = false) {
        const csv = this.exportEmails(emails, meta, withNames);
        if (csv) {
            return this.download(csv, `EmailExtractorPro_emails_${this.getDateForFilename()}.csv`);
        }
        return false;
    },

    downloadPhones(phones, meta = {}) {
        const csv = this.exportPhones(phones, meta);
        if (csv) {
            return this.download(csv, `EmailExtractorPro_phones_${this.getDateForFilename()}.csv`);
        }
        return false;
    },

    downloadSocialLinks(links, meta = {}) {
        const csv = this.exportSocialLinks(links, meta);
        if (csv) {
            return this.download(csv, `EmailExtractorPro_socials_${this.getDateForFilename()}.csv`);
        }
        return false;
    },

    downloadAllLeads(data, meta = {}, withNames = false) {
        const csv = this.exportAllLeads(data, meta, withNames);
        if (csv) {
            return this.download(csv, `EmailExtractorPro_all-leads_${this.getDateForFilename()}.csv`);
        }
        return false;
    },

    downloadProfiles(profiles) {
        const csv = this.exportProfiles(profiles);
        if (csv) {
            return this.download(csv, `EmailExtractorPro_profiles_${this.getDateForFilename()}.csv`);
        }
        return false;
    },

    downloadSavedLeads(saved, withNames = false) {
        // Saved leads combine all saved data
        const csv = this.exportAllLeads(saved, {}, withNames);
        if (csv) {
            return this.download(csv, `EmailExtractorPro_saved-leads_${this.getDateForFilename()}.csv`);
        }
        return false;
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.CSVExporter = CSVExporter;
}

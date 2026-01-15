/**
 * CSV Exporter Utility
 * Exports data to CSV format
 */

const CSVExporter = {
    /**
     * Export saved profiles to CSV
     */
    exportProfiles(profiles) {
        if (!profiles || profiles.length === 0) {
            return null;
        }

        const headers = [
            'Platform',
            'Name',
            'Username',
            'URL',
            'Headline/Bio',
            'Location',
            'Email',
            'Phone',
            'Links',
            'Company',
            'Created At'
        ];

        const rows = profiles.map(p => [
            this.escape(p.platform || ''),
            this.escape(p.fullName || p.displayName || p.name || ''),
            this.escape(p.username || ''),
            this.escape(p.profileUrl || p.url || ''),
            this.escape(p.headline || p.bioText || p.headlineOrBio || ''),
            this.escape(p.location || ''),
            this.escape(p.email || ''),
            this.escape(p.phone || ''),
            this.escape((p.links || []).join('; ')),
            this.escape(p.companyName || ''),
            this.formatDate(p.createdAt)
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        return csv;
    },

    /**
     * Export emails to CSV
     */
    exportEmails(emails, generateName = false) {
        if (!emails || emails.length === 0) return null;

        const headers = ['Email', 'Name'];
        const rows = emails.map(email => {
            const name = generateName ? this.generateNameFromEmail(email) : '';
            return [this.escape(email), this.escape(name)];
        });

        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    },

    /**
     * Export phones to CSV
     */
    exportPhones(phones) {
        if (!phones || phones.length === 0) return null;

        const headers = ['Phone'];
        const rows = phones.map(phone => [this.escape(phone)]);

        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    },

    /**
     * Export social links to CSV
     */
    exportSocialLinks(links) {
        if (!links || links.length === 0) return null;

        const headers = ['Platform', 'URL'];
        const rows = links.map(link => {
            const platform = link.platform || this.detectPlatform(link.url || link);
            const url = link.url || link;
            return [this.escape(platform), this.escape(url)];
        });

        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    },

    /**
     * Escape CSV value
     */
    escape(value) {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    },

    /**
     * Format date
     */
    formatDate(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toISOString().split('T')[0];
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
        if (!url) return 'Unknown';
        const u = url.toLowerCase();
        if (u.includes('linkedin')) return 'LinkedIn';
        if (u.includes('instagram')) return 'Instagram';
        if (u.includes('twitter') || u.includes('x.com')) return 'Twitter';
        if (u.includes('facebook') || u.includes('fb.com')) return 'Facebook';
        if (u.includes('youtube')) return 'YouTube';
        if (u.includes('tiktok')) return 'TikTok';
        if (u.includes('whatsapp') || u.includes('wa.me')) return 'WhatsApp';
        return 'Website';
    },

    /**
     * Trigger CSV download
     */
    download(csv, filename) {
        if (!csv) return false;

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `export_${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return true;
    },

    /**
     * Export and download profiles
     */
    downloadProfiles(profiles) {
        const csv = this.exportProfiles(profiles);
        if (csv) {
            return this.download(csv, `profiles_export_${Date.now()}.csv`);
        }
        return false;
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.CSVExporter = CSVExporter;
}

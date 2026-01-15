/**
 * Name Generator Utility
 * Generates names from email addresses
 */
const NameGenerator = {
    COMMON_SEPARATORS: ['.', '_', '-', '+'],

    TITLES: ['mr', 'mrs', 'ms', 'dr', 'prof', 'sir', 'miss'],

    NUMBER_PATTERNS: [/\d+$/, /^\d+/, /\d{4}$/],

    generate(email) {
        if (!email || typeof email !== 'string') return null;
        try {
            const localPart = email.split('@')[0];
            if (!localPart) return null;
            let cleaned = localPart.toLowerCase();

            for (const title of this.TITLES) {
                cleaned = cleaned.replace(new RegExp(`^${title}\\.?`, 'i'), '');
            }

            for (const pattern of this.NUMBER_PATTERNS) {
                cleaned = cleaned.replace(pattern, '');
            }

            let parts = [cleaned];
            for (const sep of this.COMMON_SEPARATORS) {
                if (cleaned.includes(sep)) {
                    parts = cleaned.split(sep).filter(p => p.length > 0);
                    break;
                }
            }

            if (parts.length === 1 && parts[0].length > 3) {
                const camelCaseParts = parts[0].match(/[a-z]+|[A-Z][a-z]*/g);
                if (camelCaseParts && camelCaseParts.length > 1) {
                    parts = camelCaseParts;
                }
            }

            const nameParts = parts
                .filter(p => p.length > 1)
                .map(p => this.capitalize(p.replace(/\d+/g, '')))
                .filter(p => p.length > 0);

            if (nameParts.length === 0) return null;
            return nameParts.slice(0, 3).join(' ');
        } catch (error) {
            console.error('NameGenerator error:', error);
            return null;
        }
    },

    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    generateBatch(emails) {
        return emails.map(email => ({
            email,
            name: this.generate(email)
        }));
    }
};

if (typeof window !== 'undefined') window.NameGenerator = NameGenerator;

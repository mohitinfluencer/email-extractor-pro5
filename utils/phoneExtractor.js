/**
 * Phone Extractor - Safe & Fast Version
 * 
 * OPTIMIZED TO NEVER FREEZE:
 * - Max 150KB text scan
 * - Simple regex patterns
 * - Early exit on errors
 * - Max 50 candidates
 */

const PhoneExtractor = {
    MAX_TEXT_LENGTH: 150000,  // 150KB max
    MAX_CANDIDATES: 50,
    MAX_RESULTS: 20,

    // Country rules (simplified for speed)
    COUNTRY_RULES: {
        'IN': { dial: '+91', len: 10, prefix: /^[6-9]/ },
        'US': { dial: '+1', len: 10, prefix: /^[2-9]/ },
        'CA': { dial: '+1', len: 10, prefix: /^[2-9]/ },
        'UK': { dial: '+44', len: 10, prefix: /^7/ },
        'AE': { dial: '+971', len: 9, prefix: /^5/ },
        'SG': { dial: '+65', len: 8, prefix: /^[89]/ },
        'AU': { dial: '+61', len: 9, prefix: /^4/ },
        'DE': { dial: '+49', len: 10, prefix: /^1/ },
        'FR': { dial: '+33', len: 9, prefix: /^[67]/ },
        'SA': { dial: '+966', len: 9, prefix: /^5/ },
        'PK': { dial: '+92', len: 10, prefix: /^3/ },
        'BD': { dial: '+880', len: 10, prefix: /^1/ }
    },

    /**
     * SAFE extraction - will never freeze
     */
    extract(html, selectedCountries = []) {
        const result = { phones: [], filtered: 0 };

        // Early exit if no countries
        if (!selectedCountries || selectedCountries.length === 0) {
            return result;
        }

        try {
            // Get safe text (limited size)
            const text = this.getSafeText(html);
            if (!text || text.length < 10) {
                return result;
            }

            const candidates = [];

            // Source 1: tel: links (fast, DOM-based)
            this.extractTelLinks(html, candidates);

            // Source 2: WhatsApp links (fast, simple regex)
            this.extractWhatsApp(html, candidates);

            // Source 3: Text patterns (limited text)
            this.extractFromText(text, candidates);

            // Limit candidates
            const limited = candidates.slice(0, this.MAX_CANDIDATES);

            // Validate by country
            const validated = [];
            for (const c of limited) {
                const valid = this.validatePhone(c.digits, selectedCountries);
                if (valid) {
                    validated.push({
                        ...c,
                        formatted: valid.dial + valid.normalized,
                        country: valid.code
                    });
                }
            }

            // Deduplicate
            const seen = new Set();
            const unique = validated.filter(p => {
                const key = p.formatted;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            result.phones = unique.slice(0, this.MAX_RESULTS).map(p => p.formatted);
            result.filtered = limited.length - unique.length;

        } catch (error) {
            console.error('[PhoneExtractor] Error:', error.message);
        }

        return result;
    },

    /**
     * Get safe text from HTML (limited size)
     */
    getSafeText(html) {
        try {
            const doc = new DOMParser().parseFromString(html.slice(0, 300000), 'text/html');
            let text = doc.body?.innerText || '';
            return text.slice(0, this.MAX_TEXT_LENGTH);
        } catch (e) {
            return '';
        }
    },

    /**
     * Extract from tel: links (fast)
     */
    extractTelLinks(html, candidates) {
        try {
            // Simple regex for tel: links
            const telPattern = /href=["']tel:([^"']+)["']/gi;
            let match;
            let count = 0;
            while ((match = telPattern.exec(html)) !== null && count < 20) {
                const phone = match[1].replace(/[^\d+]/g, '');
                const digits = phone.replace(/\D/g, '');
                if (digits.length >= 8 && digits.length <= 15) {
                    candidates.push({ raw: phone, digits, source: 'tel', score: 6 });
                    count++;
                }
            }
        } catch (e) {
            console.error('[PhoneExtractor] Tel links error:', e.message);
        }
    },

    /**
     * Extract from WhatsApp links (fast)
     */
    extractWhatsApp(html, candidates) {
        try {
            const waPattern = /wa\.me\/(\d{10,15})/gi;
            let match;
            let count = 0;
            while ((match = waPattern.exec(html)) !== null && count < 10) {
                const digits = match[1];
                candidates.push({ raw: '+' + digits, digits, source: 'whatsapp', score: 5 });
                count++;
            }
        } catch (e) {
            console.error('[PhoneExtractor] WhatsApp error:', e.message);
        }
    },

    /**
     * Extract from text (safe patterns)
     */
    extractFromText(text, candidates) {
        try {
            // Simple pattern: +XX followed by 8-12 digits
            const intlPattern = /\+\d{1,4}[\s\-.]?\d{3,5}[\s\-.]?\d{3,5}[\s\-.]?\d{0,4}/g;
            let match;
            let count = 0;

            while ((match = intlPattern.exec(text)) !== null && count < 30) {
                const raw = match[0];
                const digits = raw.replace(/\D/g, '');
                if (digits.length >= 10 && digits.length <= 15) {
                    candidates.push({ raw, digits, source: 'text', score: 3 });
                    count++;
                }
            }

            // India mobile pattern (10 digits starting with 6-9)
            if (count < 20) {
                const indiaPattern = /\b[6-9]\d{4}[\s\-.]?\d{5}\b/g;
                while ((match = indiaPattern.exec(text)) !== null && count < 40) {
                    const raw = match[0];
                    const digits = raw.replace(/\D/g, '');
                    if (digits.length === 10) {
                        candidates.push({ raw, digits, source: 'text', score: 2 });
                        count++;
                    }
                }
            }
        } catch (e) {
            console.error('[PhoneExtractor] Text extraction error:', e.message);
        }
    },

    /**
     * Validate phone against countries
     */
    validatePhone(digits, countries) {
        for (const code of countries) {
            const rule = this.COUNTRY_RULES[code];
            if (!rule) continue;

            // Normalize: remove country code if present
            let normalized = digits;
            const dialDigits = rule.dial.replace(/\D/g, '');

            if (normalized.startsWith(dialDigits)) {
                normalized = normalized.slice(dialDigits.length);
            }
            if (normalized.startsWith('0')) {
                normalized = normalized.slice(1);
            }

            // Check length and prefix
            if (normalized.length === rule.len && rule.prefix.test(normalized)) {
                return { code, dial: rule.dial, normalized };
            }
        }
        return null;
    }
};

// Export
if (typeof window !== 'undefined') {
    window.PhoneExtractor = PhoneExtractor;
}

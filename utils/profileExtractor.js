/**
 * Profile Extractor Utility
 * Extracts profile data from LinkedIn and Instagram pages
 */

const ProfileExtractor = {
    /**
     * Detect if current page is a profile page
     */
    detectProfilePage(url) {
        const urlLower = url.toLowerCase();

        // LinkedIn Profile
        if (urlLower.includes('linkedin.com/in/')) {
            return { platform: 'LinkedIn', type: 'personal' };
        }
        if (urlLower.includes('linkedin.com/company/')) {
            return { platform: 'LinkedIn', type: 'company' };
        }

        // Instagram Profile
        if (urlLower.includes('instagram.com/')) {
            // Exclude non-profile pages
            const excludePatterns = ['/p/', '/reels/', '/stories/', '/explore/', '/direct/', '/accounts/', '/reel/'];
            if (excludePatterns.some(p => urlLower.includes(p))) {
                return null;
            }
            // Check if it's a profile URL (instagram.com/username)
            const match = url.match(/instagram\.com\/([^/?#]+)/i);
            if (match && match[1] && !['p', 'reels', 'stories', 'explore', 'direct', 'accounts', 'reel'].includes(match[1].toLowerCase())) {
                return { platform: 'Instagram', type: 'personal' };
            }
        }

        return null;
    },

    /**
     * Extract LinkedIn profile data
     */
    extractLinkedIn(document, url) {
        const profile = {
            platform: 'LinkedIn',
            profileUrl: url.split('?')[0],
            fullName: '',
            username: '',
            headline: '',
            location: '',
            aboutText: '',
            companyName: '',
            links: [],
            email: '',
            phone: ''
        };

        try {
            // Full Name - multiple selectors for resilience
            const nameSelectors = [
                'h1.text-heading-xlarge',
                'h1[class*="text-heading"]',
                '.pv-top-card h1',
                '.ph5 h1',
                'section.artdeco-card h1',
                'h1'
            ];
            for (const sel of nameSelectors) {
                const el = document.querySelector(sel);
                if (el && el.textContent.trim()) {
                    profile.fullName = el.textContent.trim();
                    break;
                }
            }

            // Username from URL
            const urlMatch = url.match(/linkedin\.com\/in\/([^/?#]+)/i);
            if (urlMatch) profile.username = urlMatch[1];

            // Headline
            const headlineSelectors = [
                '.text-body-medium.break-words',
                'div[class*="text-body-medium"]',
                '.pv-top-card--list .text-body-medium',
                '.ph5 .text-body-medium'
            ];
            for (const sel of headlineSelectors) {
                const el = document.querySelector(sel);
                if (el && el.textContent.trim()) {
                    profile.headline = el.textContent.trim();
                    break;
                }
            }

            // Location
            const locationSelectors = [
                '.pv-top-card--list-bullet .text-body-small',
                'span[class*="text-body-small"][class*="inline"]',
                '.ph5 .text-body-small.inline'
            ];
            for (const sel of locationSelectors) {
                const el = document.querySelector(sel);
                if (el && el.textContent.trim()) {
                    profile.location = el.textContent.trim();
                    break;
                }
            }

            // About text
            const aboutSelectors = [
                '#about ~ .display-flex .pv-shared-text-with-see-more span[aria-hidden="true"]',
                'section[id*="about"] .inline-show-more-text',
                '.pv-about-section .pv-about__summary-text',
                'section:has(#about) .inline-show-more-text'
            ];
            for (const sel of aboutSelectors) {
                try {
                    const el = document.querySelector(sel);
                    if (el && el.textContent.trim()) {
                        profile.aboutText = el.textContent.trim().substring(0, 500);
                        break;
                    }
                } catch (e) { /* Selector not supported */ }
            }

            // Company name (current experience)
            const companySelectors = [
                '.pv-top-card--experience-list-item .t-bold span',
                'li[class*="experience"] .t-bold',
                '.experience-item .t-bold'
            ];
            for (const sel of companySelectors) {
                const el = document.querySelector(sel);
                if (el && el.textContent.trim()) {
                    profile.companyName = el.textContent.trim();
                    break;
                }
            }

            // Contact info links
            const linkElements = document.querySelectorAll('a[href*="linkedin.com/redir"], section[id*="contact"] a');
            linkElements.forEach(a => {
                const href = a.href;
                if (href && !href.includes('linkedin.com')) {
                    profile.links.push(href);
                }
            });

            // Extract email/phone from visible text
            const pageText = document.body.innerText;
            const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch) profile.email = emailMatch[0];

            const phoneMatch = pageText.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
            if (phoneMatch) profile.phone = phoneMatch[0];

        } catch (error) {
            console.error('[ProfileExtractor] LinkedIn extraction error:', error);
        }

        return profile;
    },

    /**
     * Extract Instagram profile data
     */
    extractInstagram(document, url) {
        const profile = {
            platform: 'Instagram',
            profileUrl: url.split('?')[0],
            fullName: '',
            username: '',
            displayName: '',
            bioText: '',
            externalWebsiteLink: '',
            links: [],
            email: '',
            phone: ''
        };

        try {
            // Username from URL
            const urlMatch = url.match(/instagram\.com\/([^/?#]+)/i);
            if (urlMatch) profile.username = urlMatch[1];

            // Display name / Full name
            const nameSelectors = [
                'header section span[class*="x1lliihq"]',
                'header h2 + span',
                'header section h1',
                'header section span:first-of-type'
            ];
            for (const sel of nameSelectors) {
                const el = document.querySelector(sel);
                if (el && el.textContent.trim() && el.textContent.trim() !== profile.username) {
                    profile.displayName = el.textContent.trim();
                    profile.fullName = profile.displayName;
                    break;
                }
            }

            // Bio text
            const bioSelectors = [
                'header section h1 + div span',
                'header section > div > span',
                'header section div[class*="x7a106z"]',
                'header section span[class*="_ap3a"]'
            ];
            for (const sel of bioSelectors) {
                const el = document.querySelector(sel);
                if (el && el.textContent.trim() && el.textContent.trim().length > 10) {
                    profile.bioText = el.textContent.trim().substring(0, 300);
                    break;
                }
            }

            // External website link
            const linkSelectors = [
                'header section a[href*="l.instagram.com"]',
                'header section a[rel*="noopener"]',
                'header a[target="_blank"]'
            ];
            for (const sel of linkSelectors) {
                const el = document.querySelector(sel);
                if (el && el.href) {
                    const decoded = decodeURIComponent(el.href);
                    const urlParam = decoded.match(/u=([^&]+)/);
                    profile.externalWebsiteLink = urlParam ? urlParam[1] : el.href;
                    profile.links.push(profile.externalWebsiteLink);
                    break;
                }
            }

            // Extract email/phone from bio text
            const pageText = document.body.innerText;
            const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch) profile.email = emailMatch[0];

            const phoneMatch = pageText.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
            if (phoneMatch) profile.phone = phoneMatch[0];

        } catch (error) {
            console.error('[ProfileExtractor] Instagram extraction error:', error);
        }

        return profile;
    },

    /**
     * Main extraction function
     */
    extract(document, url) {
        const detection = this.detectProfilePage(url);

        if (!detection) {
            return { profile: null, isProfilePage: false };
        }

        let profile;
        if (detection.platform === 'LinkedIn') {
            profile = this.extractLinkedIn(document, url);
        } else if (detection.platform === 'Instagram') {
            profile = this.extractInstagram(document, url);
        }

        // Generate unique ID
        if (profile) {
            profile.id = this.generateId(profile.profileUrl);
            profile.createdAt = Date.now();
            profile.sourceDomain = new URL(url).hostname;
        }

        return { profile, isProfilePage: true };
    },

    /**
     * Generate unique ID from URL
     */
    generateId(url) {
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            const char = url.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    },

    /**
     * Format profile as copy-ready text
     */
    formatProfileSummary(profile) {
        if (!profile) return '';

        const lines = [
            `Name: ${profile.fullName || profile.displayName || '-'}`,
            `Username: ${profile.username || '-'}`,
            `Platform: ${profile.platform || '-'}`,
            `URL: ${profile.profileUrl || '-'}`,
            `Email: ${profile.email || '-'}`,
            `Phone: ${profile.phone || '-'}`,
            `Website: ${profile.links?.join(', ') || profile.externalWebsiteLink || '-'}`,
            `Bio/Headline: ${profile.headline || profile.bioText || '-'}`
        ];

        if (profile.location) lines.splice(4, 0, `Location: ${profile.location}`);
        if (profile.companyName) lines.splice(5, 0, `Company: ${profile.companyName}`);

        return lines.join('\n');
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.ProfileExtractor = ProfileExtractor;
}

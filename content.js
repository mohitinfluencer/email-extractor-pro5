/**
 * Content Script for Email Extractor Pro
 * Production-quality data extraction from web pages
 */

(function () {
    'use strict';

    // Prevent multiple injections
    if (window.__emailExtractorProInjected) return;
    window.__emailExtractorProInjected = true;

    // ====== EMAIL EXTRACTOR - MULTI-SOURCE PROFESSIONAL ENGINE ======
    const EmailExtractor = {
        // Debug mode
        DEBUG: false,

        // Junk suffixes that get stuck to emails
        JUNK_SUFFIXES: [
            'read', 'more', 'phone', 'call', 'contact', 'email', 'ads', 'adspeople',
            'collab', 'message', 'whatsapp', 'click', 'here', 'now', 'button', 'link',
            'copy', 'share', 'send', 'reply', 'view', 'show', 'details', 'info',
            'enquiry', 'inquiry', 'form', 'submit', 'get', 'reach', 'us', 'me'
        ],

        // Fake emails to reject
        FAKE_EMAILS: [
            'abc@xyz.com', 'test@test.com', 'example@example.com', 'email@example.com',
            'user@example.com', 'sample@sample.com', 'demo@demo.com', 'your@email.com',
            'name@domain.com', 'yourname@email.com', 'john@doe.com', 'admin@example.com'
        ],

        /**
         * Main multi-source extraction
         */
        extract(html, validate = true) {
            const result = { valid: [], invalid: [] };

            try {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const allEmails = new Set();

                // Source 1: Visible page text
                this.extractFromText(doc.body?.innerText || '', allEmails);

                // Source 2: Raw HTML (catches hidden emails)
                this.extractFromText(html, allEmails);

                // Source 3: Mailto links
                this.extractFromMailto(doc, allEmails);

                // Source 4: Google SERP specific
                this.extractFromGoogleSerp(doc, allEmails);

                // Source 5: Meta tags
                this.extractFromMeta(doc, allEmails);

                // Source 6: JSON-LD
                this.extractFromJsonLd(doc, allEmails);

                // Source 7: Data attributes
                this.extractFromDataAttributes(doc, allEmails);

                // Clean and validate
                for (const email of allEmails) {
                    const cleaned = this.cleanEmail(email);
                    if (!cleaned) continue;

                    if (validate) {
                        if (this.isValid(cleaned)) {
                            result.valid.push(cleaned);
                        } else {
                            result.invalid.push(cleaned);
                        }
                    } else {
                        result.valid.push(cleaned);
                    }
                }

                // Deduplicate
                result.valid = this.deduplicate(result.valid);
                result.invalid = this.deduplicate(result.invalid);
                result.valid.sort();
                result.invalid.sort();

            } catch (error) {
                console.error('[EmailExtractor] Error:', error);
            }

            return result;
        },

        /**
         * Extract emails from text using patterns
         */
        extractFromText(text, emails) {
            if (!text) return;

            // Primary pattern - handles plus addressing and subdomains
            const patterns = [
                /[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,24}/gi,
                /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi
            ];

            patterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(text)) !== null) {
                    emails.add(match[0]);
                }
            });
        },

        /**
         * Extract from mailto links
         */
        extractFromMailto(doc, emails) {
            // Mailto links
            doc.querySelectorAll('a[href^="mailto:"]').forEach(link => {
                const href = link.getAttribute('href') || '';
                const email = href.replace(/^mailto:/i, '').split('?')[0].trim();
                if (email && email.includes('@')) {
                    emails.add(email);
                }
            });

            // All anchor hrefs containing @
            doc.querySelectorAll('a[href*="@"]').forEach(link => {
                const href = link.getAttribute('href') || '';
                if (!href.startsWith('mailto:')) {
                    this.extractFromText(href, emails);
                }
            });
        },

        /**
         * Extract from Google SERP
         */
        extractFromGoogleSerp(doc, emails) {
            // Check if Google search
            if (!window.location?.hostname?.includes('google.')) return;

            // SERP snippet selectors
            const selectors = [
                'div.VwiC3b', 'div.yXK7lf', 'span.aCOpRe', 'div.MjjYud',
                'div.IsZvec', 'div.BNeawe', 'span.st', 'cite', 'h3',
                'div.g span', 'div.s3v9rd', 'div[data-snf]', 'div[data-sncf]'
            ];

            selectors.forEach(selector => {
                doc.querySelectorAll(selector).forEach(el => {
                    this.extractFromText(el.textContent || '', emails);
                });
            });

            // Decode Google redirect URLs
            doc.querySelectorAll('a[href*="/url?"]').forEach(link => {
                try {
                    const url = new URL(link.getAttribute('href'), 'https://www.google.com');
                    const actualUrl = url.searchParams.get('q') || url.searchParams.get('url') || '';
                    this.extractFromText(actualUrl, emails);
                } catch (e) { }
            });
        },

        /**
         * Extract from meta tags
         */
        extractFromMeta(doc, emails) {
            const selectors = [
                'meta[name="description"]', 'meta[property="og:description"]',
                'meta[name="author"]', 'meta[property="og:email"]'
            ];

            selectors.forEach(selector => {
                doc.querySelectorAll(selector).forEach(meta => {
                    this.extractFromText(meta.getAttribute('content') || '', emails);
                });
            });
        },

        /**
         * Extract from JSON-LD
         */
        extractFromJsonLd(doc, emails) {
            doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
                this.extractFromText(script.textContent || '', emails);
            });
        },

        /**
         * Extract from data attributes
         */
        extractFromDataAttributes(doc, emails) {
            // Check common data attributes
            doc.querySelectorAll('[data-email], [data-mail]').forEach(el => {
                ['data-email', 'data-mail'].forEach(attr => {
                    const value = el.getAttribute(attr);
                    if (value && value.includes('@')) emails.add(value);
                });
            });

            // Check aria-label
            doc.querySelectorAll('[aria-label*="@"]').forEach(el => {
                this.extractFromText(el.getAttribute('aria-label') || '', emails);
            });
        },

        /**
         * Clean email - remove stuck suffixes like "phone", "read", etc.
         */
        cleanEmail(email) {
            if (!email || typeof email !== 'string') return null;

            let cleaned = email.trim().toLowerCase();

            // Remove leading junk characters
            cleaned = cleaned.replace(/^[-_.,;:!?#@&*()[\]{}|\\/\<\>'"=+`~^]+/, '');
            cleaned = cleaned.replace(/^mailto:/i, '');

            const atIndex = cleaned.indexOf('@');
            if (atIndex === -1) return null;

            const localPart = cleaned.substring(0, atIndex);
            let domainPart = cleaned.substring(atIndex + 1);

            // STRICT TLD EXTRACTION: Match domain ending with valid TLD only
            // This regex captures: domain.tld or subdomain.domain.tld
            // It stops at the first valid TLD and ignores trailing junk
            const validTLDs = [
                'com', 'in', 'org', 'net', 'co', 'io', 'me', 'info', 'biz', 'edu', 'gov',
                'xyz', 'app', 'dev', 'ai', 'tech', 'online', 'site', 'store', 'shop',
                'uk', 'us', 'au', 'ca', 'de', 'fr', 'jp', 'cn', 'ru', 'br', 'it', 'es',
                'co\\.uk', 'co\\.in', 'com\\.au', 'co\\.nz', 'co\\.za', 'org\\.uk', 'org\\.in'
            ];

            // Build regex to match domain ending at valid TLD
            const tldPattern = new RegExp(
                `^([a-z0-9]([a-z0-9-]*[a-z0-9])?\\.)+?(${validTLDs.join('|')})(?![a-z])`,
                'i'
            );

            const domainMatch = domainPart.match(tldPattern);
            if (domainMatch) {
                domainPart = domainMatch[0];
            } else {
                // Fallback: Try to extract just the domain part before junk words
                for (const suffix of this.JUNK_SUFFIXES) {
                    const suffixIndex = domainPart.toLowerCase().indexOf(suffix);
                    if (suffixIndex > 0) {
                        // Check if it's right after a TLD
                        const before = domainPart.substring(0, suffixIndex);
                        if (/\.(com|in|org|net|co|io|me|xyz|info)$/i.test(before)) {
                            domainPart = before;
                            break;
                        }
                    }
                }
            }

            // Remove any trailing junk characters
            domainPart = domainPart.replace(/[-_.,;:!?#&*()[\]{}|\\/\<\>'"=+`~^]+$/, '');

            cleaned = localPart + '@' + domainPart;

            // Final strict validation
            if (!cleaned.includes('@') || !cleaned.includes('.')) return null;
            if (cleaned.length < 6) return null;

            // FINAL STRICT REGEX: Must match email format exactly
            const finalMatch = cleaned.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/);
            if (!finalMatch) {
                // Try to extract valid email from the middle
                const extractMatch = cleaned.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}/);
                return extractMatch ? extractMatch[0] : null;
            }

            return finalMatch[0];
        },

        /**
         * Validate email
         */
        isValid(email) {
            if (!email) return false;
            if (this.FAKE_EMAILS.includes(email.toLowerCase())) return false;
            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}$/.test(email)) return false;

            const [localPart, domainPart] = email.split('@');
            if (localPart.length < 1 || domainPart.length < 4) return false;
            if (!domainPart.includes('.')) return false;
            if (/\.(png|jpg|jpeg|gif|svg|webp|css|js|ico|pdf)$/i.test(domainPart)) return false;
            if (/^(test|example|sample|demo|fake)@/i.test(email)) return false;

            return true;
        },

        /**
         * Deduplicate (case-insensitive)
         */
        deduplicate(emails) {
            const seen = new Set();
            return emails.filter(email => {
                const lower = email.toLowerCase();
                if (seen.has(lower)) return false;
                seen.add(lower);
                return true;
            });
        }
    };

    // ====== PHONE EXTRACTOR - PREMIUM QUALITY ENGINE ======    // ====== PHONE EXTRACTOR - SAFE & FAST VERSION ======
    const PhoneExtractor = {
        MAX_TEXT: 150000,  // Max text to scan
        MAX_RESULTS: 20,

        // Simple country rules
        RULES: {
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

        extract(html, countries = []) {
            const result = { phones: [], filtered: 0 };
            if (!countries || countries.length === 0) return result;

            try {
                // Get safe text
                const text = this.getText(html);
                if (!text) return result;

                const candidates = [];

                // 1. Tel links (fast regex)
                this.findTelLinks(html, candidates);

                // 2. WhatsApp
                this.findWhatsApp(html, candidates);

                // 3. Text patterns
                this.findInText(text, candidates);

                // Validate & dedupe
                const validated = [];
                const seen = new Set();

                for (const c of candidates.slice(0, 50)) {
                    const v = this.validate(c.digits, countries);
                    if (v && !seen.has(v.formatted)) {
                        seen.add(v.formatted);
                        validated.push(v.formatted);
                    }
                }

                result.phones = validated.slice(0, this.MAX_RESULTS);
                result.filtered = candidates.length - result.phones.length;
            } catch (e) {
                console.error('[PhoneExtractor] Error:', e.message);
            }

            return result;
        },

        getText(html) {
            try {
                const doc = new DOMParser().parseFromString(html.slice(0, 250000), 'text/html');
                return (doc.body?.innerText || '').slice(0, this.MAX_TEXT);
            } catch (e) {
                return '';
            }
        },

        findTelLinks(html, arr) {
            const re = /href=["']tel:([^"']+)["']/gi;
            let m, i = 0;
            while ((m = re.exec(html)) && i < 20) {
                const d = m[1].replace(/\D/g, '');
                if (d.length >= 8 && d.length <= 15) {
                    arr.push({ digits: d });
                    i++;
                }
            }
        },

        findWhatsApp(html, arr) {
            const re = /wa\.me\/(\d{10,15})/gi;
            let m, i = 0;
            while ((m = re.exec(html)) && i < 10) {
                arr.push({ digits: m[1] });
                i++;
            }
        },

        findInText(text, arr) {
            // International format
            const re1 = /\+\d{1,4}[\s\-.]?\d{3,5}[\s\-.]?\d{3,5}[\s\-.]?\d{0,4}/g;
            let m, i = 0;
            while ((m = re1.exec(text)) && i < 30) {
                const d = m[0].replace(/\D/g, '');
                if (d.length >= 10 && d.length <= 15) {
                    arr.push({ digits: d });
                    i++;
                }
            }
            // India mobile
            const re2 = /\b[6-9]\d{4}[\s\-.]?\d{5}\b/g;
            while ((m = re2.exec(text)) && i < 40) {
                const d = m[0].replace(/\D/g, '');
                if (d.length === 10) {
                    arr.push({ digits: d });
                    i++;
                }
            }
        },

        validate(digits, countries) {
            for (const code of countries) {
                const r = this.RULES[code];
                if (!r) continue;

                let n = digits;
                const dc = r.dial.replace(/\D/g, '');
                if (n.startsWith(dc)) n = n.slice(dc.length);
                if (n.startsWith('0')) n = n.slice(1);

                if (n.length === r.len && r.prefix.test(n)) {
                    return { formatted: r.dial + n };
                }
            }
            return null;
        }
    };

    // ====== SOCIAL EXTRACTOR - PRODUCTION QUALITY ======
    // ====== SOCIAL EXTRACTOR - PREMIUM QUALITY ENGINE ======
    const SocialExtractor = {
        // Tracking params to remove
        TRACKING_PARAMS: [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'fbclid', 'gclid', 'igshid', 'si', 'ref', 'ref_src', 'source', 'medium',
            '_ga', '_gid', 'mc_cid', 'mc_eid', 'feature', 'app', 'src', '__a', 'hl'
        ],

        // Platform configurations with strict profile-only rules
        PLATFORMS: {
            whatsapp: {
                priority: 1,
                patterns: [/wa\.me\/(\d+)/i, /whatsapp\.com\/send\?phone=(\d+)/i],
                rejectPatterns: [],
                canonicalize: (url) => {
                    const match = url.match(/(?:wa\.me\/|phone=)(\d+)/);
                    return match && match[1].length >= 10 ? `https://wa.me/${match[1]}` : null;
                }
            },
            instagram: {
                priority: 2,
                patterns: [/instagram\.com\/([a-zA-Z0-9_.]+)/i],
                rejectPatterns: [/\/p\//, /\/reel\//, /\/reels\//, /\/stories\//, /\/explore\//, /\/direct\//, /\/accounts\//, /\/tv\//, /\?__a=/],
                canonicalize: (url) => {
                    if (this.PLATFORMS.instagram.rejectPatterns.some(p => p.test(url))) return null;
                    const match = url.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i);
                    if (match && match[1]) {
                        const username = match[1].toLowerCase();
                        const reserved = ['p', 'reel', 'reels', 'stories', 'explore', 'direct', 'accounts', 'tv', 'about', 'legal', 'api', 'help'];
                        if (reserved.includes(username)) return null;
                        return `https://www.instagram.com/${username}`;
                    }
                    return null;
                }
            },
            linkedin: {
                priority: 3,
                patterns: [/linkedin\.com\/in\/([^/?#]+)/i, /linkedin\.com\/company\/([^/?#]+)/i],
                rejectPatterns: [/\/feed/, /\/jobs/, /\/posts\//, /\/pulse\//, /\/groups\//, /\/learning/, /\/messaging/],
                canonicalize: (url) => {
                    if (this.PLATFORMS.linkedin.rejectPatterns.some(p => p.test(url))) return null;
                    let match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
                    if (match) return `https://www.linkedin.com/in/${match[1].toLowerCase()}`;
                    match = url.match(/linkedin\.com\/company\/([a-zA-Z0-9_-]+)/i);
                    if (match) return `https://www.linkedin.com/company/${match[1].toLowerCase()}`;
                    return null;
                }
            },
            tiktok: {
                priority: 4,
                patterns: [/tiktok\.com\/@([a-zA-Z0-9_.]+)/i],
                rejectPatterns: [/\/video\//, /\/t\//, /\/music\//, /\/tag\//],
                canonicalize: (url) => {
                    if (this.PLATFORMS.tiktok.rejectPatterns.some(p => p.test(url))) return null;
                    const match = url.match(/tiktok\.com\/@([a-zA-Z0-9_.]+)/i);
                    return match ? `https://www.tiktok.com/@${match[1].toLowerCase()}` : null;
                }
            },
            youtube: {
                priority: 5,
                patterns: [/youtube\.com\/@([^/?#]+)/i, /youtube\.com\/channel\/([^/?#]+)/i, /youtube\.com\/c\/([^/?#]+)/i, /youtube\.com\/user\/([^/?#]+)/i],
                rejectPatterns: [/\/watch/, /\/shorts\//, /\/playlist/, /\/results/, /\/embed/, /\/live/],
                canonicalize: (url) => {
                    if (this.PLATFORMS.youtube.rejectPatterns.some(p => p.test(url))) return null;
                    let match = url.match(/youtube\.com\/@([^/?#]+)/i);
                    if (match) return `https://www.youtube.com/@${match[1]}`;
                    match = url.match(/youtube\.com\/channel\/([^/?#]+)/i);
                    if (match) return `https://www.youtube.com/channel/${match[1]}`;
                    match = url.match(/youtube\.com\/c\/([^/?#]+)/i);
                    if (match) return `https://www.youtube.com/@${match[1]}`;
                    match = url.match(/youtube\.com\/user\/([^/?#]+)/i);
                    if (match) return `https://www.youtube.com/@${match[1]}`;
                    return null;
                }
            },
            twitter: {
                priority: 6,
                patterns: [/(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/i],
                rejectPatterns: [/\/status\//, /\/share/, /\/intent\//, /\/home/, /\/explore/, /\/search/, /\/i\//],
                canonicalize: (url) => {
                    if (this.PLATFORMS.twitter.rejectPatterns.some(p => p.test(url))) return null;
                    const match = url.match(/(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/i);
                    if (match && match[1]) {
                        const username = match[1].toLowerCase();
                        const reserved = ['home', 'explore', 'search', 'notifications', 'messages', 'settings', 'i', 'intent', 'share', 'hashtag', 'login'];
                        if (reserved.includes(username)) return null;
                        return `https://x.com/${username}`;
                    }
                    return null;
                }
            },
            facebook: {
                priority: 7,
                patterns: [/(?:facebook|fb)\.com\/([a-zA-Z0-9.]+)/i, /facebook\.com\/profile\.php\?id=(\d+)/i],
                rejectPatterns: [/\/sharer/, /\/share/, /\/watch/, /\/reel/, /\/photo/, /\/posts\//, /\/events\//, /\/groups\//, /\/marketplace/, /\/dialog\//],
                canonicalize: (url) => {
                    if (this.PLATFORMS.facebook.rejectPatterns.some(p => p.test(url))) return null;
                    let match = url.match(/facebook\.com\/profile\.php\?id=(\d+)/i);
                    if (match) return `https://www.facebook.com/profile.php?id=${match[1]}`;
                    match = url.match(/(?:facebook|fb)\.com\/([a-zA-Z0-9.]+)/i);
                    if (match && match[1]) {
                        const page = match[1].toLowerCase();
                        const reserved = ['login', 'share', 'sharer', 'help', 'policies', 'privacy', 'watch', 'marketplace', 'groups', 'events', 'pages', 'dialog'];
                        if (reserved.includes(page)) return null;
                        return `https://www.facebook.com/${page}`;
                    }
                    return null;
                }
            }
        },

        // Known social domains to exclude from website detection
        SOCIAL_DOMAINS: [
            'facebook.com', 'fb.com', 'instagram.com', 'twitter.com', 'x.com',
            'linkedin.com', 'youtube.com', 'youtu.be', 'tiktok.com', 'whatsapp.com',
            'wa.me', 'pinterest.com', 'snapchat.com', 'reddit.com', 'telegram.org',
            't.me', 'discord.gg', 'discord.com', 'tumblr.com', 'medium.com',
            'github.com', 'vimeo.com', 'twitch.tv', 'spotify.com', 'google.com',
            'apple.com', 'bit.ly', 'linktr.ee', 'beacons.ai'
        ],

        // Rejected website paths
        REJECTED_PATHS: ['/privacy', '/terms', '/legal', '/blog', '/wp-content', '/tag', '/category', '/search', '/api', '/login'],

        /**
         * Main extraction - returns one best link per platform
         */
        extract(html) {
            const result = { links: [], byPlatform: {}, bestLinks: [] };

            try {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const currentDomain = this.getCurrentDomain();
                const candidates = new Map(); // url -> {platform, url, score}

                // Extract from anchor tags
                this.extractFromAnchors(doc, candidates, currentDomain);

                // Extract from visible text
                this.extractFromText(doc.body?.innerText || '', candidates, currentDomain);

                // Extract from meta tags
                this.extractFromMeta(doc, candidates, currentDomain);

                // Score footer/social area links higher
                this.scoreFooterLinks(doc, candidates);

                // Score by anchor text
                this.scoreAnchorText(doc, candidates);

                // Group by platform and get best per platform
                const grouped = this.groupByPlatform(candidates);

                // Build output
                for (const [platform, links] of Object.entries(grouped)) {
                    if (links.length === 0) continue;

                    // Sort by score descending
                    links.sort((a, b) => b.score - a.score);

                    // Best link for this platform
                    const best = links[0];
                    result.bestLinks.push({
                        platform,
                        url: best.url
                    });

                    // Add to byPlatform (all links for this platform)
                    result.byPlatform[platform] = links.map(l => l.url);

                    // Add to flat list
                    links.forEach(l => {
                        result.links.push({ platform, url: l.url });
                    });
                }

                // Sort bestLinks by platform priority
                result.bestLinks.sort((a, b) => {
                    const aPriority = this.PLATFORMS[a.platform]?.priority || 99;
                    const bPriority = this.PLATFORMS[b.platform]?.priority || 99;
                    return aPriority - bPriority;
                });

            } catch (error) {
                console.error('[SocialExtractor] Error:', error);
            }

            return result;
        },

        extractFromAnchors(doc, candidates, currentDomain) {
            doc.querySelectorAll('a[href]').forEach(anchor => {
                const href = anchor.getAttribute('href');
                if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

                try {
                    const absoluteUrl = this.resolveUrl(href);
                    if (!absoluteUrl) return;

                    const cleaned = this.cleanUrl(absoluteUrl);
                    if (!cleaned) return;

                    this.detectAndAdd(cleaned, candidates, currentDomain, 0);
                } catch (e) { }
            });
        },

        extractFromText(text, candidates, currentDomain) {
            const urlPattern = /https?:\/\/[^\s<>"']+/gi;
            let match;
            while ((match = urlPattern.exec(text)) !== null) {
                try {
                    const cleaned = this.cleanUrl(match[0]);
                    if (cleaned) {
                        this.detectAndAdd(cleaned, candidates, currentDomain, 1);
                    }
                } catch (e) { }
            }
        },

        extractFromMeta(doc, candidates, currentDomain) {
            ['meta[property="og:url"]', 'meta[property="og:see_also"]'].forEach(selector => {
                doc.querySelectorAll(selector).forEach(meta => {
                    const content = meta.getAttribute('content');
                    if (content && content.startsWith('http')) {
                        try {
                            const cleaned = this.cleanUrl(content);
                            if (cleaned) {
                                this.detectAndAdd(cleaned, candidates, currentDomain, 2);
                            }
                        } catch (e) { }
                    }
                });
            });
        },

        scoreFooterLinks(doc, candidates) {
            const footerSelectors = ['footer', '.footer', '#footer', '.social', '.social-links', '[class*="social"]'];
            footerSelectors.forEach(selector => {
                doc.querySelectorAll(selector).forEach(container => {
                    container.querySelectorAll('a[href]').forEach(anchor => {
                        try {
                            const cleaned = this.cleanUrl(this.resolveUrl(anchor.getAttribute('href')));
                            if (cleaned && candidates.has(cleaned.toLowerCase())) {
                                candidates.get(cleaned.toLowerCase()).score += 5;
                            }
                        } catch (e) { }
                    });
                });
            });
        },

        scoreAnchorText(doc, candidates) {
            const keywords = ['instagram', 'linkedin', 'twitter', 'youtube', 'tiktok', 'facebook', 'whatsapp', 'follow', 'connect'];
            doc.querySelectorAll('a[href]').forEach(anchor => {
                const text = (anchor.textContent + ' ' + (anchor.getAttribute('aria-label') || '')).toLowerCase();
                try {
                    const cleaned = this.cleanUrl(this.resolveUrl(anchor.getAttribute('href')));
                    if (cleaned && candidates.has(cleaned.toLowerCase())) {
                        if (keywords.some(kw => text.includes(kw))) {
                            candidates.get(cleaned.toLowerCase()).score += 3;
                        }
                    }
                } catch (e) { }
            });
        },

        detectAndAdd(url, candidates, currentDomain, baseScore) {
            // Check each platform
            for (const [platformKey, config] of Object.entries(this.PLATFORMS)) {
                if (config.patterns.some(p => p.test(url))) {
                    const canonical = config.canonicalize.call(this, url);
                    if (!canonical) continue;

                    const key = canonical.toLowerCase();
                    if (!candidates.has(key)) {
                        candidates.set(key, { platform: platformKey, url: canonical, score: baseScore + 4 });
                    } else {
                        candidates.get(key).score += 2;
                    }
                    return;
                }
            }

            // Check for website
            this.detectWebsite(url, candidates, currentDomain, baseScore);
        },

        detectWebsite(url, candidates, currentDomain, baseScore) {
            try {
                const parsed = new URL(url);
                const hostname = parsed.hostname.replace('www.', '').toLowerCase();

                if (currentDomain && hostname === currentDomain) return;
                if (this.SOCIAL_DOMAINS.some(social => hostname.includes(social))) return;
                if (this.REJECTED_PATHS.some(p => parsed.pathname.toLowerCase().startsWith(p))) return;

                const rootUrl = `https://${parsed.hostname}`;
                const key = rootUrl.toLowerCase();

                if (!candidates.has(key)) {
                    candidates.set(key, { platform: 'website', url: rootUrl, score: baseScore + 2 });
                } else {
                    candidates.get(key).score += 1;
                }
            } catch (e) { }
        },

        groupByPlatform(candidates) {
            const grouped = {};
            const seenUsernames = {};

            for (const [key, data] of candidates) {
                const platform = data.platform;
                if (!grouped[platform]) {
                    grouped[platform] = [];
                    seenUsernames[platform] = new Set();
                }

                // Extract username for deduplication
                const username = key.split('/').pop() || key;
                if (seenUsernames[platform].has(username)) continue;
                seenUsernames[platform].add(username);

                grouped[platform].push(data);
            }

            return grouped;
        },

        getCurrentDomain() {
            try {
                return window.location.hostname.replace('www.', '').toLowerCase();
            } catch {
                return '';
            }
        },

        resolveUrl(href) {
            try {
                if (href.startsWith('http://') || href.startsWith('https://')) return href;
                return new URL(href, window.location.href).href;
            } catch {
                return null;
            }
        },

        cleanUrl(url) {
            try {
                const parsed = new URL(url);
                parsed.protocol = 'https:';
                this.TRACKING_PARAMS.forEach(param => parsed.searchParams.delete(param));
                parsed.hash = '';
                if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
                    parsed.pathname = parsed.pathname.slice(0, -1);
                }
                return decodeURIComponent(parsed.href).replace(/['"<>)\]]+$/, '');
            } catch {
                return null;
            }
        }
    };

    // ====== SERP EXTRACTOR (Google Search) ======
    const SerpExtractor = {
        extract() {
            const result = { linkedin: [] };
            try {
                if (!window.location.hostname.includes('google.')) return result;
                const selectors = ['div.yuRUbf a', 'a[jsname="UWckNb"]', 'div.g a[href]'];
                const links = new Set();
                for (const selector of selectors) {
                    document.querySelectorAll(selector).forEach(el => {
                        let href = el.href;
                        if (href.includes('/url?')) {
                            const url = new URL(href);
                            href = url.searchParams.get('q') || url.searchParams.get('url') || href;
                        }
                        if (href) links.add(href);
                    });
                }
                for (const link of links) {
                    const url = link.toLowerCase();
                    if ((url.includes('linkedin.com/in/') || url.includes('linkedin.com/company/')) &&
                        !url.match(/linkedin\.com\/?$/) && !url.match(/in\.linkedin\.com\/?$/)) {
                        // Canonicalize LinkedIn URL
                        let match = link.match(/linkedin\.com\/in\/([^/?#]+)/i);
                        if (match) {
                            result.linkedin.push(`https://www.linkedin.com/in/${match[1].toLowerCase()}`);
                        } else {
                            match = link.match(/linkedin\.com\/company\/([^/?#]+)/i);
                            if (match) {
                                result.linkedin.push(`https://www.linkedin.com/company/${match[1].toLowerCase()}`);
                            }
                        }
                    }
                }
                result.linkedin = [...new Set(result.linkedin)];
            } catch (error) {
                console.error('[SerpExtractor] Error:', error);
            }
            return result;
        }
    };

    // ====== PROFILE EXTRACTOR (LinkedIn + Instagram) ======
    const ProfileExtractor = {
        detectProfilePage(url) {
            const urlLower = url.toLowerCase();

            if (urlLower.includes('linkedin.com/in/')) {
                return { platform: 'LinkedIn', type: 'personal' };
            }
            if (urlLower.includes('linkedin.com/company/')) {
                return { platform: 'LinkedIn', type: 'company' };
            }

            if (urlLower.includes('instagram.com/')) {
                const excludePatterns = ['/p/', '/reels/', '/stories/', '/explore/', '/direct/', '/accounts/', '/reel/'];
                if (excludePatterns.some(p => urlLower.includes(p))) {
                    return null;
                }
                const match = url.match(/instagram\.com\/([^/?#]+)/i);
                if (match && match[1] && !['p', 'reels', 'stories', 'explore', 'direct', 'accounts', 'reel'].includes(match[1].toLowerCase())) {
                    return { platform: 'Instagram', type: 'personal' };
                }
            }

            return null;
        },

        extractLinkedIn(doc, url) {
            const profile = {
                platform: 'LinkedIn',
                profileUrl: url.split('?')[0],
                fullName: '',
                username: '',
                headline: '',
                location: '',
                companyName: '',
                links: [],
                email: '',
                phone: ''
            };

            try {
                const nameSelectors = ['h1.text-heading-xlarge', 'h1[class*="text-heading"]', '.pv-top-card h1', '.ph5 h1', 'h1'];
                for (const sel of nameSelectors) {
                    const el = doc.querySelector(sel);
                    if (el && el.textContent.trim()) {
                        profile.fullName = el.textContent.trim();
                        break;
                    }
                }

                const urlMatch = url.match(/linkedin\.com\/in\/([^/?#]+)/i);
                if (urlMatch) profile.username = urlMatch[1];

                const headlineSelectors = ['.text-body-medium.break-words', 'div[class*="text-body-medium"]'];
                for (const sel of headlineSelectors) {
                    const el = doc.querySelector(sel);
                    if (el && el.textContent.trim()) {
                        profile.headline = el.textContent.trim();
                        break;
                    }
                }

                const pageText = doc.body.innerText;
                const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                if (emailMatch) profile.email = emailMatch[0];

                const phoneMatch = pageText.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
                if (phoneMatch) profile.phone = phoneMatch[0];

            } catch (error) {
                console.error('[ProfileExtractor] LinkedIn error:', error);
            }

            return profile;
        },

        extractInstagram(doc, url) {
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
                const urlMatch = url.match(/instagram\.com\/([^/?#]+)/i);
                if (urlMatch) profile.username = urlMatch[1];

                const pageText = doc.body.innerText;
                const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                if (emailMatch) profile.email = emailMatch[0];

                const phoneMatch = pageText.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
                if (phoneMatch) profile.phone = phoneMatch[0];

            } catch (error) {
                console.error('[ProfileExtractor] Instagram error:', error);
            }

            return profile;
        },

        extract(doc, url) {
            const detection = this.detectProfilePage(url);

            if (!detection) {
                return { profile: null, isProfilePage: false };
            }

            let profile;
            if (detection.platform === 'LinkedIn') {
                profile = this.extractLinkedIn(doc, url);
            } else if (detection.platform === 'Instagram') {
                profile = this.extractInstagram(doc, url);
            }

            if (profile) {
                profile.id = this.generateId(profile.profileUrl);
                profile.createdAt = Date.now();
                profile.sourceDomain = new URL(url).hostname;
            }

            return { profile, isProfilePage: true };
        },

        generateId(url) {
            let hash = 0;
            for (let i = 0; i < url.length; i++) {
                const char = url.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(36);
        }
    };

    // ====== MESSAGE HANDLER WITH GUARANTEED RESPONSE ======
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        // PING - immediate
        if (request.type === 'PING') {
            sendResponse({ status: 'ok' });
            return true;
        }

        // EXTRACT_DATA - with internal timeout
        if (request.type === 'EXTRACT_DATA') {
            const emptyResponse = {
                emails: [],
                invalidEmails: [],
                phones: [],
                phonesFiltered: 0,
                socialLinks: [],
                socialsByPlatform: {},
                serpLinks: { linkedin: [] }
            };

            // Start timeout - MUST respond within 2 seconds
            let responded = false;
            const timeoutId = setTimeout(() => {
                if (!responded) {
                    responded = true;
                    console.warn('[ContentScript] Extraction timeout - returning empty');
                    sendResponse({ ...emptyResponse, timeout: true });
                }
            }, 2000);

            // Run extraction in try-catch
            try {
                const result = safeExtractData(request);
                if (!responded) {
                    responded = true;
                    clearTimeout(timeoutId);
                    sendResponse(result);
                }
            } catch (error) {
                console.error('[ContentScript] Extraction crashed:', error);
                if (!responded) {
                    responded = true;
                    clearTimeout(timeoutId);
                    sendResponse({ ...emptyResponse, error: error.message });
                }
            }

            return true; // Required for async
        }

        // EXTRACT_PROFILE - with internal timeout
        if (request.type === 'EXTRACT_PROFILE') {
            const emptyResponse = { profile: null, isProfilePage: false };

            let responded = false;
            const timeoutId = setTimeout(() => {
                if (!responded) {
                    responded = true;
                    console.warn('[ContentScript] Profile extraction timeout');
                    sendResponse({ ...emptyResponse, timeout: true });
                }
            }, 2000);

            try {
                const result = safeExtractProfile();
                if (!responded) {
                    responded = true;
                    clearTimeout(timeoutId);
                    sendResponse(result);
                }
            } catch (error) {
                console.error('[ContentScript] Profile extraction crashed:', error);
                if (!responded) {
                    responded = true;
                    clearTimeout(timeoutId);
                    sendResponse({ ...emptyResponse, error: error.message });
                }
            }

            return true;
        }

        // Unknown
        sendResponse({ error: 'Unknown message type' });
        return true;
    });

    /**
     * SAFE data extraction - each extractor wrapped in try-catch
     */
    function safeExtractData(request) {
        const response = {
            emails: [],
            invalidEmails: [],
            phones: [],
            phonesFiltered: 0,
            socialLinks: [],
            socialsByPlatform: {},
            serpLinks: { linkedin: [] }
        };

        // Get HTML safely (max 300KB)
        let html = '';
        try {
            html = document.documentElement.innerHTML || '';
            if (html.length > 300000) {
                html = html.substring(0, 300000);
            }
        } catch (e) {
            console.error('[ContentScript] HTML read failed:', e.message);
            return response;
        }

        // EMAIL extraction (safe)
        if (request.extractEmails) {
            try {
                const result = EmailExtractor.extract(html, request.validateEmails);
                response.emails = result.valid || [];
                response.invalidEmails = result.invalid || [];
            } catch (e) {
                console.error('[EmailExtractor] crashed:', e.message);
                response.emails = [];
            }
        }

        // PHONE extraction (safe - if crashes, return empty)
        if (request.extractPhones) {
            try {
                const result = PhoneExtractor.extract(html, request.selectedCountries || []);
                response.phones = result.phones || [];
                response.phonesFiltered = result.filtered || 0;
            } catch (e) {
                console.error('[PhoneExtractor] crashed:', e.message);
                response.phones = [];
            }
        }

        // SOCIAL extraction (safe)
        if (request.extractSocials) {
            try {
                const result = SocialExtractor.extract(html);
                response.socialLinks = result.links || [];
                response.socialsByPlatform = result.byPlatform || {};
            } catch (e) {
                console.error('[SocialExtractor] crashed:', e.message);
                response.socialLinks = [];
            }
        }

        // SERP extraction (safe)
        if (request.extractSerpLinks) {
            try {
                response.serpLinks = SerpExtractor.extract() || { linkedin: [] };
            } catch (e) {
                console.error('[SerpExtractor] crashed:', e.message);
            }
        }

        return response;
    }

    /**
     * SAFE profile extraction
     */
    function safeExtractProfile() {
        const url = window.location.href;
        const result = ProfileExtractor.extract(document, url);

        if (result.profile) {
            let html = '';
            try {
                html = document.documentElement.innerHTML;
                if (html.length > 400000) {
                    html = html.substring(0, 400000);
                }
            } catch (e) {
                return result;
            }

            try {
                const emailResult = EmailExtractor.extract(html, true);
                if (emailResult.valid.length > 0 && !result.profile.email) {
                    result.profile.email = emailResult.valid[0];
                }
                result.profile.allEmails = emailResult.valid || [];
            } catch (e) {
                result.profile.allEmails = [];
            }

            try {
                const phoneResult = PhoneExtractor.extract(html, []);
                if (phoneResult.phones.length > 0 && !result.profile.phone) {
                    result.profile.phone = phoneResult.phones[0];
                }
                result.profile.allPhones = phoneResult.phones || [];
            } catch (e) {
                result.profile.allPhones = [];
            }

            try {
                const socialResult = SocialExtractor.extract(html);
                result.profile.allSocialLinks = socialResult.links || [];
                if (socialResult.links.length > 0 && result.profile.links.length === 0) {
                    result.profile.links = socialResult.links.map(l => l.url);
                }
            } catch (e) {
                result.profile.allSocialLinks = [];
            }
        }

        return result;
    }

    console.log('[Email Extractor Pro] Content script loaded (v3.0 - Timeout Safe)');
})();

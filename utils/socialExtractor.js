/**
 * Social Link Extractor - Premium Quality Engine
 * 
 * Features:
 * - Multi-source extraction (anchors, text, meta, footer)
 * - URL canonicalization and cleanup
 * - Strict profile-only rules per platform
 * - Confidence scoring system
 * - One best link per platform
 */

const SocialExtractor = {
    // Debug mode
    DEBUG: false,

    // Tracking params to remove
    TRACKING_PARAMS: [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'igshid', 'si', 'ref', 'ref_src', 'ref_url',
        'source', 'medium', 'campaign', 'yclid', 'msclkid', 'dclid',
        '_ga', '_gid', 'mc_cid', 'mc_eid', 'feature', 'app', 'src',
        '__a', 'hl', 'locale', 'lang'
    ],

    // Platform configurations with strict rules
    PLATFORMS: {
        whatsapp: {
            name: 'WhatsApp',
            priority: 1,
            patterns: [
                /(?:https?:\/\/)?(?:api\.)?whatsapp\.com\/send\?phone=(\d+)/i,
                /(?:https?:\/\/)?wa\.me\/(\d+)/i
            ],
            rejectPatterns: [],
            validate: (url) => {
                const phoneMatch = url.match(/(?:wa\.me\/|phone=)(\d+)/);
                return phoneMatch && phoneMatch[1].length >= 10;
            },
            canonicalize: (url) => {
                const phoneMatch = url.match(/(?:wa\.me\/|phone=)(\d+)/);
                if (phoneMatch) {
                    return `https://wa.me/${phoneMatch[1]}`;
                }
                return null;
            },
            extractUsername: (url) => {
                const match = url.match(/(?:wa\.me\/|phone=)(\d+)/);
                return match ? match[1] : null;
            }
        },

        instagram: {
            name: 'Instagram',
            priority: 2,
            patterns: [
                /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\/?$/i,
                /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\?/i,
                /(?:https?:\/\/)?(?:www\.)?instagr\.am\/([a-zA-Z0-9_.]+)/i
            ],
            rejectPatterns: [
                /instagram\.com\/p\//i,           // Posts
                /instagram\.com\/reel\//i,        // Reels
                /instagram\.com\/reels\//i,       // Reels
                /instagram\.com\/stories\//i,     // Stories
                /instagram\.com\/explore\//i,     // Explore
                /instagram\.com\/direct\//i,      // Direct messages
                /instagram\.com\/accounts\//i,    // Account settings
                /instagram\.com\/tv\//i,          // IGTV
                /instagram\.com\/about\//i,
                /instagram\.com\/legal\//i,
                /instagram\.com\/api\//i,
                /\?__a=1/i                         // API calls
            ],
            validate: (url, username) => {
                if (!username) return false;
                // Reject reserved/system usernames
                const reserved = ['p', 'reel', 'reels', 'stories', 'explore', 'direct', 'accounts', 'tv', 'about', 'legal', 'api', 'help', 'privacy', 'terms'];
                return !reserved.includes(username.toLowerCase()) && username.length >= 1;
            },
            canonicalize: (url) => {
                const match = url.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i);
                if (match && match[1]) {
                    const username = match[1].toLowerCase();
                    const reserved = ['p', 'reel', 'reels', 'stories', 'explore', 'direct', 'accounts', 'tv', 'about', 'legal', 'api'];
                    if (reserved.includes(username)) return null;
                    return `https://www.instagram.com/${username}`;
                }
                return null;
            },
            extractUsername: (url) => {
                const match = url.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i);
                return match ? match[1].toLowerCase() : null;
            }
        },

        linkedin: {
            name: 'LinkedIn',
            priority: 3,
            patterns: [
                /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i,
                /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/company\/([a-zA-Z0-9_-]+)/i
            ],
            rejectPatterns: [
                /linkedin\.com\/feed/i,
                /linkedin\.com\/jobs/i,
                /linkedin\.com\/posts\//i,
                /linkedin\.com\/pulse\//i,
                /linkedin\.com\/groups\//i,
                /linkedin\.com\/learning/i,
                /linkedin\.com\/messaging/i,
                /linkedin\.com\/notifications/i,
                /linkedin\.com\/mynetwork/i,
                /linkedin\.com\/search/i,
                /linkedin\.com\/help/i,
                /linkedin\.com\/legal/i,
                /linkedin\.com\/?$/i,              // Root only
                /linkedin\.com\/\?/i               // Root with params
            ],
            validate: (url, username) => {
                if (!username) return false;
                return username.length >= 2;
            },
            canonicalize: (url) => {
                // Personal profile
                let match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
                if (match && match[1]) {
                    return `https://www.linkedin.com/in/${match[1].toLowerCase()}`;
                }
                // Company page
                match = url.match(/linkedin\.com\/company\/([a-zA-Z0-9_-]+)/i);
                if (match && match[1]) {
                    return `https://www.linkedin.com/company/${match[1].toLowerCase()}`;
                }
                return null;
            },
            extractUsername: (url) => {
                let match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
                if (match) return match[1].toLowerCase();
                match = url.match(/linkedin\.com\/company\/([a-zA-Z0-9_-]+)/i);
                return match ? `company/${match[1].toLowerCase()}` : null;
            },
            // Prefer /in/ over /company/
            compareLinks: (a, b) => {
                const aIsPersonal = a.includes('/in/');
                const bIsPersonal = b.includes('/in/');
                if (aIsPersonal && !bIsPersonal) return -1;
                if (!aIsPersonal && bIsPersonal) return 1;
                return 0;
            }
        },

        tiktok: {
            name: 'TikTok',
            priority: 4,
            patterns: [
                /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.]+)/i
            ],
            rejectPatterns: [
                /tiktok\.com\/video\//i,
                /tiktok\.com\/t\//i,              // Short links
                /tiktok\.com\/music\//i,
                /tiktok\.com\/tag\//i,
                /tiktok\.com\/discover/i,
                /tiktok\.com\/foryou/i,
                /tiktok\.com\/following/i,
                /tiktok\.com\/live/i
            ],
            validate: (url, username) => {
                return username && username.length >= 1;
            },
            canonicalize: (url) => {
                const match = url.match(/tiktok\.com\/@([a-zA-Z0-9_.]+)/i);
                if (match && match[1]) {
                    return `https://www.tiktok.com/@${match[1].toLowerCase()}`;
                }
                return null;
            },
            extractUsername: (url) => {
                const match = url.match(/tiktok\.com\/@([a-zA-Z0-9_.]+)/i);
                return match ? match[1].toLowerCase() : null;
            }
        },

        youtube: {
            name: 'YouTube',
            priority: 5,
            patterns: [
                /(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([a-zA-Z0-9_-]+)/i,
                /(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/([a-zA-Z0-9_-]+)/i,
                /(?:https?:\/\/)?(?:www\.)?youtube\.com\/c\/([a-zA-Z0-9_-]+)/i,
                /(?:https?:\/\/)?(?:www\.)?youtube\.com\/user\/([a-zA-Z0-9_-]+)/i
            ],
            rejectPatterns: [
                /youtube\.com\/watch/i,
                /youtube\.com\/shorts\//i,
                /youtube\.com\/playlist/i,
                /youtube\.com\/results/i,
                /youtube\.com\/feed/i,
                /youtube\.com\/embed/i,
                /youtube\.com\/live/i,
                /youtube\.com\/gaming/i,
                /youtu\.be\/[a-zA-Z0-9_-]+/i      // Video short links
            ],
            validate: (url, username) => {
                return username && username.length >= 1;
            },
            canonicalize: (url) => {
                // Prefer @handle format
                let match = url.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/i);
                if (match) return `https://www.youtube.com/@${match[1]}`;

                match = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/i);
                if (match) return `https://www.youtube.com/channel/${match[1]}`;

                match = url.match(/youtube\.com\/c\/([a-zA-Z0-9_-]+)/i);
                if (match) return `https://www.youtube.com/@${match[1]}`;

                match = url.match(/youtube\.com\/user\/([a-zA-Z0-9_-]+)/i);
                if (match) return `https://www.youtube.com/@${match[1]}`;

                return null;
            },
            extractUsername: (url) => {
                let match = url.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/i);
                if (match) return match[1];
                match = url.match(/youtube\.com\/(?:channel|c|user)\/([a-zA-Z0-9_-]+)/i);
                return match ? match[1] : null;
            }
        },

        twitter: {
            name: 'Twitter/X',
            priority: 6,
            patterns: [
                /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)\/?$/i,
                /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)\?/i
            ],
            rejectPatterns: [
                /(?:twitter|x)\.com\/.*\/status\//i,
                /(?:twitter|x)\.com\/share/i,
                /(?:twitter|x)\.com\/intent\//i,
                /(?:twitter|x)\.com\/home/i,
                /(?:twitter|x)\.com\/explore/i,
                /(?:twitter|x)\.com\/search/i,
                /(?:twitter|x)\.com\/notifications/i,
                /(?:twitter|x)\.com\/messages/i,
                /(?:twitter|x)\.com\/settings/i,
                /(?:twitter|x)\.com\/i\//i,
                /(?:twitter|x)\.com\/hashtag\//i
            ],
            validate: (url, username) => {
                if (!username) return false;
                const reserved = ['home', 'explore', 'search', 'notifications', 'messages', 'settings', 'i', 'intent', 'share', 'hashtag', 'login', 'signup'];
                return !reserved.includes(username.toLowerCase()) && username.length >= 1;
            },
            canonicalize: (url) => {
                const match = url.match(/(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/i);
                if (match && match[1]) {
                    const username = match[1].toLowerCase();
                    const reserved = ['home', 'explore', 'search', 'notifications', 'messages', 'settings', 'i', 'intent', 'share', 'hashtag'];
                    if (reserved.includes(username)) return null;
                    return `https://x.com/${username}`;
                }
                return null;
            },
            extractUsername: (url) => {
                const match = url.match(/(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/i);
                return match ? match[1].toLowerCase() : null;
            }
        },

        facebook: {
            name: 'Facebook',
            priority: 7,
            patterns: [
                /(?:https?:\/\/)?(?:www\.)?(?:facebook|fb)\.com\/([a-zA-Z0-9.]+)\/?$/i,
                /(?:https?:\/\/)?(?:www\.)?(?:facebook|fb)\.com\/([a-zA-Z0-9.]+)\?/i,
                /(?:https?:\/\/)?(?:www\.)?facebook\.com\/profile\.php\?id=(\d+)/i
            ],
            rejectPatterns: [
                /facebook\.com\/sharer/i,
                /facebook\.com\/share/i,
                /facebook\.com\/watch/i,
                /facebook\.com\/reel/i,
                /facebook\.com\/photo/i,
                /facebook\.com\/posts\//i,
                /facebook\.com\/events\//i,
                /facebook\.com\/groups\//i,
                /facebook\.com\/marketplace/i,
                /facebook\.com\/gaming/i,
                /facebook\.com\/stories/i,
                /facebook\.com\/login/i,
                /facebook\.com\/help/i,
                /facebook\.com\/policies/i,
                /facebook\.com\/privacy/i,
                /facebook\.com\/dialog\//i
            ],
            validate: (url, username) => {
                if (!username) return false;
                const reserved = ['login', 'share', 'sharer', 'help', 'policies', 'privacy', 'watch', 'marketplace', 'groups', 'events', 'pages', 'profile.php', 'dialog', 'gaming', 'stories'];
                return !reserved.includes(username.toLowerCase()) && username.length >= 1;
            },
            canonicalize: (url) => {
                // Profile with ID
                let match = url.match(/facebook\.com\/profile\.php\?id=(\d+)/i);
                if (match) return `https://www.facebook.com/profile.php?id=${match[1]}`;

                // Page/profile name
                match = url.match(/(?:facebook|fb)\.com\/([a-zA-Z0-9.]+)/i);
                if (match && match[1]) {
                    const page = match[1].toLowerCase();
                    const reserved = ['login', 'share', 'sharer', 'help', 'policies', 'privacy', 'watch', 'marketplace', 'groups', 'events', 'pages', 'dialog'];
                    if (reserved.includes(page)) return null;
                    return `https://www.facebook.com/${page}`;
                }
                return null;
            },
            extractUsername: (url) => {
                let match = url.match(/facebook\.com\/profile\.php\?id=(\d+)/i);
                if (match) return match[1];
                match = url.match(/(?:facebook|fb)\.com\/([a-zA-Z0-9.]+)/i);
                return match ? match[1].toLowerCase() : null;
            }
        }
    },

    // Known social domains (exclude from website detection)
    SOCIAL_DOMAINS: [
        'facebook.com', 'fb.com', 'fb.me', 'instagram.com', 'instagr.am',
        'twitter.com', 'x.com', 't.co', 'linkedin.com', 'youtube.com',
        'youtu.be', 'tiktok.com', 'whatsapp.com', 'wa.me', 'api.whatsapp.com',
        'pinterest.com', 'snapchat.com', 'reddit.com', 'telegram.org', 't.me',
        'discord.gg', 'discord.com', 'tumblr.com', 'medium.com', 'github.com',
        'behance.net', 'dribbble.com', 'vimeo.com', 'twitch.tv', 'spotify.com',
        'soundcloud.com', 'google.com', 'apple.com', 'play.google.com',
        'apps.apple.com', 'bit.ly', 'linktr.ee', 'linkin.bio', 'beacons.ai'
    ],

    // Rejected website paths (not real website root)
    REJECTED_PATHS: [
        '/privacy', '/privacy-policy', '/terms', '/tos', '/legal',
        '/blog', '/wp-content', '/tag', '/category', '/page',
        '/search', '/api', '/admin', '/login', '/signup', '/register',
        '/cart', '/checkout', '/account', '/my-account', '/dashboard'
    ],

    /**
     * Main extraction function
     */
    extract(html) {
        const result = {
            links: [],          // All links with metadata
            byPlatform: {},     // Grouped by platform
            bestLinks: []       // One best per platform for preview
        };

        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const currentDomain = this.getCurrentDomain();
            const candidates = new Map(); // url -> {platform, url, score, username}

            // Source 1: Anchor tags
            this.extractFromAnchors(doc, candidates, currentDomain);

            // Source 2: Visible text URLs
            this.extractFromText(doc.body?.innerText || '', candidates, currentDomain);

            // Source 3: Meta tags
            this.extractFromMeta(doc, candidates, currentDomain);

            // Source 4: Footer/social area (bonus scoring)
            this.scoreFooterLinks(doc, candidates);

            // Source 5: Anchor text scoring
            this.scoreAnchorText(doc, candidates);

            // Process candidates: validate, score, dedupe
            const processed = this.processAndScore(candidates);

            // Group by platform and select best
            const grouped = this.groupByPlatform(processed);

            // Build result
            for (const [platform, links] of Object.entries(grouped)) {
                result.byPlatform[platform] = links.map(l => l.url);

                // Best link for this platform (highest score)
                if (links.length > 0) {
                    const best = links[0]; // Already sorted by score
                    result.bestLinks.push({
                        platform,
                        url: best.url,
                        username: best.username,
                        score: best.score
                    });

                    // Also add to flat list
                    links.forEach(l => {
                        result.links.push({
                            platform,
                            url: l.url,
                            username: l.username
                        });
                    });
                }
            }

            // Sort bestLinks by platform priority
            result.bestLinks.sort((a, b) => {
                const aPriority = this.PLATFORMS[a.platform]?.priority || 99;
                const bPriority = this.PLATFORMS[b.platform]?.priority || 99;
                return aPriority - bPriority;
            });

            if (this.DEBUG) {
                console.log('[SocialExtractor] Candidates:', candidates.size);
                console.log('[SocialExtractor] Processed:', processed.length);
                console.log('[SocialExtractor] Best links:', result.bestLinks);
            }

        } catch (error) {
            console.error('[SocialExtractor] Error:', error);
        }

        return result;
    },

    /**
     * Get current page domain
     */
    getCurrentDomain() {
        try {
            return window.location?.hostname?.replace('www.', '').toLowerCase() || '';
        } catch {
            return '';
        }
    },

    /**
     * Extract from anchor tags
     */
    extractFromAnchors(doc, candidates, currentDomain) {
        doc.querySelectorAll('a[href]').forEach(anchor => {
            const href = anchor.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

            try {
                const absoluteUrl = this.resolveUrl(href);
                if (!absoluteUrl) return;

                const cleanedUrl = this.cleanUrl(absoluteUrl);
                if (!cleanedUrl) return;

                this.detectAndAddPlatform(cleanedUrl, candidates, currentDomain, 0);
            } catch (e) { }
        });
    },

    /**
     * Extract URLs from visible text
     */
    extractFromText(text, candidates, currentDomain) {
        const urlPattern = /https?:\/\/[^\s<>"']+/gi;
        let match;
        while ((match = urlPattern.exec(text)) !== null) {
            try {
                const cleanedUrl = this.cleanUrl(match[0]);
                if (cleanedUrl) {
                    this.detectAndAddPlatform(cleanedUrl, candidates, currentDomain, 1);
                }
            } catch (e) { }
        }
    },

    /**
     * Extract from meta tags
     */
    extractFromMeta(doc, candidates, currentDomain) {
        const metaSelectors = [
            'meta[property="og:url"]',
            'meta[property="og:see_also"]',
            'meta[name="twitter:url"]'
        ];

        metaSelectors.forEach(selector => {
            doc.querySelectorAll(selector).forEach(meta => {
                const content = meta.getAttribute('content');
                if (content && content.startsWith('http')) {
                    try {
                        const cleanedUrl = this.cleanUrl(content);
                        if (cleanedUrl) {
                            this.detectAndAddPlatform(cleanedUrl, candidates, currentDomain, 2);
                        }
                    } catch (e) { }
                }
            });
        });
    },

    /**
     * Score links in footer/social areas higher
     */
    scoreFooterLinks(doc, candidates) {
        const footerSelectors = [
            'footer', '.footer', '#footer',
            '.social', '.social-links', '.social-icons',
            '[class*="social"]', '[id*="social"]',
            '.follow', '.connect'
        ];

        footerSelectors.forEach(selector => {
            doc.querySelectorAll(selector).forEach(container => {
                container.querySelectorAll('a[href]').forEach(anchor => {
                    const href = anchor.getAttribute('href');
                    if (!href) return;

                    try {
                        const cleanedUrl = this.cleanUrl(this.resolveUrl(href));
                        if (cleanedUrl && candidates.has(cleanedUrl)) {
                            const candidate = candidates.get(cleanedUrl);
                            candidate.score += 5; // Footer bonus
                        }
                    } catch (e) { }
                });
            });
        });
    },

    /**
     * Score based on anchor text containing platform names
     */
    scoreAnchorText(doc, candidates) {
        const platformKeywords = {
            'instagram': ['instagram', 'insta', 'ig'],
            'linkedin': ['linkedin', 'li'],
            'twitter': ['twitter', 'x', 'tweet'],
            'youtube': ['youtube', 'yt', 'subscribe'],
            'tiktok': ['tiktok', 'tik tok'],
            'facebook': ['facebook', 'fb'],
            'whatsapp': ['whatsapp', 'wa', 'chat']
        };

        // Website-related keywords that boost score
        const websiteKeywords = ['website', 'portfolio', 'official', 'home', 'visit', 'my site',
            'our site', 'homepage', 'main site', 'company site'];

        // Contact section keywords
        const contactKeywords = ['contact', 'email us', 'call us', 'about', 'connect', 'reach us', 'get in touch'];

        doc.querySelectorAll('a[href]').forEach(anchor => {
            const href = anchor.getAttribute('href');
            const text = (anchor.textContent || '').toLowerCase();
            const ariaLabel = (anchor.getAttribute('aria-label') || '').toLowerCase();
            const title = (anchor.getAttribute('title') || '').toLowerCase();
            const fullText = `${text} ${ariaLabel} ${title}`;

            if (!href) return;

            try {
                const cleanedUrl = this.cleanUrl(this.resolveUrl(href));
                if (!cleanedUrl) return;

                // Try to find matching candidate (by hostname for websites)
                let candidate = candidates.get(cleanedUrl);

                // Also check by hostname for website matching
                if (!candidate) {
                    try {
                        const parsed = new URL(cleanedUrl);
                        const hostnameKey = parsed.hostname.toLowerCase();
                        candidate = candidates.get(hostnameKey);
                    } catch { }
                }

                if (!candidate) return;

                // Check for platform keywords
                for (const [platform, keywords] of Object.entries(platformKeywords)) {
                    if (keywords.some(kw => fullText.includes(kw))) {
                        candidate.score += 5;
                        break;
                    }
                }

                // Check for website-specific keywords (+6 bonus)
                if (candidate.platform === 'website') {
                    if (websiteKeywords.some(kw => fullText.includes(kw))) {
                        candidate.score += 6;
                    }

                    // Check if in contact section context
                    const parentText = (anchor.closest('section, div, aside')?.textContent || '').toLowerCase().slice(0, 500);
                    if (contactKeywords.some(kw => parentText.includes(kw))) {
                        candidate.score += 3;
                    }
                }

                // Check for follow/connect keywords
                if (/follow|connect|dm|message|social/i.test(fullText)) {
                    candidate.score += 3;
                }

            } catch (e) { }
        });
    },

    /**
     * Detect platform and add to candidates
     */
    detectAndAddPlatform(url, candidates, currentDomain, baseScore) {
        // Check each platform
        for (const [platformKey, config] of Object.entries(this.PLATFORMS)) {
            // Check if URL matches any reject pattern
            if (config.rejectPatterns.some(p => p.test(url))) {
                continue;
            }

            // Check if URL matches accept pattern
            if (config.patterns.some(p => p.test(url))) {
                const canonical = config.canonicalize(url);
                if (!canonical) continue;

                const username = config.extractUsername(url);
                if (!config.validate(url, username)) continue;

                const key = canonical.toLowerCase();
                if (!candidates.has(key)) {
                    candidates.set(key, {
                        platform: platformKey,
                        url: canonical,
                        username: username,
                        score: baseScore + 4 // Perfect pattern match bonus
                    });
                } else {
                    // Increase score for repeated links
                    candidates.get(key).score += 2;
                }
                return;
            }
        }

        // Check for website (not a social platform)
        this.detectWebsite(url, candidates, currentDomain, baseScore);
    },

    /**
     * Detect personal/business website - STRICT QUALITY FILTER
     */
    detectWebsite(url, candidates, currentDomain, baseScore) {
        try {
            const parsed = new URL(url);
            const hostname = parsed.hostname.replace('www.', '').toLowerCase();
            const pathname = parsed.pathname.toLowerCase();

            // ===== STRICT BLACKLIST =====

            // Blacklisted domains - CDN, ads, system, tracking
            const DOMAIN_BLACKLIST = [
                // Google ecosystem
                'google.com', 'google.co', 'google.in', 'google.co.in', 'google.co.uk',
                'googleapis.com', 'gstatic.com', 'googleusercontent.com',
                'googleadservices.com', 'googlesyndication.com', 'googletagmanager.com',
                'googletagservices.com', 'googlevideo.com', 'googleanalytics.com',
                'doubleclick.net', 'adsense.com', 'adservice.google.com',
                'pagead2.googlesyndication.com', 'googleads.g.doubleclick.net',

                // Standards/specs
                'w3.org', 'schema.org', 'xml.org', 'json-ld.org',

                // CDNs
                'cloudflare.com', 'cloudflare-dns.com', 'cdnjs.cloudflare.com',
                'jsdelivr.net', 'unpkg.com', 'maxcdn.bootstrapcdn.com',
                'cdn.jsdelivr.net', 'bootstrapcdn.com', 'ajax.googleapis.com',
                'cdnjs.com', 'staticfile.org', 'staticlly.com',

                // Fonts/assets
                'fonts.googleapis.com', 'fonts.gstatic.com', 'fontawesome.com',
                'use.fontawesome.com', 'kit.fontawesome.com',
                'typekit.net', 'use.typekit.net',

                // Tracking/analytics
                'analytics.google.com', 'gtm.google.com', 'optimize.google.com',
                'hotjar.com', 'mouseflow.com', 'clarity.ms', 'newrelic.com',
                'segment.io', 'segment.com', 'mixpanel.com', 'amplitude.com',
                'fullstory.com', 'crazyegg.com', 'inspectlet.com',

                // Ad networks
                'facebook.net', 'fbcdn.net', 'connect.facebook.net',
                'static.xx.fbcdn.net', 'platform-lookaside.fbsbx.com',
                'amazon-adsystem.com', 'serving-sys.com', 'adsrvr.org',
                'criteo.com', 'outbrain.com', 'taboola.com', 'bidswitch.net',

                // Infrastructure
                'aws.amazon.com', 'amazonaws.com', 's3.amazonaws.com',
                'azure.microsoft.com', 'digitalocean.com', 'heroku.com',
                'netlify.com', 'vercel.com', 'pages.dev', 'workers.dev',

                // Common system domains
                'gravatar.com', 'wp.com', 'wordpress.org', 'wordpress.com',
                'w3schools.com', 'mozilla.org', 'developer.mozilla.org',
                'apple.com', 'microsoft.com', 'windows.com', 'office.com',
                'adobe.com', 'creativecloud.adobe.com',
                'paypal.com', 'stripe.com', 'razorpay.com',
                'recaptcha.net', 'hcaptcha.com',

                // Social media (handled separately)
                'facebook.com', 'fb.com', 'fb.me',
                'instagram.com', 'instagr.am', 'cdninstagram.com',
                'twitter.com', 'x.com', 't.co', 'twimg.com',
                'linkedin.com', 'licdn.com',
                'youtube.com', 'youtu.be', 'ytimg.com', 'googlevideo.com',
                'tiktok.com', 'tiktokcdn.com',
                'whatsapp.com', 'wa.me', 'whatsapp.net',
                'pinterest.com', 'pinimg.com',
                'snapchat.com', 'snap.com',
                'reddit.com', 'redd.it', 'redditstatic.com',
                'telegram.org', 't.me',
                'discord.gg', 'discord.com', 'discordapp.com',

                // Short URLs / link services
                'bit.ly', 'bitly.com', 'tinyurl.com', 'short.io',
                'linktr.ee', 'linkin.bio', 'beacons.ai', 'lnk.bio',
                'about.me', 'carrd.co',

                // Misc
                'jquery.com', 'react.js.org', 'vuejs.org', 'angular.io',
                'sentry.io', 'bugsnag.com', 'rollbar.com',
                'zendesk.com', 'intercom.io', 'drift.com', 'tawk.to',
                'mailchimp.com', 'sendgrid.com', 'mailgun.com',
                'trustpilot.com', 'yelp.com', 'tripadvisor.com'
            ];

            // Check against blacklist (exact or contains)
            for (const blocked of DOMAIN_BLACKLIST) {
                if (hostname === blocked || hostname.endsWith('.' + blocked)) {
                    return; // Blocked
                }
            }

            // Blacklisted domain patterns
            const DOMAIN_PATTERNS = [
                /^cdn\./i,                    // cdn.anything
                /\.cdn\./i,                   // anything.cdn.anything
                /^static\./i,                 // static.anything
                /^assets\./i,                 // assets.anything
                /^img[0-9]*\./i,              // img1.anything
                /^images\./i,                 // images.anything
                /^media\./i,                  // media.anything
                /^api\./i,                    // api.anything
                /^ads?\./i,                   // ad.anything, ads.anything
                /^track(ing)?\./i,            // track.anything, tracking.anything
                /^pixel\./i,                  // pixel.anything
                /\.googleusercontent\./i,
                /\.gstatic\./i,
                /\.fbcdn\./i
            ];

            for (const pattern of DOMAIN_PATTERNS) {
                if (pattern.test(hostname)) {
                    return; // Blocked
                }
            }

            // Skip if same as current domain
            if (currentDomain && hostname === currentDomain) return;

            // Skip if known social domain (from parent list)
            if (this.SOCIAL_DOMAINS.some(social => hostname.includes(social) || social.includes(hostname))) {
                return;
            }

            // Skip file extensions (not a webpage)
            const FILE_EXTENSIONS = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
                '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.zip', '.mp3', '.mp4'];
            for (const ext of FILE_EXTENSIONS) {
                if (pathname.endsWith(ext)) {
                    return; // File, not a page
                }
            }

            // Skip mailto/tel links
            if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('javascript:')) {
                return;
            }

            // ===== PATH BLACKLIST =====
            const PATH_BLACKLIST = [
                '/privacy', '/privacy-policy', '/terms', '/tos', '/legal', '/cookie',
                '/login', '/signup', '/register', '/signin', '/auth',
                '/wp-content', '/wp-includes', '/wp-admin', '/wp-json',
                '/ads', '/ad', '/advert', '/sponsor',
                '/sharer', '/share', '/intent',
                '/api/', '/ajax/', '/cdn-cgi/',
                '/.well-known/', '/feed/', '/rss',
                '/cart', '/checkout', '/account', '/dashboard', '/admin'
            ];

            for (const blocked of PATH_BLACKLIST) {
                if (pathname.includes(blocked)) {
                    return; // Blocked path
                }
            }

            // ===== QUALITY SCORING =====
            let score = baseScore;

            // +6: Root homepage (domain.com/)
            const isRootHomepage = pathname === '/' || pathname === '';
            if (isRootHomepage) {
                score += 6;
            }

            // +5: Clean short path (likely homepage)
            if (pathname.length <= 20 && !pathname.includes('?')) {
                score += 3;
            }

            // -5: Long query strings (tracking junk)
            const queryLength = parsed.search.length;
            if (queryLength > 50) {
                score -= 5;
            } else if (queryLength > 20) {
                score -= 2;
            }

            // -3: Very long pathname (probably not homepage)
            if (pathname.length > 50) {
                score -= 3;
            }

            // Skip if score too low (not quality enough)
            if (score < 4) {
                return;
            }

            // ===== NORMALIZE URL =====
            // Get clean root domain URL
            let cleanUrl;
            if (isRootHomepage) {
                cleanUrl = `https://${parsed.hostname}`;
            } else {
                // Remove tracking params
                let cleanPathname = pathname;
                // Remove trailing slash
                if (cleanPathname.endsWith('/') && cleanPathname.length > 1) {
                    cleanPathname = cleanPathname.slice(0, -1);
                }
                cleanUrl = `https://${parsed.hostname}${cleanPathname}`;
            }

            const key = parsed.hostname.toLowerCase(); // Dedupe by hostname only

            // Add or update candidate
            if (!candidates.has(key)) {
                candidates.set(key, {
                    platform: 'website',
                    url: cleanUrl,
                    username: hostname,
                    score: score
                });
            } else {
                // If existing, only update if this has better score or is root homepage
                const existing = candidates.get(key);
                if (score > existing.score) {
                    existing.score = score;
                    existing.url = cleanUrl;
                }
            }
        } catch (e) { }
    },

    /**
     * Resolve relative URL to absolute
     */
    resolveUrl(href) {
        try {
            if (href.startsWith('http://') || href.startsWith('https://')) {
                return href;
            }
            if (typeof window !== 'undefined' && window.location) {
                return new URL(href, window.location.href).href;
            }
            return null;
        } catch {
            return null;
        }
    },

    /**
     * Clean URL - remove tracking, normalize
     */
    cleanUrl(url) {
        try {
            const parsed = new URL(url);

            // Force HTTPS
            parsed.protocol = 'https:';

            // Remove tracking params
            this.TRACKING_PARAMS.forEach(param => {
                parsed.searchParams.delete(param);
            });

            // Remove hash
            parsed.hash = '';

            // Remove trailing slash (except for root)
            if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
                parsed.pathname = parsed.pathname.slice(0, -1);
            }

            // Decode and rebuild
            let result = decodeURIComponent(parsed.href);

            // Clean up any remaining junk at end
            result = result.replace(/['"<>)\]]+$/, '');

            return result;
        } catch {
            return null;
        }
    },

    /**
     * Process candidates: validate and score
     */
    processAndScore(candidates) {
        const processed = [];

        for (const [key, candidate] of candidates) {
            // Apply platform-specific scoring adjustments
            let score = candidate.score;

            // Penalty for excessive query params
            try {
                const url = new URL(candidate.url);
                if (url.searchParams.toString().length > 50) {
                    score -= 3;
                }
            } catch { }

            processed.push({
                ...candidate,
                score
            });
        }

        // Sort by score descending
        processed.sort((a, b) => b.score - a.score);

        return processed;
    },

    /**
     * Group by platform and dedupe
     */
    groupByPlatform(processed) {
        const grouped = {};
        const seenUsernames = {};

        for (const link of processed) {
            const platform = link.platform;

            if (!grouped[platform]) {
                grouped[platform] = [];
                seenUsernames[platform] = new Set();
            }

            // Dedupe by username/hostname
            const usernameKey = link.username?.toLowerCase() || link.url;
            if (seenUsernames[platform].has(usernameKey)) {
                continue;
            }
            seenUsernames[platform].add(usernameKey);

            grouped[platform].push(link);
        }

        // Sort each platform's links by score
        for (const platform of Object.keys(grouped)) {
            grouped[platform].sort((a, b) => {
                // Use platform-specific comparison if available
                const config = this.PLATFORMS[platform];
                if (config?.compareLinks) {
                    const cmp = config.compareLinks(a.url, b.url);
                    if (cmp !== 0) return cmp;
                }
                return b.score - a.score;
            });

            // Limit website results to max 5 high-quality ones
            if (platform === 'website') {
                grouped[platform] = grouped[platform].slice(0, 5);
            }
        }

        return grouped;
    }
};

// Export for browser
if (typeof window !== 'undefined') {
    window.SocialExtractor = SocialExtractor;
}

/**
 * Email Extractor - Professional Multi-Source Engine
 * Extracts maximum valid emails from all possible sources
 * 
 * Sources:
 * 1. Visible page text (innerText)
 * 2. Raw HTML (catches hidden emails)
 * 3. Mailto links
 * 4. Google SERP snippets
 * 5. Meta tags
 * 6. JSON-LD structured data
 * 7. Data attributes
 */

const EmailExtractor = {
  // Debug mode
  DEBUG: false,

  // Junk suffixes that get stuck to emails (e.g., gmail.comread)
  JUNK_SUFFIXES: [
    'read', 'more', 'phone', 'call', 'contact', 'email', 'ads', 'adspeople',
    'collab', 'message', 'whatsapp', 'click', 'here', 'now', 'button', 'link',
    'copy', 'share', 'send', 'reply', 'view', 'show', 'details', 'info',
    'enquiry', 'inquiry', 'form', 'submit', 'get', 'reach', 'us', 'me',
    'today', 'now', 'free', 'quote', 'help', 'support', 'service'
  ],

  // Fake/placeholder emails to reject
  FAKE_EMAILS: [
    'abc@xyz.com', 'test@test.com', 'example@example.com', 'email@example.com',
    'user@example.com', 'sample@sample.com', 'demo@demo.com', 'your@email.com',
    'name@domain.com', 'yourname@email.com', 'john@doe.com', 'jane@doe.com',
    'admin@example.com', 'info@example.com', 'mail@example.com', 'me@example.com',
    'you@example.com', 'user@domain.com', 'email@domain.com', 'name@example.com',
    'placeholder@email.com', 'noreply@example.com', 'no-reply@example.com'
  ],

  // Email domains that are often fake/spam
  SPAM_DOMAINS: [
    'example.com', 'example.org', 'example.net', 'test.com', 'domain.com',
    'email.com', 'mail.com', 'yoursite.com', 'website.com', 'company.com'
  ],

  /**
   * Main extraction function - multi-source
   */
  extract(html, validate = true, debugMode = false) {
    this.DEBUG = debugMode;

    const result = {
      valid: [],
      invalid: [],
      sources: {
        innerText: 0,
        html: 0,
        mailto: 0,
        serp: 0,
        meta: 0,
        jsonld: 0,
        dataAttr: 0
      }
    };

    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const allEmails = new Map(); // email -> source

      // Source 1: Visible page text
      const innerTextEmails = this.extractFromInnerText(doc);
      innerTextEmails.forEach(e => allEmails.set(e, 'innerText'));
      result.sources.innerText = innerTextEmails.length;

      // Source 2: Raw HTML
      const htmlEmails = this.extractFromRawHtml(html);
      htmlEmails.forEach(e => { if (!allEmails.has(e)) allEmails.set(e, 'html'); });
      result.sources.html = htmlEmails.length;

      // Source 3: Mailto links
      const mailtoEmails = this.extractFromMailto(doc);
      mailtoEmails.forEach(e => { if (!allEmails.has(e)) allEmails.set(e, 'mailto'); });
      result.sources.mailto = mailtoEmails.length;

      // Source 4: Google SERP specific
      const serpEmails = this.extractFromGoogleSerp(doc);
      serpEmails.forEach(e => { if (!allEmails.has(e)) allEmails.set(e, 'serp'); });
      result.sources.serp = serpEmails.length;

      // Source 5: Meta tags
      const metaEmails = this.extractFromMeta(doc);
      metaEmails.forEach(e => { if (!allEmails.has(e)) allEmails.set(e, 'meta'); });
      result.sources.meta = metaEmails.length;

      // Source 6: JSON-LD
      const jsonldEmails = this.extractFromJsonLd(doc);
      jsonldEmails.forEach(e => { if (!allEmails.has(e)) allEmails.set(e, 'jsonld'); });
      result.sources.jsonld = jsonldEmails.length;

      // Source 7: Data attributes
      const dataAttrEmails = this.extractFromDataAttributes(doc);
      dataAttrEmails.forEach(e => { if (!allEmails.has(e)) allEmails.set(e, 'dataAttr'); });
      result.sources.dataAttr = dataAttrEmails.length;

      // Debug logging
      if (this.DEBUG) {
        console.log('[EmailExtractor] === SOURCE BREAKDOWN ===');
        console.log('[EmailExtractor] innerText:', result.sources.innerText);
        console.log('[EmailExtractor] html:', result.sources.html);
        console.log('[EmailExtractor] mailto:', result.sources.mailto);
        console.log('[EmailExtractor] serp:', result.sources.serp);
        console.log('[EmailExtractor] meta:', result.sources.meta);
        console.log('[EmailExtractor] jsonld:', result.sources.jsonld);
        console.log('[EmailExtractor] dataAttr:', result.sources.dataAttr);
        console.log('[EmailExtractor] Total unique:', allEmails.size);
      }

      // Clean and validate all emails
      for (const [email, source] of allEmails) {
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

      // Deduplicate (case-insensitive)
      result.valid = this.deduplicate(result.valid);
      result.invalid = this.deduplicate(result.invalid);

      // Sort alphabetically
      result.valid.sort();
      result.invalid.sort();

      if (this.DEBUG) {
        console.log('[EmailExtractor] Final valid:', result.valid.length);
        console.log('[EmailExtractor] Final invalid:', result.invalid.length);
      }

    } catch (error) {
      console.error('[EmailExtractor] Error:', error);
    }

    return result;
  },

  /**
   * Powerful email regex pattern
   * Captures: normal emails, plus addressing, subdomains, uncommon TLDs
   */
  getEmailPattern() {
    // This pattern:
    // - Doesn't grab junk before/after
    // - Handles plus addressing (john+work@gmail.com)
    // - Handles subdomains (a@mail.company.co)
    // - TLD 2-24 chars
    return /(?<![a-zA-Z0-9._%+-])([a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,24})(?![a-zA-Z0-9._%+-])/gi;
  },

  /**
   * Simpler fallback pattern for edge cases
   */
  getSimpleEmailPattern() {
    return /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}/gi;
  },

  /**
   * Extract from visible text (innerText)
   */
  extractFromInnerText(doc) {
    const emails = new Set();
    const text = doc.body?.innerText || '';

    // Try primary pattern first
    const pattern = this.getEmailPattern();
    let match;
    while ((match = pattern.exec(text)) !== null) {
      emails.add(match[1] || match[0]);
    }

    // Also try simple pattern for edge cases
    const simplePattern = this.getSimpleEmailPattern();
    while ((match = simplePattern.exec(text)) !== null) {
      emails.add(match[0]);
    }

    return Array.from(emails);
  },

  /**
   * Extract from raw HTML (catches hidden emails)
   */
  extractFromRawHtml(html) {
    const emails = new Set();

    // Try primary pattern
    const pattern = this.getEmailPattern();
    let match;
    while ((match = pattern.exec(html)) !== null) {
      emails.add(match[1] || match[0]);
    }

    // Simple pattern for edge cases
    const simplePattern = this.getSimpleEmailPattern();
    while ((match = simplePattern.exec(html)) !== null) {
      emails.add(match[0]);
    }

    return Array.from(emails);
  },

  /**
   * Extract from mailto: links
   */
  extractFromMailto(doc) {
    const emails = new Set();

    // Mailto links
    doc.querySelectorAll('a[href^="mailto:"]').forEach(link => {
      const href = link.getAttribute('href') || '';
      const email = href.replace(/^mailto:/i, '').split('?')[0].trim();
      if (email && email.includes('@')) {
        emails.add(email);
      }
    });

    // Also check all anchor hrefs for emails
    doc.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href.includes('@') && !href.startsWith('mailto:')) {
        const pattern = this.getSimpleEmailPattern();
        let match;
        while ((match = pattern.exec(href)) !== null) {
          emails.add(match[0]);
        }
      }
    });

    return Array.from(emails);
  },

  /**
   * Extract from Google SERP (search results page)
   */
  extractFromGoogleSerp(doc) {
    const emails = new Set();

    // Check if this is a Google search page
    const isGoogle = doc.querySelector('div#search') ||
      doc.querySelector('div.g') ||
      doc.documentElement.innerHTML.includes('google.com/search');

    if (!isGoogle) return [];

    // Google SERP snippet selectors
    const serpSelectors = [
      'div.VwiC3b',           // Main snippet text
      'div.yXK7lf',           // Additional snippet
      'span.aCOpRe',          // Snippet spans
      'div.MjjYud',           // Result container
      'div.IsZvec',           // Description container
      'div.BNeawe',           // Some snippet format
      'div.s3v9rd',           // Another snippet format
      'span.st',              // Older snippet format
      'div.g .r',             // Result links
      'div.g span',           // All spans in results
      'cite',                 // URL citations
      'h3'                    // Titles
    ];

    serpSelectors.forEach(selector => {
      doc.querySelectorAll(selector).forEach(el => {
        const text = el.textContent || '';
        const pattern = this.getSimpleEmailPattern();
        let match;
        while ((match = pattern.exec(text)) !== null) {
          emails.add(match[0]);
        }
      });
    });

    // Also extract from decoded Google redirect URLs
    doc.querySelectorAll('a[href*="/url?"]').forEach(link => {
      const href = link.getAttribute('href') || '';
      try {
        const url = new URL(href, 'https://www.google.com');
        const actualUrl = url.searchParams.get('q') || url.searchParams.get('url') || '';
        const pattern = this.getSimpleEmailPattern();
        let match;
        while ((match = pattern.exec(actualUrl)) !== null) {
          emails.add(match[0]);
        }
      } catch (e) { }
    });

    return Array.from(emails);
  },

  /**
   * Extract from meta tags
   */
  extractFromMeta(doc) {
    const emails = new Set();

    const metaSelectors = [
      'meta[name="description"]',
      'meta[property="og:description"]',
      'meta[name="author"]',
      'meta[property="og:email"]',
      'meta[name="email"]',
      'meta[property="article:author"]'
    ];

    metaSelectors.forEach(selector => {
      doc.querySelectorAll(selector).forEach(meta => {
        const content = meta.getAttribute('content') || '';
        const pattern = this.getSimpleEmailPattern();
        let match;
        while ((match = pattern.exec(content)) !== null) {
          emails.add(match[0]);
        }
      });
    });

    return Array.from(emails);
  },

  /**
   * Extract from JSON-LD structured data
   */
  extractFromJsonLd(doc) {
    const emails = new Set();

    doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      const content = script.textContent || '';
      const pattern = this.getSimpleEmailPattern();
      let match;
      while ((match = pattern.exec(content)) !== null) {
        emails.add(match[0]);
      }
    });

    return Array.from(emails);
  },

  /**
   * Extract from data attributes
   */
  extractFromDataAttributes(doc) {
    const emails = new Set();

    // Look for data-email, data-mail, etc.
    doc.querySelectorAll('[data-email], [data-mail], [data-contact]').forEach(el => {
      ['data-email', 'data-mail', 'data-contact'].forEach(attr => {
        const value = el.getAttribute(attr) || '';
        if (value.includes('@')) {
          emails.add(value);
        }
      });
    });

    // Look for any attribute containing @
    doc.querySelectorAll('*').forEach(el => {
      for (const attr of el.attributes) {
        if (attr.value.includes('@') && !attr.name.startsWith('on')) {
          const pattern = this.getSimpleEmailPattern();
          let match;
          while ((match = pattern.exec(attr.value)) !== null) {
            emails.add(match[0]);
          }
        }
      }
    });

    // Also check aria-label
    doc.querySelectorAll('[aria-label*="@"]').forEach(el => {
      const label = el.getAttribute('aria-label') || '';
      const pattern = this.getSimpleEmailPattern();
      let match;
      while ((match = pattern.exec(label)) !== null) {
        emails.add(match[0]);
      }
    });

    return Array.from(emails);
  },

  /**
   * Clean an email - remove stuck prefixes/suffixes
   */
  cleanEmail(email) {
    if (!email || typeof email !== 'string') return null;

    let cleaned = email.trim().toLowerCase();

    // Remove leading junk characters
    cleaned = cleaned.replace(/^[-_.,;:!?#@&*()[\]{}|\\/\<\>'"=+`~^]+/, '');

    // Remove mailto: prefix if present
    cleaned = cleaned.replace(/^mailto:/i, '');

    // Split on @ to handle the domain part
    const atIndex = cleaned.indexOf('@');
    if (atIndex === -1) return null;

    const localPart = cleaned.substring(0, atIndex);
    let domainPart = cleaned.substring(atIndex + 1);

    // Clean up domain part - remove stuck suffixes
    // First, try to find where the valid TLD ends
    const domainMatch = domainPart.match(/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,24}/i);
    if (domainMatch) {
      domainPart = domainMatch[0];
    } else {
      // Fallback: remove known junk suffixes
      for (const suffix of this.JUNK_SUFFIXES) {
        const suffixPattern = new RegExp(`\\.${suffix}$|\\.com${suffix}$|\\.org${suffix}$|\\.net${suffix}$|\\.co${suffix}$`, 'i');
        if (suffixPattern.test(domainPart)) {
          // Remove the stuck suffix
          domainPart = domainPart.replace(new RegExp(suffix + '$', 'i'), '');
        }
        // Also handle case where suffix is stuck directly after TLD
        const pattern2 = new RegExp(`(\\.[a-z]{2,10})${suffix}`, 'i');
        const match2 = domainPart.match(pattern2);
        if (match2) {
          domainPart = domainPart.substring(0, domainPart.indexOf(match2[0]) + match2[1].length);
        }
      }
    }

    // Remove trailing junk from domain
    domainPart = domainPart.replace(/[-_.,;:!?#&*()[\]{}|\\/\<\>'"=+`~^]+$/, '');

    // Reconstruct email
    cleaned = localPart + '@' + domainPart;

    // Final validation check
    if (!cleaned.includes('@') || !cleaned.includes('.')) return null;
    if (cleaned.length < 6) return null; // a@b.co minimum

    // Remove any remaining invalid chars
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}$/.test(cleaned)) {
      // Try one more aggressive clean
      const finalMatch = cleaned.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}/);
      if (finalMatch) {
        cleaned = finalMatch[0];
      } else {
        return null;
      }
    }

    return cleaned;
  },

  /**
   * Validate an email
   */
  isValid(email) {
    if (!email) return false;

    const emailLower = email.toLowerCase();

    // Reject known fake emails
    if (this.FAKE_EMAILS.includes(emailLower)) return false;

    // Basic format check
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}$/.test(email)) return false;

    const [localPart, domainPart] = email.split('@');

    // Local part checks
    if (localPart.length < 1 || localPart.length > 64) return false;
    if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
    if (localPart.includes('..')) return false;

    // Domain part checks
    if (domainPart.length < 4) return false; // a.co minimum
    if (!domainPart.includes('.')) return false;
    if (domainPart.startsWith('.') || domainPart.startsWith('-')) return false;
    if (domainPart.endsWith('.') || domainPart.endsWith('-')) return false;

    // Reject image/file extensions mistaken as emails
    if (/\.(png|jpg|jpeg|gif|svg|webp|css|js|ico|woff|ttf|pdf|doc|mp4|mp3)$/i.test(domainPart)) {
      return false;
    }

    // Reject spam-like domains (but not too aggressively)
    if (this.SPAM_DOMAINS.includes(domainPart)) return false;

    // Reject obviously fake patterns
    if (/^(test|example|sample|demo|fake|dummy|placeholder|noreply|no-reply)@/i.test(email)) {
      return false;
    }

    return true;
  },

  /**
   * Deduplicate emails (case-insensitive)
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

// Export for browser
if (typeof window !== 'undefined') {
  window.EmailExtractor = EmailExtractor;
}

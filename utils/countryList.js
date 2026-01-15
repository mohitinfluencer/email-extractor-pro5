/**
 * Country List with Phone Validation Rules
 * All dial codes and validation patterns for phone extraction
 */

const COUNTRIES = [
    // Asia - High Priority
    {
        code: 'IN',
        name: 'India',
        dial: '+91',
        minDigits: 10,
        maxDigits: 10,
        mobilePrefix: /^[6-9]/,
        validate: (digits) => {
            if (digits.length !== 10) return false;
            if (!/^[6-9]/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('0') && digits.length === 11) digits = digits.substring(1);
            if (digits.startsWith('91') && digits.length === 12) digits = digits.substring(2);
            return digits;
        }
    },
    {
        code: 'AE',
        name: 'UAE',
        dial: '+971',
        minDigits: 9,
        maxDigits: 9,
        mobilePrefix: /^5/,
        validate: (digits) => {
            if (digits.length !== 9) return false;
            if (!/^5/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('971') && digits.length === 12) digits = digits.substring(3);
            if (digits.startsWith('0')) digits = digits.substring(1);
            return digits;
        }
    },
    {
        code: 'SA',
        name: 'Saudi Arabia',
        dial: '+966',
        minDigits: 9,
        maxDigits: 9,
        mobilePrefix: /^5/,
        validate: (digits) => {
            if (digits.length !== 9) return false;
            if (!/^5/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('966') && digits.length === 12) digits = digits.substring(3);
            if (digits.startsWith('0')) digits = digits.substring(1);
            return digits;
        }
    },
    {
        code: 'SG',
        name: 'Singapore',
        dial: '+65',
        minDigits: 8,
        maxDigits: 8,
        mobilePrefix: /^[89]/,
        validate: (digits) => {
            if (digits.length !== 8) return false;
            if (!/^[89]/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('65') && digits.length === 10) digits = digits.substring(2);
            return digits;
        }
    },
    {
        code: 'MY',
        name: 'Malaysia',
        dial: '+60',
        minDigits: 9,
        maxDigits: 10,
        mobilePrefix: /^1/,
        validate: (digits) => {
            if (digits.length < 9 || digits.length > 10) return false;
            if (!/^1/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('60')) digits = digits.substring(2);
            if (digits.startsWith('0')) digits = digits.substring(1);
            return digits;
        }
    },
    {
        code: 'ID',
        name: 'Indonesia',
        dial: '+62',
        minDigits: 9,
        maxDigits: 12,
        mobilePrefix: /^8/,
        validate: (digits) => {
            if (digits.length < 9 || digits.length > 12) return false;
            if (!/^8/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('62')) digits = digits.substring(2);
            if (digits.startsWith('0')) digits = digits.substring(1);
            return digits;
        }
    },
    {
        code: 'PH',
        name: 'Philippines',
        dial: '+63',
        minDigits: 10,
        maxDigits: 10,
        mobilePrefix: /^9/,
        validate: (digits) => {
            if (digits.length !== 10) return false;
            if (!/^9/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('63')) digits = digits.substring(2);
            if (digits.startsWith('0')) digits = digits.substring(1);
            return digits;
        }
    },

    // North America
    {
        code: 'US',
        name: 'USA',
        dial: '+1',
        minDigits: 10,
        maxDigits: 10,
        mobilePrefix: /^[2-9]/,
        validate: (digits) => {
            if (digits.length !== 10) return false;
            if (/^[01]/.test(digits)) return false;
            if (/^555/.test(digits)) return false; // Fake numbers
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('1') && digits.length === 11) digits = digits.substring(1);
            return digits;
        }
    },
    {
        code: 'CA',
        name: 'Canada',
        dial: '+1',
        minDigits: 10,
        maxDigits: 10,
        mobilePrefix: /^[2-9]/,
        validate: (digits) => {
            if (digits.length !== 10) return false;
            if (/^[01]/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('1') && digits.length === 11) digits = digits.substring(1);
            return digits;
        }
    },
    {
        code: 'MX',
        name: 'Mexico',
        dial: '+52',
        minDigits: 10,
        maxDigits: 10,
        mobilePrefix: /^[1-9]/,
        validate: (digits) => digits.length === 10,
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('52')) digits = digits.substring(2);
            return digits;
        }
    },

    // Europe
    {
        code: 'UK',
        name: 'United Kingdom',
        dial: '+44',
        minDigits: 10,
        maxDigits: 10,
        mobilePrefix: /^7/,
        validate: (digits) => {
            if (digits.length !== 10) return false;
            if (!/^7/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('44')) digits = digits.substring(2);
            if (digits.startsWith('0')) digits = digits.substring(1);
            return digits;
        }
    },
    {
        code: 'DE',
        name: 'Germany',
        dial: '+49',
        minDigits: 10,
        maxDigits: 11,
        mobilePrefix: /^1[567]/,
        validate: (digits) => {
            if (digits.length < 10 || digits.length > 11) return false;
            if (!/^1[567]/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('49')) digits = digits.substring(2);
            if (digits.startsWith('0')) digits = digits.substring(1);
            return digits;
        }
    },
    {
        code: 'FR',
        name: 'France',
        dial: '+33',
        minDigits: 9,
        maxDigits: 9,
        mobilePrefix: /^[67]/,
        validate: (digits) => {
            if (digits.length !== 9) return false;
            if (!/^[67]/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('33')) digits = digits.substring(2);
            if (digits.startsWith('0')) digits = digits.substring(1);
            return digits;
        }
    },
    {
        code: 'IT',
        name: 'Italy',
        dial: '+39',
        minDigits: 9,
        maxDigits: 10,
        mobilePrefix: /^3/,
        validate: (digits) => {
            if (digits.length < 9 || digits.length > 10) return false;
            if (!/^3/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('39')) digits = digits.substring(2);
            return digits;
        }
    },
    {
        code: 'ES',
        name: 'Spain',
        dial: '+34',
        minDigits: 9,
        maxDigits: 9,
        mobilePrefix: /^[67]/,
        validate: (digits) => {
            if (digits.length !== 9) return false;
            if (!/^[67]/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('34')) digits = digits.substring(2);
            return digits;
        }
    },
    {
        code: 'NL',
        name: 'Netherlands',
        dial: '+31',
        minDigits: 9,
        maxDigits: 9,
        mobilePrefix: /^6/,
        validate: (digits) => {
            if (digits.length !== 9) return false;
            if (!/^6/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('31')) digits = digits.substring(2);
            if (digits.startsWith('0')) digits = digits.substring(1);
            return digits;
        }
    },
    {
        code: 'SE',
        name: 'Sweden',
        dial: '+46',
        minDigits: 9,
        maxDigits: 9,
        mobilePrefix: /^7/,
        validate: (digits) => {
            if (digits.length !== 9) return false;
            if (!/^7/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('46')) digits = digits.substring(2);
            if (digits.startsWith('0')) digits = digits.substring(1);
            return digits;
        }
    },
    {
        code: 'CH',
        name: 'Switzerland',
        dial: '+41',
        minDigits: 9,
        maxDigits: 9,
        mobilePrefix: /^7/,
        validate: (digits) => {
            if (digits.length !== 9) return false;
            if (!/^7/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('41')) digits = digits.substring(2);
            if (digits.startsWith('0')) digits = digits.substring(1);
            return digits;
        }
    },

    // Other Regions
    {
        code: 'TR',
        name: 'Turkey',
        dial: '+90',
        minDigits: 10,
        maxDigits: 10,
        mobilePrefix: /^5/,
        validate: (digits) => {
            if (digits.length !== 10) return false;
            if (!/^5/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('90')) digits = digits.substring(2);
            if (digits.startsWith('0')) digits = digits.substring(1);
            return digits;
        }
    },
    {
        code: 'AU',
        name: 'Australia',
        dial: '+61',
        minDigits: 9,
        maxDigits: 9,
        mobilePrefix: /^4/,
        validate: (digits) => {
            if (digits.length !== 9) return false;
            if (!/^4/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('61')) digits = digits.substring(2);
            if (digits.startsWith('0')) digits = digits.substring(1);
            return digits;
        }
    },
    {
        code: 'BR',
        name: 'Brazil',
        dial: '+55',
        minDigits: 10,
        maxDigits: 11,
        mobilePrefix: /^[9]/,
        validate: (digits) => {
            if (digits.length < 10 || digits.length > 11) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('55')) digits = digits.substring(2);
            return digits;
        }
    },
    {
        code: 'PK',
        name: 'Pakistan',
        dial: '+92',
        minDigits: 10,
        maxDigits: 10,
        mobilePrefix: /^3/,
        validate: (digits) => {
            if (digits.length !== 10) return false;
            if (!/^3/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('92')) digits = digits.substring(2);
            if (digits.startsWith('0')) digits = digits.substring(1);
            return digits;
        }
    },
    {
        code: 'BD',
        name: 'Bangladesh',
        dial: '+880',
        minDigits: 10,
        maxDigits: 10,
        mobilePrefix: /^1[3-9]/,
        validate: (digits) => {
            if (digits.length !== 10) return false;
            if (!/^1[3-9]/.test(digits)) return false;
            return true;
        },
        normalize: (phone) => {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('880')) digits = digits.substring(3);
            if (digits.startsWith('0')) digits = digits.substring(1);
            return digits;
        }
    }
];

// Export for browser
if (typeof window !== 'undefined') {
    window.COUNTRIES = COUNTRIES;
}

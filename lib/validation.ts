const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERU_MOBILE_RE = /^9\d{8}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/**
 * Normalizes a Peruvian mobile number to E.164 (+51XXXXXXXXX).
 * Accepts 9-digit local numbers or numbers already prefixed with +51/51.
 * Returns null if the input isn't a valid Peruvian mobile number.
 */
export function toE164Peru(value: string): string | null {
  const stripped = value.replace(/[\s-]/g, '');
  const digits = stripped.startsWith('+51')
    ? stripped.slice(3)
    : stripped.startsWith('51') && stripped.length === 11
      ? stripped.slice(2)
      : stripped;

  if (!PERU_MOBILE_RE.test(digits)) {
    return null;
  }
  return `+51${digits}`;
}

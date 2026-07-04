import { isValidEmail, toE164Peru } from '@/lib/validation';

describe('isValidEmail', () => {
  it('accepts a standard email', () => {
    expect(isValidEmail('ana@example.com')).toBe(true);
  });

  it('rejects a string without @', () => {
    expect(isValidEmail('ana.example.com')).toBe(false);
  });

  it('rejects an email without a domain', () => {
    expect(isValidEmail('ana@')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

describe('toE164Peru', () => {
  it('converts a 9-digit mobile number to E.164', () => {
    expect(toE164Peru('987654321')).toBe('+51987654321');
  });

  it('accepts a number already prefixed with +51', () => {
    expect(toE164Peru('+51987654321')).toBe('+51987654321');
  });

  it('strips spaces and dashes before validating', () => {
    expect(toE164Peru('987 654 321')).toBe('+51987654321');
    expect(toE164Peru('987-654-321')).toBe('+51987654321');
  });

  it('rejects a number that does not start with 9', () => {
    expect(toE164Peru('123456789')).toBeNull();
  });

  it('rejects a number with the wrong length', () => {
    expect(toE164Peru('98765')).toBeNull();
    expect(toE164Peru('9876543210')).toBeNull();
  });

  it('rejects non-numeric input', () => {
    expect(toE164Peru('abcdefghi')).toBeNull();
  });
});

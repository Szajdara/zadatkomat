import type { NextRequest } from 'next/server';

interface RateBucket {
  count: number;
  resetAt: number;
}

const globalForRateLimit = globalThis as unknown as {
  __zadatkomatRateLimit?: Map<string, RateBucket>;
};

const buckets: Map<string, RateBucket> =
  globalForRateLimit.__zadatkomatRateLimit ?? new Map<string, RateBucket>();

if (!globalForRateLimit.__zadatkomatRateLimit) {
  globalForRateLimit.__zadatkomatRateLimit = buckets;
}

export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) {
    return fwd.split(',')[0].trim() || '127.0.0.1';
  }
  return req.headers.get('x-real-ip')?.trim() || '127.0.0.1';
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();

  if (buckets.size > 5000) {
    for (const [k, v] of buckets.entries()) {
      if (v.resetAt <= now) {
        buckets.delete(k);
      }
    }
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;
  buckets.set(key, existing);

  if (existing.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function assertSameOrigin(req: NextRequest): boolean {
  const secFetchSite = req.headers.get('sec-fetch-site');
  if (secFetchSite && secFetchSite === 'cross-site') {
    return false;
  }

  const origin = req.headers.get('origin');
  if (!origin) {
    return true;
  }

  const host =
    req.headers.get('x-forwarded-host')?.split(',')[0].trim() ||
    req.headers.get('host')?.trim();

  if (!host) {
    return false;
  }

  try {
    const originHost = new URL(origin).host;
    return originHost.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

export function escapeHtml(input: string): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeText(input: string, maxLen = 250): string {
  return String(input ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function sanitizeIcsField(input: string): string {
  return String(input ?? '')
    .replace(/[\r\n\u0000-\u001F\u007F]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .trim();
}

export function maskSecret(secret?: string): string {
  const trimmed = secret?.trim() || '';
  if (!trimmed) return '';
  if (trimmed.length <= 6) return '••••••';
  return `••••••${trimmed.slice(-4)}`;
}

export function isMaskedSecret(value?: string): boolean {
  return Boolean(value && value.includes('••••'));
}

export function maskPhone(phone?: string): string {
  const raw = phone?.trim() || '';
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 4) return '•••';
  return `••• ••• ${digits.slice(-3)}`;
}

export function maskEmail(email?: string): string | undefined {
  const raw = email?.trim();
  if (!raw || !raw.includes('@')) return undefined;
  const [local, domain] = raw.split('@');
  if (!local || !domain) return undefined;
  return `${local[0]}•••@${domain}`;
}

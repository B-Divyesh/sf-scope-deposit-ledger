import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');

describe('static deployment policy', () => {
  it('ships a CSP that permits only the app and explicit Sociobot license API', () => {
    const config = JSON.parse(readFileSync(resolve(root, 'public/staticwebapp.config.json'), 'utf8')) as { globalHeaders: Record<string, string> };
    const csp = config.globalHeaders['Content-Security-Policy'];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self' https://api.sociobot.in");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain('*');
  });
});

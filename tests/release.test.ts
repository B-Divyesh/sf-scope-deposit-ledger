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

  it('keeps Azure deployment-control files out of the public SW precache and avoids CSP-blocked handlers', () => {
    const stamp = readFileSync(resolve(root, 'scripts/stamp-release.mjs'), 'utf8');
    const app = readFileSync(resolve(root, 'src/app.ts'), 'utf8');
    expect(stamp).toContain("file !== '/staticwebapp.config.json'");
    expect(stamp).toContain("file !== '/_headers'");
    expect(app).not.toContain('onclick=');
    expect(app).not.toContain('style="width:');
    expect(app).toContain('<progress class="progress"');
  });
});

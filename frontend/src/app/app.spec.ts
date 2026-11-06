import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideUiKit } from '@stupa-makers/ui-kit';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App } from './app';

function mockScheme(dark: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: dark && query.includes('dark'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
}

describe('App', () => {
  for (const dark of [true, false]) {
    it(`systemTheme: follows the system theme (${dark ? 'dark' : 'light'}) (§NF/usability/layout/000038)`, () => {
      mockScheme(dark);
      localStorage.clear();
      TestBed.configureTestingModule({
        providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideUiKit()],
      });
      TestBed.runInInjectionContext(() => new App());
      expect(document.documentElement.getAttribute('data-theme')).toBe(dark ? 'dark' : 'light');
    });
  }
});

describe('index.html', () => {
  it('noThirdParty: loads no script, font or image from a different host (§NF/privacy/personal-data/000040)', () => {
    const root = join(__dirname, '..', '..');
    const html = readFileSync(join(root, 'src', 'index.html'), 'utf8');
    const styles = readFileSync(join(root, 'src', 'styles.scss'), 'utf8');
    const fonts = readFileSync(join(root, 'vendor', 'ui-kit', 'src', 'styles', 'fonts.scss'), 'utf8');
    expect(html).not.toMatch(/(src|href)=["'](https?:)?\/\//);
    expect(styles + fonts).not.toMatch(/url\(\s*["']?(https?:)?\/\//);
    expect(styles + fonts).not.toMatch(/@import\s+["']?(https?:)?\/\//);
  });
});

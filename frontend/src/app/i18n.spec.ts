import { TestBed } from '@angular/core/testing';
import { I18n, TEXTS, pickLang } from './i18n';

describe('language', () => {
  it('pickLang: follows the browser and falls back to German (§NF/accessibility/language/000039)', () => {
    expect(pickLang(['en-US', 'de'])).toBe('en');
    expect(pickLang(['fr-FR', 'de-AT'])).toBe('de');
    expect(pickLang(['fr-FR'])).toBe('de');
    expect(pickLang([])).toBe('de');
  });

  it('texts: German and English have the same keys', () => {
    expect(Object.keys(TEXTS.en).sort()).toEqual(Object.keys(TEXTS.de).sort());
  });

  it('translate: fills parameters and keeps an unknown key', () => {
    const i18n = TestBed.inject(I18n);
    i18n.lang.set('en');
    expect(i18n.t('line', { n: 4 })).toBe('Line 4');
    expect(i18n.t('line')).toBe('Line {n}');
    i18n.lang.set('de');
    expect(i18n.t('refs')).toBe('Verweise');
    expect(i18n.t('unknown.key')).toBe('unknown.key');
  });
});

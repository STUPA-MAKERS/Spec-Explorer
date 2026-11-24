import { computed, signal } from '@angular/core';
import type { FrameworkConfig, ShellNavItem } from '@stupa-makers/ui-kit/shell';
import { SOURCE } from './data.service';
import { LANG, translate as t } from './i18n';

/** The host of the platform: its accessibility statement covers the explorer too. */
export const PLATFORM = 'https://workflow.reutlingen.university';
/** §NF/accessibility/statement/000077: the statement of the platform names the explorer. */
export const STATEMENT = `${PLATFORM}/barrierefreiheit`;

/**
 * The one config of the explorer for the kit framework: brand, the three pages, the phone
 * bar, the statement of the platform and the ports. The explorer has no login, so the session
 * is always the rail frame without a person. §S/frontend/angular/000106
 */
export function explorerConfig(): FrameworkConfig {
  const nav = computed<readonly ShellNavItem[]>(() => {
    const source = [SOURCE.repo(), encodeURIComponent(SOURCE.ref())].join('/');
    return [
      { key: 'specs', path: `/${source}`, label: t('specs'), icon: 'document', place: 'main' },
      { key: 'refs', path: `/verweise/${source}`, label: t('refs'), icon: 'link', place: 'main' },
      { key: 'uml', path: `/${source}/uml`, label: t('uml'), icon: 'shapes', place: 'main' },
    ];
  });
  return {
    brand: { name: 'Spec-Explorer', home: '/', mark: '/logos/stupa-mark.svg' },
    nav,
    bar: signal(['specs', 'refs', 'uml']),
    a11yStatement: STATEMENT,
    // §NF/accessibility/statement/000078: the statement of the platform opens the report.
    reportBarrier: true,
    languages: [
      { value: 'de', label: 'Deutsch' },
      { value: 'en', label: 'English' },
    ],
    language: {
      current: LANG,
      set: (value) => LANG.set(value === 'en' ? 'en' : 'de'),
    },
    theme: { storageKey: 'spec-explorer.theme' },
    ports: {
      session: { frame: signal('rail'), person: signal(null), logout: () => undefined },
    },
  };
}

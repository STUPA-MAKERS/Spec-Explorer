import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { inject, provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { loadingInterceptor, provideUiKit, uiKitIntlFromLang } from '@stupa-makers/ui-kit';
import { provideRouteMotion } from '@stupa-makers/ui-kit/shell';
import { App } from './app/app';
import { I18n } from './app/i18n';
import { routes } from './app/routes';

bootstrapApplication(App, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), provideRouteMotion()),
    provideHttpClient(withInterceptors([loadingInterceptor])),
    provideUiKit({ intl: () => uiKitIntlFromLang(inject(I18n).lang) }),
  ],
}).catch((e: unknown) => console.error(e));

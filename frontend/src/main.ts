import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { loadingInterceptor } from '@stupa-makers/ui-kit';
import { provideFramework, provideRouteMotion } from '@stupa-makers/ui-kit/shell';
import { App } from './app/app';
import { explorerConfig } from './app/config';
import { routes } from './app/routes';

bootstrapApplication(App, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding(), provideRouteMotion()),
    provideHttpClient(withInterceptors([loadingInterceptor])),
    provideFramework(explorerConfig()),
  ],
}).catch((e: unknown) => console.error(e));

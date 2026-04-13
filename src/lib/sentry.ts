import * as Sentry from '@sentry/react';
import { APP_VERSION } from './version';

const DSN = 'https://aa047b3bd9201b7100a67a4cc4fcea0c@o4511213717553152.ingest.de.sentry.io/4511213723975760';

export function initSentry(): void {
  if (typeof window === 'undefined') return;

  console.log('[Sentry] mode:', import.meta.env.MODE, '| prod:', import.meta.env.PROD);

  if (import.meta.env.MODE === 'development') {
    console.log('[Sentry] Skipped (dev mode)');
    return;
  }

  try {
    Sentry.init({
      dsn: DSN,
      release: APP_VERSION,
      environment: 'production',
      tracesSampleRate: 0.05,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        Sentry.replayIntegration({
          maskAllText: true,
          maskAllInputs: true,
          blockAllMedia: true,
        }),
      ],
      beforeSend(event) {
        if (event.user) {
          event.user = { id: event.user.id };
        }
        return event;
      },
    });
    console.log('[Sentry] Init OK. isInitialized:', Sentry.isInitialized());
  } catch (e) {
    console.error('[Sentry] Init FAILED:', e);
  }
}

export function sendTestError(): void {
  console.log('[Sentry] Sending test error. isInitialized:', Sentry.isInitialized());
  Sentry.captureException(new Error('[Fluxia] Sentry test event'));
}

export const ErrorBoundary = Sentry.ErrorBoundary;
export const captureException = Sentry.captureException;

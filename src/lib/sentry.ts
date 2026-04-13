import * as Sentry from '@sentry/react';
import { APP_VERSION } from './version';

const DSN = 'https://aa047b3bd9201b7100a67a4cc4fcea0c@o4511213717553152.ingest.de.sentry.io/4511213723975760';

/**
 * Initialize Sentry error tracking.
 * - Only active in production (no-op in dev)
 * - EU data region (ingest.de.sentry.io) for GDPR compliance
 * - Privacy-first: all text and inputs masked in session replays
 * - PII stripped from error events before sending
 */
export function initSentry(): void {
  if (typeof window === 'undefined') return;
  if (import.meta.env.MODE === 'development') return;

  Sentry.init({
    dsn: DSN,
    release: APP_VERSION,
    environment: 'production',

    // Performance: sample 5% of page loads (low overhead)
    tracesSampleRate: 0.05,

    // Session Replay: never record normal sessions,
    // but always capture a replay when an error occurs
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,    // Never expose medical data in replays
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],

    // Strip any PII before the event leaves the browser
    beforeSend(event) {
      if (event.user) {
        // Keep only the anonymous user ID, never email or IP
        event.user = { id: event.user.id };
      }
      return event;
    },
  });

}

// Re-export ErrorBoundary and captureException for use in components
export const ErrorBoundary = Sentry.ErrorBoundary;
export const captureException = Sentry.captureException;

import './assets/base.css'

import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import * as Sentry from '@sentry/vue'

import { createI18n } from 'vue-i18n'

// Get the cached language preferrence, if any. Otherwise,
// get the language currently preferred by the
// browser, or use English if it is not available
const browserLocale = (
  localStorage.getItem('languagePreference') ||
  navigator.language ||
  'en'
).slice(0, 2)

const i18n = createI18n({
  legacy: false,
  locale: browserLocale,
  fallbackLocale: 'en'
})

const app = createApp(App)

const feedbackIntegration = Sentry.feedbackIntegration({
  // Additional SDK configuration goes in here, for example:
  colorScheme: 'system',
  showBranding: false,
  autoInject: false
})

Sentry.init({
  enabled: import.meta.env.PROD,
  app,
  dsn: 'https://546d97d526d5375e17160136713489b0@o4507446872834048.ingest.de.sentry.io/4507446875455568',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    feedbackIntegration
  ],
  beforeSend(event, hint) {
    if (event.exception && event.event_id) {
      Sentry.showReportDialog({ eventId: event.event_id })
    }
    return event
  },
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: [/^https:\/\/satradar\.space/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0 // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
})

app.use(i18n)
app.use(router)
app.mount('#app')
feedbackIntegration.attachTo(document.querySelector('#sentryFeedbackButton')!)

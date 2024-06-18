import './assets/base.css'

import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import * as Sentry from "@sentry/vue";

import { createI18n } from 'vue-i18n'

const i18n = createI18n({
    legacy: false,
    locale: "en",
    fallbackLocale: "nl"
})

const app = createApp(App)

Sentry.init({
    app,
    dsn: "https://546d97d526d5375e17160136713489b0@o4507446872834048.ingest.de.sentry.io/4507446875455568",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: [/^https:\/\/satradar\.space/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });

app.use(i18n)
app.use(router)
app.mount('#app')


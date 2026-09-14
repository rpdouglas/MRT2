import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary' // IMPORTED
import './index.css'
import posthog from 'posthog-js'
import { PostHogProvider } from '@posthog/react'
import { onCLS, onINP, onLCP, type Metric } from 'web-vitals'
import { safeCapture } from './lib/telemetry'
import { isAndroidTWA } from './lib/platform'

// PROJ-68/105 follow-up: capture the android-app:// referrer signal as the
// very first thing this module does, before React mounts and long before
// AppShell's PWAUpdateBeacon can exist to trigger a reload that would wipe
// it. See platform.ts's isAndroidTWA() doc comment for why a later call
// site (e.g. PremiumUpgrade.tsx alone) is too late for a user who lands on
// an authenticated route that never calls it (Dashboard, Journal, etc.)
// before accepting an app update.
isAndroidTWA()

if (import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN) {
  posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    defaults: '2026-01-30',
  })
}

// PROJ-94: Core Web Vitals, no PII — just the metric name/value/rating.
function reportWebVital(metric: Metric) {
  safeCapture('web_vital', { name: metric.name, value: Math.round(metric.value), rating: metric.rating })
}
onCLS(reportWebVital)
onINP(reportWebVital)
onLCP(reportWebVital)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <ErrorBoundary>
          <App />
      </ErrorBoundary>
    </PostHogProvider>
  </React.StrictMode>,
)
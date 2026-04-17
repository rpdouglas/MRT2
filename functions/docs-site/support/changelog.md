# 🚀 Changelog

## [v1.1.7] - 2026-04-17
### 🚑 Hotfixes & Infrastructure
- **Bug Fix [PROJ-26]:** Resolved a critical issue in the `dailyBeacon` system where users were not receiving push notifications for tasks due "today" due to a timezone boundary parsing error.
- **System Update:** Upgraded FCM push notification payloads to utilize the modern HTTP v1 `webpush` spec, ensuring notifications reliably launch the PWA dashboard on Android and iOS devices.


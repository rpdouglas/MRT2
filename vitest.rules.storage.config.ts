// Storage rules tests (PROJ-113) need a live emulator, not mocks —
// deliberately excluded from the main vite.config.ts test suite (see its
// exclude list) so `npm run test:once` never hangs waiting for one. This
// config exists solely so `npm run test:rules:storage` can target that one
// file without inheriting the main suite's exclude. Mirrors
// vitest.rules.config.ts's shape for the Firestore rules test.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/storage.rules.test.ts'],
    globals: true,
    environment: 'node',
  },
});

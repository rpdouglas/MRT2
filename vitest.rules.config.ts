// Firestore rules tests (PROJ-99 Phase 2) need a live emulator, not mocks —
// deliberately excluded from the main vite.config.ts test suite (see its
// exclude list) so `npm run test:once` never hangs waiting for one. This
// config exists solely so `npm run test:rules` can target that one file
// without inheriting the main suite's exclude.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/firestore.rules.test.ts', 'src/lib/__tests__/deletion.rules.test.ts'],
    globals: true,
    environment: 'node',
  },
});

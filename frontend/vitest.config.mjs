import { defineVitestConfig } from '@nuxt/test-utils/config';

// Tests run inside a Nuxt environment (auto-imports, useState, useCookie) on happy-dom.
export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
        overrides: {
          // Relative API URL, so requests hit endpoints mocked with registerEndpoint()
          // and never a real backend.
          runtimeConfig: { public: { apiUrl: '' } },
        },
      },
    },
    include: ['test/**/*.test.js'],
    // Starting a Nuxt environment per file can take a while on a busy machine.
    hookTimeout: 60000,
    testTimeout: 20000,
  },
});
